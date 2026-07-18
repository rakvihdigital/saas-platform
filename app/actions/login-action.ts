'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypasses RLS safely on the server side just to get the client_id mapping
)

export async function verifyAndGetClientId(userId: string) {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('client_id')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return { error: 'Profile not found' }
  }

  return { clientId: profile.client_id }
}