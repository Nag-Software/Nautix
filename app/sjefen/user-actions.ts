'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUserDetails(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_user_details', {
    target_user_id: userId,
  })

  if (error) {
    throw new Error(`Failed to get user details: ${error.message}`)
  }

  return data
}
