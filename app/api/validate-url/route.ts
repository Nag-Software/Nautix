import { NextResponse } from 'next/server'

function cleanUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Remove tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref', 'referrer']
    trackingParams.forEach(param => urlObj.searchParams.delete(param))
    return urlObj.toString()
  } catch {
    return url
  }
}

async function validateUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Nautix-Bot/1.0',
      },
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    // If HEAD fails, try GET with timeout
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Nautix-Bot/1.0',
        },
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ valid: false, error: 'Invalid URL' }, { status: 400 })
    }

    const cleanedUrl = cleanUrl(url)
    const isValid = await validateUrl(cleanedUrl)

    return NextResponse.json({ valid: isValid, url: cleanedUrl })
  } catch (error) {
    console.error('Error validating URL:', error)
    return NextResponse.json({ valid: false, error: 'Validation failed' }, { status: 500 })
  }
}
