import { createClient } from '@supabase/supabase-js'
import StorefrontClient from './StorefrontClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Service-role client — server-side only, never expose this key to the browser
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ClientPageProps {
  params: Promise<{
    clientId: string
  }>
}

export default async function PublicClientStorefront({ params }: ClientPageProps) {
  const resolvedParams = await params
  const { clientId } = resolvedParams

  const [companyRes, productsRes, profileRes] = await Promise.all([
    supabase
      .from('companies')
      .select(
        'name, about, logo_url, instagram, facebook, youtube, linkedin, whatsapp, gallery_urls, address, google_maps_url'
      )
      .eq('client_id', clientId)
      .maybeSingle(),
    supabase
      .from('products')
      .select('id, name, description, price, image_url')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle()
  ])

  // Resolve email server-side via the service role client (auth.users is not
  // exposed to the anon key, so this lookup must happen here, not client-side)
  let email = ''
  if (profileRes.data?.id) {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      profileRes.data.id
    )
    if (!userError && userData?.user?.email) {
      email = userData.user.email
    }
  }

  const company = companyRes.data || {
    name: 'Sample Enterprise HQ',
    about: 'This is a sample corporate portal. The company details have not been fully configured in the database yet. Browse our complete live inventory below.',
    logo_url: '/demologo.png',
    instagram: '',
    facebook: '',
    youtube: '',
    linkedin: '',
    whatsapp: '',
    gallery_urls: [],
    address: null,
    google_maps_url: null
  }

  let products = productsRes.data || []

  if (products.length === 0) {
    products = [
      {
        id: 'demo-1',
        name: 'Premium Beauty Collection',
        description: 'Advanced skincare and cosmetics curated for your daily routine.',
        price: 89.99,
        image_url: '/beautyprdoucts.jpg'
      },
      {
        id: 'demo-2',
        name: 'Organic Grocery Bundle',
        description: 'Fresh, sustainably sourced organic produce and daily essentials.',
        price: 45.50,
        image_url: '/groceryproducts.jpg'
      },
      {
        id: 'demo-3',
        name: 'Studio Wireless Headphones',
        description: 'High-fidelity noise-canceling audio for immersive listening.',
        price: 299.00,
        image_url: '/headphone.png'
      }
    ]
  }

  // Same fallback pattern as products: if the company row has no gallery
  // images configured, show demo images instead of an empty section.
  let galleryUrls = company.gallery_urls || []

  if (galleryUrls.length === 0) {
    galleryUrls = ['/beautyprdoucts.jpg', '/groceryproducts.jpg', '/headphone.png']
  }

  // Same fallback pattern for location: if no address/maps link is
  // configured, show a demo Bangalore location instead of hiding the section.
  const address = company.address || 'MG Road, Bengaluru, Karnataka 560001, India'
  const googleMapsUrl =
    company.google_maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`


  return (
    <StorefrontClient
      company={{
        name: company.name || 'Storefront Instance',
        about: company.about || 'Welcome to our verified corporate portal. Browse our complete live inventory and production logistics below.',
        logo_url: company.logo_url || '/demologo.png',
        instagram: company.instagram || '',
        facebook: company.facebook || '',
        youtube: company.youtube || '',
        linkedin: company.linkedin || '',
        whatsapp: company.whatsapp || '',
        gallery_urls: galleryUrls,
        address,
        google_maps_url: googleMapsUrl,
        email: email // <--- Add this line to satisfy the TypeScript interface
      }}
      products={products}
    />
  )
}