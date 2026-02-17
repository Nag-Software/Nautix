import { Buffer } from 'buffer'

export function shouldSearchUserDocumentsForPrompt(prompt: string): boolean {
  const p = (prompt || '').toLowerCase()
  if (!p.trim()) return false

  const keywords = [
    'manual', 'brukermanual', 'dokument', 'hva står', 'hva sier', 'i dokumentet', 'manualen', 'bruksanvisning', 'innhold', 'søk i dokument', 'find manual', 'hva står i manualen'
  ]

  return keywords.some((k) => p.includes(k))
}

export async function extractTextFromBuffer(buffer: ArrayBuffer, filename: string) {
  const name = (filename || '').toLowerCase()
  try {
    if (name.endsWith('.pdf')) {
      // dynamic import so tests can mock 'pdf-parse'
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdf = await import('pdf-parse')
      const data = await pdf.default(Buffer.from(buffer))
      return data.text || ''
    }

    // Try to decode as UTF-8 text for plain text files
    const text = new TextDecoder('utf-8').decode(buffer as ArrayBuffer)
    return text
  } catch (e) {
    return ''
  }
}

export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0
  let norma = 0
  let normb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    norma += a[i] * a[i]
    normb += b[i] * b[i]
  }
  if (norma === 0 || normb === 0) return 0
  return dot / (Math.sqrt(norma) * Math.sqrt(normb))
}

export default { shouldSearchUserDocumentsForPrompt, extractTextFromBuffer, cosineSimilarity }
