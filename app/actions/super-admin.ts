'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypasses RLS to view overview metrics
)

// 1. Fetch System Analytics Metrics
export async function getSuperAdminMetrics() {
  const { count: totalClients, error: clientError } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'client')

  const { count: totalProducts, error: productError } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true })

  return {
    totalClients: totalClients || 0,
    totalProducts: totalProducts || 0
  }
}

// 2. Fetch the Active Client List Table
export async function getClientList() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, client_id, company_name, created_at')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  return data || []
}

// 3. Create Client Account Action
// 3. Create Client Account Action
export async function createClientAccount(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const companyName = formData.get('companyName') as string
  const clientId = (formData.get('clientId') as string).toLowerCase().replace(/\s+/g, '-')

  if (!email || !password || !companyName || !clientId) {
    return { error: 'All fields are required.' }
  }

  // 1. Create user in Supabase Auth management with metadata
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      company_name: companyName,
      client_id: clientId
    }
  })

  if (authError) return { error: authError.message }

  // 2. Direct Explicit Insertion with UPSERT to prevent trigger collision errors
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authUser.user.id,
      client_id: clientId,
      company_name: companyName,
      role: 'client'
    }, { onConflict: 'id' }) // If a background trigger already created a row, update it instead of throwing an error!

  if (profileError) {
    // If the database fails, roll back and remove the auth user
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
    return { error: profileError.message }
  }

  return { success: true }
}