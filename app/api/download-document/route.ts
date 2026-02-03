import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DOWNLOADABLE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.xls', '.xlsx', '.csv', '.ppt', '.pptx', '.zip', '.rar']

function isDownloadableFile(url: string): boolean {
  const urlLower = url.toLowerCase()
  // Exclude .html and .htm files
  if (urlLower.includes('.html') || urlLower.includes('.htm')) {
    return false
  }
  return DOWNLOADABLE_EXTENSIONS.some(ext => urlLower.includes(ext))
}

function getFileExtension(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const lastDot = pathname.lastIndexOf('.')
    if (lastDot === -1) return ''
    return pathname.substring(lastDot)
  } catch {
    return ''
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, title, type, description } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    if (!isDownloadableFile(url)) {
      return NextResponse.json({ 
        error: 'File type not downloadable',
        isDownloadable: false 
      }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Download the file
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    const downloadResponse = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Nautix-Bot/1.0',
      },
    })

    clearTimeout(timeoutId)

    if (!downloadResponse.ok) {
      return NextResponse.json({ error: 'Failed to download file' }, { status: 400 })
    }

    const fileBlob = await downloadResponse.blob()
    const fileExtension = getFileExtension(url)
    const fileName = `${user.id}/${Date.now()}${fileExtension}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, fileBlob, {
        contentType: fileBlob.type,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get or create boat
    let { data: boats } = await supabase
      .from('boats')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    let boatId: string

    if (!boats || boats.length === 0) {
      const { data: newBoat, error: boatError } = await supabase
        .from('boats')
        .insert([{ user_id: user.id }])
        .select('id')
        .single()

      if (boatError) throw boatError
      boatId = newBoat.id
    } else {
      boatId = boats[0].id
    }

    // Save document metadata to database
    const { error: dbError } = await supabase
      .from('documents')
      .insert([{
        boat_id: boatId,
        user_id: user.id,
        name: title || 'Dokument',
        type: type || 'annet',
        file_path: fileName,
        file_size: fileBlob.size,
        status: 'valid',
      }])

    if (dbError) {
      // Cleanup uploaded file if DB insert fails
      await supabase.storage.from('documents').remove([fileName])
      throw dbError
    }

    return NextResponse.json({ 
      success: true,
      fileName,
      fileSize: fileBlob.size
    })

  } catch (error: any) {
    console.error('Error downloading document:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to process document' 
    }, { status: 500 })
  }
}
