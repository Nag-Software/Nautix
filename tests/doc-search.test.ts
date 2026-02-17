import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shouldSearchUserDocumentsForPrompt, extractTextFromBuffer, cosineSimilarity } from '../lib/doc-search'

vi.mock('pdf-parse', () => ({
  default: (buffer: Buffer) => Promise.resolve({ text: 'PDF: Dette er en manual om oljeskift og vedlikehold.' }),
}))

describe('doc-search helpers', () => {
  it('detects when prompt should search user documents', () => {
    expect(shouldSearchUserDocumentsForPrompt('Hva står i manualen for motoren?')).toBe(true)
    expect(shouldSearchUserDocumentsForPrompt('Når byttet jeg olje sist?')).toBe(false)
    expect(shouldSearchUserDocumentsForPrompt('Kan du søke i dokument?')).toBe(true)
  })

  it('extracts text from a fake PDF buffer', async () => {
    const buf = new TextEncoder().encode('fake pdf data').buffer
    const text = await extractTextFromBuffer(buf as ArrayBuffer, 'manual.pdf')
    expect(text).toContain('manual')
    expect(text.length).toBeGreaterThan(10)
  })

  it('computes cosine similarity correctly', () => {
    const a = [1, 0, 0]
    const b = [1, 0, 0]
    const c = [0, 1, 0]
    expect(cosineSimilarity(a, b)).toBeCloseTo(1)
    expect(cosineSimilarity(a, c)).toBeCloseTo(0)
  })
})
