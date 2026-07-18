'use server'

import { createClient } from '@supabase/supabase-js'

// Bypasses server session RLS limits safely to parse tenant asset attachments
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function addProduct(formData: FormData, tenantId: string) {
  const name = formData.get('name') as string
  const price = formData.get('price') as string
  const description = formData.get('description') as string
  const imageFile = formData.get('image') as File | null

  if (!name || !price || !tenantId) {
    return { error: 'Product name and pricing fields are required.' }
  }

  let imageUrl = ''

  // Handle the Image Upload to Supabase Storage if a file was provided
  if (imageFile && imageFile.size > 0) {
    const fileExtension = imageFile.name.split('.').pop()
    const fileName = `${tenantId}/${Date.now()}.${fileExtension}`

    try {
      const arrayBuffer = await imageFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload file directly to our public product-images bucket
      const { error: uploadError } = await supabaseAdmin.storage
        .from('product-images')
        .upload(fileName, buffer, {
          contentType: imageFile.type,
          upsert: true
        })

      if (uploadError) {
        return { error: `Image Upload Failed: ${uploadError.message}` }
      }

      // Grab the public web URL for rendering later
      const { data } = supabaseAdmin.storage
        .from('product-images')
        .getPublicUrl(fileName)

      imageUrl = data.publicUrl
    } catch (e) {
      return { error: 'Failed to process file binary array data stream.' }
    }
  }

  // Insert the final row safely linked with the active client_id workspace tenant
  const { error: dbError } = await supabaseAdmin
    .from('products')
    .insert({
      name,
      price: parseFloat(price),
      description,
      client_id: tenantId,
      image_url: imageUrl // Make sure to add an image_url text column to your products table via SQL if not present!
    })

  if (dbError) return { error: dbError.message }

  return { success: true }
}