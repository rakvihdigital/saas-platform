'use server'

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ENCRYPTION_KEY = Buffer.from(process.env.PROFILE_ENCRYPTION_KEY!, 'hex') // 32 bytes

function encryptPassword(plain: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // store iv + authTag + ciphertext together, base64
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

function decryptPassword(stored: string) {
  const buf = Buffer.from(stored, 'base64')
  const iv = buf.subarray(0, 12)
  const authTag = buf.subarray(12, 28)
  const encrypted = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

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
    .select('id, client_id, company_name, email, password_encrypted, created_at')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  if (!data) return []

  // Decrypt for display in the admin table. Never send this data anywhere
  // other than the authenticated super-admin dashboard.
  return data.map((row) => ({
    ...row,
    password: row.password_encrypted ? decryptPassword(row.password_encrypted) : null
  }))
}

export async function createClientAccount(formData: FormData) {
  const email = formData.get('email') as string
  let password = formData.get('password') as string
  const companyName = formData.get('companyName') as string
  const clientId = (formData.get('clientId') as string).toLowerCase().replace(/\s+/g, '-')

  if (!email || !companyName || !clientId) {
    return { error: 'Company name, slug, and email are required.' }
  }

  if (!password) password = generatePassword()

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { company_name: companyName, client_id: clientId }
  })

  if (authError) return { error: authError.message }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authUser.user.id,
      client_id: clientId,
      company_name: companyName,
      email,
      password_encrypted: encryptPassword(password),
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