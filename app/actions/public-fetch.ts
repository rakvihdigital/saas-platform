'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getClientPublicData(clientId: string) {
  // 1. Fetch company profile details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_name, client_id')
    .eq('client_id', clientId)
    .single()

  if (profileError || !profile) {
    return { error: 'Company workspace not found.' }
  }

  // 2. Fetch all products belonging to this client
  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, price')
    .eq('client_id', clientId)

  // 3. Fetch all locations belonging to this client
  const { data: locations } = await supabase
    .from('locations')
    .select('id, title, address')
    .eq('client_id', clientId)

  return {
    profile,
    products: products || [],
    locations: locations || []
  }
}