import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeLimits } from '../../../../lib/usage'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const form = await req.formData()
    const file = form.get('file') as any
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const boat_id = form.get('boat_id') || null
    const name = form.get('name') || null
    const type = form.get('type') || null
    const expiry_date = form.get('expiry_date') || null

    // Enforce subscription/trial access
    try {
      const usageRes = await fetch('/api/usage')
      const usageJson = await usageRes.json()
      if (!usageJson?.access) {
        return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
      }
    } catch (e) {
      return NextResponse.json({ error: 'Subscription check failed' }, { status: 500 })
    }

    // Compute current docs count
    const docsRes = await supabase.from('documents').select('id', { count: 'exact' }).eq('user_id', user.id)
    const docsUsed = Number(docsRes.count ?? 0)

    // Determine plan from user_profiles (server-side only)
    let plan: string | null = null
    try {
      const { data: profile } = await supabase.from('user_profiles').select('plan').eq('id', user.id).limit(1).single()
      plan = profile?.plan ?? null
    } catch (e) {
      plan = null
    }

    const limits = computeLimits(plan)
    const dLimit = limits.docsLimit

    if (dLimit > 0 && docsUsed >= dLimit) {
      return NextResponse.json({ error: 'Document quota exceeded' }, { status: 403 })
    }

    // Build file name and upload via server-side Supabase storage client
    const filename = typeof file.name === 'string' ? `${user.id}/${Date.now()}-${file.name}` : `${user.id}/${Date.now()}`

    // `file` is a Blob/File from formData; supabase client supports passing Blobs
    const { error: uploadError } = await supabase.storage.from('documents').upload(filename, file as Blob)
    if (uploadError) {
      console.error('Storage upload error', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Insert metadata
    const { error: dbError } = await supabase.from('documents').insert([{
      boat_id: boat_id || null,
      user_id: user.id,
      name: name || null,
      type: type || null,
      file_path: filename,
      file_size: Number((file as any).size || 0),
      expiry_date: expiry_date || null,
      status: 'valid',
    }])

    if (dbError) {
      console.error('DB insert error', dbError)
      return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error in /api/documents/upload POST', err)
    return NextResponse.json({ error: err.message || 'Error' }, { status: 500 })
  }
}
