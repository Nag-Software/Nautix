import { describe, it, expect, vi, afterEach } from 'vitest'

// Mock server supabase client
vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: () => {
      const from = (table: string) => {
        return {
          select: (_sel: string, opts?: any) => {
            const handler: any = {
              eq: (_k: string, _v: any) => handler,
              limit: (_n: number) => ({ single: () => Promise.resolve(getResponseFor(table, opts)) }),
              single: () => Promise.resolve(getResponseFor(table, opts)),
            }

            handler.then = (onF: any, onR: any) => Promise.resolve(getResponseFor(table, opts)).then(onF, onR)
            return handler
          },
          insert: (rows: any[]) => {
            // For tests we'll simulate success by returning no error
            return Promise.resolve({ data: rows[0], error: null })
          }
        }
      }

      const auth = {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
      }

      return { from, auth }
    }
  }
})

function getResponseFor(table: string, opts?: any) {
  if (table === 'documents') return { count: 1 }
  if (table === 'user_profiles') return { data: { plan: 'matros' }, error: null }
  return {}
}

describe('/api/documents route', () => {
  afterEach(() => vi.restoreAllMocks())

  it('allows insert when under quota', async () => {
    // make computeLimits return a high limit (matros has 15 docs by default but our mock count is 1)
    const { POST } = await import('../../app/api/documents/route')

    const req = new Request('http://localhost/api/documents', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ boat_id: 'b1', name: 'Test', type: 'annet', file_path: 'u/f', file_size: 1234 }),
    })

    const res: any = await POST(req as any)
    expect(res).toBeDefined()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('blocks insert when quota exceeded', async () => {
    // override documents count to be >= limit by remocking the server client
    vi.resetModules()
    vi.doMock('@/lib/supabase/server', () => {
      return {
        createClient: () => {
          const from = (table: string) => {
            return {
              select: (_sel: string, opts?: any) => {
                const handler: any = {
                  eq: (_k: string, _v: any) => handler,
                  limit: (_n: number) => ({ single: () => Promise.resolve(getResponseFor2(table, opts)) }),
                  single: () => Promise.resolve(getResponseFor2(table, opts)),
                }
                handler.then = (onF: any, onR: any) => Promise.resolve(getResponseFor2(table, opts)).then(onF, onR)
                return handler
              },
              insert: (rows: any[]) => Promise.resolve({ data: rows[0], error: null })
            }
          }
          const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) }
          return { from, auth }
        }
      }
    })

    const { POST } = await import('../../app/api/documents/route')

    const req = new Request('http://localhost/api/documents', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ boat_id: 'b1', name: 'Test2', type: 'annet', file_path: 'u/f2', file_size: 1234 }),
    })

    const res: any = await POST(req as any)
    expect(res).toBeDefined()
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Document quota exceeded')
  })
})

function getResponseFor2(table: string, opts?: any) {
  if (table === 'documents') return { count: 999 }
  if (table === 'user_profiles') return { data: { plan: 'matros' }, error: null }
  return {}
}
