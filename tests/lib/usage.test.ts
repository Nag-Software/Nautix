import { describe, it, expect, vi } from 'vitest'
import { computeLimits, oneMonthIso, countUserMessages } from '../../lib/usage'

describe('usage helpers', () => {
  it('oneMonthIso is ~30 days ago', () => {
    const iso = oneMonthIso()
    const diff = Date.now() - new Date(iso).getTime()
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    // allow small timing difference
    expect(Math.abs(diff - thirtyDays)).toBeLessThan(5000)
  })

  it('computeLimits returns correct limits for plans', () => {
    expect(computeLimits('matros')).toEqual({ chatsLimit: 30, logsLimit: 15, docsLimit: 15 })
    expect(computeLimits('maskinist')).toEqual({ chatsLimit: 60, logsLimit: 30, docsLimit: 30 })
    expect(computeLimits('kaptein')).toEqual({ chatsLimit: 0, logsLimit: 0, docsLimit: 0 })
    expect(computeLimits(null)).toEqual({ chatsLimit: 0, logsLimit: 0, docsLimit: 0 })
  })

  it('countUserMessages calls supabase with correct filters and returns count', async () => {
    const mockRes = { count: 5 }

    // create a chainable mock that records calls
    const eq = vi.fn().mockReturnThis()
    const gte = vi.fn().mockResolvedValue(mockRes)
    const select = vi.fn().mockReturnValue({ eq, gte })
    const from = vi.fn().mockReturnValue({ select })

    const supabase: any = { from }

    const result = await countUserMessages(supabase, 'user_123')

    expect(result).toBe(5)
    expect(from).toHaveBeenCalledWith('messages')
    expect(select).toHaveBeenCalledWith('id', { count: 'exact' })
    // Check eq was called for user_id and role
    expect(eq).toHaveBeenCalled()
    // The first eq call should be user_id
    expect(eq.mock.calls[0][0]).toBe('user_id')
    expect(eq.mock.calls[0][1]).toBe('user_123')
    // The second eq call should be role
    expect(eq.mock.calls[1][0]).toBe('role')
    expect(eq.mock.calls[1][1]).toBe('user')
    // gte called with a recent ISO
    expect(gte).toHaveBeenCalled()
  })
})
