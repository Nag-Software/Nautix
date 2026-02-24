import { describe, it, expect, vi, afterEach } from 'vitest'

// Mock server supabase client for upload endpoint
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
          upload: async (_path: string, _file: any) => ({ error: null }),
          insert: async (rows: any[]) => ({ data: rows[0], error: null }),
        }
      }

      const auth = {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
      }

      const storage = { from: (bucket: string) => ({ upload: async (_p: string, _f: any) => ({ error: null }) }) }

      return { from, auth, storage }
    }
  }
})

function getResponseFor(table: string, opts?: any) {
  if (table === 'documents') return { count: 1 }
  if (table === 'user_profiles') return { data: { plan: 'matros' }, error: null }
  return {}
}

function getResponseFor2(table: string, opts?: any) {
  if (table === 'documents') return { count: 999 }
  if (table === 'user_profiles') return { data: { plan: 'matros' }, error: null }
  return {}
}

describe('/api/documents/upload route', () => {
  afterEach(() => vi.restoreAllMocks())

  it('allows upload when under quota', async () => {
    const { POST } = await import('../../app/api/documents/upload/route')

    // Build a fake FormData by creating a Request with a Blob body and appropriate headers
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' })

    const formData = { get: (k: string) => {
      if (k === 'file') return file
      if (k === 'boat_id') return 'b1'
      if (k === 'name') return 'Test'
      if (k === 'type') return 'annet'
      return null
    }} as any

    const req = { formData: async () => formData } as any as Request

    const res: any = await POST(req)
    expect(res).toBeDefined()
    const body = await res.json()
    if (res.status !== 200) console.error('Upload route error body:', body)
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('blocks upload when quota exceeded', async () => {
    // remock createClient to return documents count exceeding limit
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
              insert: async (rows: any[]) => ({ data: rows[0], error: null })
            }
          }
          const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) }
          return { from, auth, storage: { from: (_: string) => ({ upload: async () => ({ error: null }) }) } }
        }
      }
    })

    const { POST } = await import('../../app/api/documents/upload/route')

    const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
    const formData = { get: (k: string) => {
      if (k === 'file') return file
      if (k === 'boat_id') return 'b1'
      if (k === 'name') return 'Test'
      if (k === 'type') return 'annet'
      return null
    }} as any

    const req = { formData: async () => formData } as any as Request

    const res: any = await POST(req)
    expect(res).toBeDefined()
    const body = await res.json()
    if (res.status !== 403) console.error('Upload blocked route error body:', body)
    expect(res.status).toBe(403)
    expect(body.error).toBe('Document quota exceeded')
  })
})
