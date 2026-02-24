import { describe, it, expect, vi, afterEach } from 'vitest'

// Mock the Supabase server client module used by the route
vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: () => {
      // Simple chainable mock for `from(...).select(...).eq(...).gte(...)` etc.
      const from = (table: string) => {
        return {
          select: (_sel: string, opts?: any) => {
            const handler: any = {
              // eq returns the handler so callers may chain .gte(), or the handler is thenable
              eq: (_k: string, _v: any) => handler,
              gte: (_k: string, _v: any) => Promise.resolve(getResponseFor(table, opts)),
              limit: (_n: number) => ({ single: () => Promise.resolve(getResponseFor(table, opts)) }),
              single: () => Promise.resolve(getResponseFor(table, opts)),
            }

            // Make handler thenable so awaiting select().eq(...) resolves to the mocked response
            handler.then = (onFulfilled: any, onRejected: any) => {
              return Promise.resolve(getResponseFor(table, opts)).then(onFulfilled, onRejected)
            }

            return handler
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
  // Return shapes matching what the route expects
  if (table === 'messages') return { count: 33 }
  if (table === 'maintenance_log') return { count: 2 }
  if (table === 'documents') return { count: 0 }
  if (table === 'user_profiles') return { data: { plan: null, stripe_customer_id: 'cus_test_123' }, error: null }
  return {}
}

describe('/api/usage route', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns limits derived from subscription when user_profiles.plan is null', async () => {
    // Mock stripe client to return subscription data for the customer
    vi.mock('@/lib/stripe', () => {
      return {
        default: {
          subscriptions: {
            list: vi.fn(async (opts: any) => {
              return {
                data: [
                  {
                    id: 'sub_1',
                    status: 'active',
                    current_period_end: Math.floor(Date.now() / 1000) + 3600,
                    items: { data: [ { price: { id: 'price_matros_yearly' } } ] }
                  }
                ]
              }
            })
          }
        }
      }
    })

    // Import the handler after mocks are set up
    const { GET } = await import('../../app/api/usage/route')

    const req = new Request('http://localhost/api/usage', {
      headers: { host: 'localhost:3000', 'x-forwarded-proto': 'http' }
    })

    const res: any = await GET(req as any)
    const body = await res.json()

    expect(body).toBeDefined()
    // chatsUsed should reflect messages count (33) and chatsLimit should be 30 for 'matros'
    expect(body.chatsUsed).toBe(33)
    expect(body.chatsLimit).toBe(30)
    expect(body.logsUsed).toBe(2)
    expect(body.logsLimit).toBe(15)
  })
})
