'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function grantAdminAccess(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase.from('admin_users').insert({
    user_id: userId,
    granted_by: user.id,
  })

  if (error) {
    throw new Error(`Failed to grant admin access: ${error.message}`)
  }

  revalidatePath('/sjefen')
}

export async function revokeAdminAccess(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to revoke admin access: ${error.message}`)
  }

  revalidatePath('/sjefen')
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`)
  }

  revalidatePath('/sjefen')
}

export async function updateTicketStatus(ticketId: string, newStatus: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('support_tickets')
    .update({ 
      status: newStatus, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', ticketId)

  if (error) {
    throw new Error(`Failed to update ticket: ${error.message}`)
  }

  revalidatePath('/sjefen')
}
