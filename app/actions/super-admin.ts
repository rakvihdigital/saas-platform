'use server'

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  const bytes = crypto.randomBytes(length)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

export async function getSuperAdminMetrics() {
  const { count: totalClients } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'client')

  const { count: totalProducts } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true })

  return {
    totalClients: totalClients || 0,
    totalProducts: totalProducts || 0
  }
}

export async function getClientList() {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, client_id, company_name, email, created_at')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  return data || []
}

export async function createClientAccount(formData: FormData) {
  const email = formData.get('email') as string
  let password = formData.get('password') as string
  const companyName = formData.get('companyName') as string
  const clientId = (formData.get('clientId') as string).toLowerCase().replace(/\s+/g, '-')

  if (!email || !companyName || !clientId) {
    return { error: 'Company name, slug, and email are required.' }
  }

  // Auto-generate if left blank
  if (!password) password = generatePassword()

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { company_name: companyName, client_id: clientId }
  })

  if (authError) return { error: authError.message }

  const passwordHash = await bcrypt.hash(password, 10)

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authUser.user.id,
      client_id: clientId,
      company_name: companyName,
      email,
      password_hash: passwordHash,
      role: 'client'
    }, { onConflict: 'id' })

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
    return { error: profileError.message }
  }

  return {
    success: true,
    credentials: { email, password, clientId }
  }
}

export async function deleteClientAccount(id: string) {
  // Deleting the auth user cascades to profiles via the FK ON DELETE CASCADE
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function resetClientPassword(id: string) {
  const newPassword = generatePassword()

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
    password: newPassword
  })
  if (authError) return { error: authError.message }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ password_hash: passwordHash })
    .eq('id', id)

  if (profileError) return { error: profileError.message }

  return { success: true, password: newPassword }
}