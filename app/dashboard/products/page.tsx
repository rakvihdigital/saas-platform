'use client'

import React, { useState, useEffect } from 'react'
import { addProduct } from '@/app/actions/client-actions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ActiveTab = 'inventory' | 'company'

interface CompanyDetails {
  name: string
  about: string
  logo_url: string
  instagram: string
  facebook: string
  youtube: string
  linkedin: string
  whatsapp: string
  gallery_urls: string[]
  address: string
  google_maps_url: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
}

export default function ClientProductsDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory')
  const [loading, setLoading] = useState(false)
  const [companyLoading, setCompanyLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [company, setCompany] = useState<CompanyDetails>({
    name: '',
    about: '',
    logo_url: '',
    instagram: '',
    facebook: '',
    youtube: '',
    linkedin: '',
    whatsapp: '',
    gallery_urls: [],
    address: '',
    google_maps_url: ''
  })

  // --- New state for View / Edit / Delete ---
  const [viewProduct, setViewProduct] = useState<Product | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadWorkspaceData(explicitId: string) {
    // 1. Fetch Dynamic Products Catalog
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, name, description, price, image_url')
      .eq('client_id', explicitId)
      .order('created_at', { ascending: false })

    if (productError) {
      console.error('Supabase products fetch error:', productError.message)
    } else if (productData) {
      setProducts(productData)
    }

    // 2. Fetch Company Profiles Meta Record Safely
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('name, about, logo_url, instagram, facebook, youtube, linkedin, whatsapp, gallery_urls, address, google_maps_url')
      .eq('client_id', explicitId)
      .maybeSingle()

    if (companyError) {
      console.error('Supabase company fetch error:', companyError.message)
    } else if (companyData) {
      setCompany({
        name: companyData.name || '',
        about: companyData.about || '',
        logo_url: companyData.logo_url || '',
        instagram: companyData.instagram || '',
        facebook: companyData.facebook || '',
        youtube: companyData.youtube || '',
        linkedin: companyData.linkedin || '',
        whatsapp: companyData.whatsapp || '',
        gallery_urls: companyData.gallery_urls || [],
        address: companyData.address || '',
        google_maps_url: companyData.google_maps_url || ''
      })
    }
  }

  useEffect(() => {
    const id = localStorage.getItem('tenant_client_id')
    if (id) {
      setTenantId(id)
      loadWorkspaceData(id)
    } else {
      setMsg({ type: 'error', text: 'Workspace validation failed: Please re-authenticate your operational session.' })
    }
  }, [])

  async function handleCreateProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (products.length >= 10) {
      setMsg({ type: 'error', text: 'Limit reached: You can only upload a maximum of 10 products.' })
      return
    }

    const currentTenantId = tenantId || localStorage.getItem('tenant_client_id')

    if (!currentTenantId) {
      setMsg({ type: 'error', text: 'No active session token recovered.' })
      return
    }

    setLoading(true)
    setMsg(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    const res = await addProduct(formData, currentTenantId)

    setLoading(false)
    if (res?.error) {
      setMsg({ type: 'error', text: res.error })
    } else {
      setMsg({ type: 'success', text: '🎉 Product successfully published to your active catalog!' })
      form.reset()
      loadWorkspaceData(currentTenantId)
    }
  }

  // --- Delete product ---
  async function handleDeleteProduct(product: Product) {
    const confirmed = window.confirm(`Delete "${product.name}"? This action cannot be undone.`)
    if (!confirmed) return

    setDeletingId(product.id)
    setMsg(null)

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)

    setDeletingId(null)

    if (error) {
      setMsg({ type: 'error', text: `Delete failed: ${error.message}` })
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      setMsg({ type: 'success', text: `🗑️ "${product.name}" was removed from your catalog.` })
    }
  }

  // --- Edit product (submit) ---
  async function handleEditProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editProduct) return

    const currentTenantId = tenantId || localStorage.getItem('tenant_client_id')
    if (!currentTenantId) {
      setMsg({ type: 'error', text: 'No active session token recovered.' })
      return
    }

    setEditLoading(true)
    setMsg(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('edit_name') as string
    const price = parseFloat(formData.get('edit_price') as string)
    const description = formData.get('edit_description') as string
    const imageFile = formData.get('edit_image') as File

    let imageUrl = editProduct.image_url

    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop()
      const filePath = `${currentTenantId}/product-${editProduct.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, imageFile, { cacheControl: '3600', upsert: true })

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('brand-assets').getPublicUrl(filePath)
        imageUrl = publicUrlData.publicUrl
      } else {
        setMsg({ type: 'error', text: `Image upload failed: ${uploadError.message}` })
        setEditLoading(false)
        return
      }
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({
        name,
        price,
        description,
        image_url: imageUrl
      })
      .eq('id', editProduct.id)
      .eq('client_id', currentTenantId)

    setEditLoading(false)

    if (updateError) {
      setMsg({ type: 'error', text: `Update failed: ${updateError.message}` })
    } else {
      setMsg({ type: 'success', text: `✅ "${name}" was updated successfully.` })
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editProduct.id ? { ...p, name, price, description, image_url: imageUrl } : p
        )
      )
      setEditProduct(null)
    }
  }

  async function handleUpdateCompany(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const currentTenantId = tenantId || localStorage.getItem('tenant_client_id')

    if (!currentTenantId) {
      setMsg({ type: 'error', text: 'No active session token recovered.' })
      return
    }

    setCompanyLoading(true)
    setMsg(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('company_name') as string
    const about = formData.get('company_about') as string
    const instagram = formData.get('instagram') as string
    const facebook = formData.get('facebook') as string
    const youtube = formData.get('youtube') as string
    const linkedin = formData.get('linkedin') as string
    const whatsapp = formData.get('whatsapp') as string
    const address = formData.get('address') as string
    const googleMapsUrl = formData.get('google_maps_url') as string
    const logoFile = formData.get('company_logo') as File
    const galleryFiles = formData.getAll('gallery_images') as File[]

    let uploadedLogoUrl = company.logo_url
    let uploadedGalleryUrls = [...company.gallery_urls]

    if (logoFile && logoFile.size > 0) {
      const fileExt = logoFile.name.split('.').pop()
      const filePath = `${currentTenantId}/brand-logo-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, logoFile, { cacheControl: '3600', upsert: true })

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('brand-assets').getPublicUrl(filePath)
        uploadedLogoUrl = publicUrlData.publicUrl
      } else {
        setMsg({ type: 'error', text: `Logo upload failed: ${uploadError.message}` })
        setCompanyLoading(false)
        return
      }
    }

    const validGalleryFiles = galleryFiles.filter(f => f.size > 0)
    if (validGalleryFiles.length > 0) {
      if (validGalleryFiles.length > 4) {
        setMsg({ type: 'error', text: 'You can only upload a maximum of 4 gallery images.' })
        setCompanyLoading(false)
        return
      }

      uploadedGalleryUrls = []

      for (let i = 0; i < validGalleryFiles.length; i++) {
        const file = validGalleryFiles[i]
        const fileExt = file.name.split('.').pop()
        const filePath = `${currentTenantId}/gallery-${Date.now()}-${i}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(filePath, file, { cacheControl: '3600', upsert: true })

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('brand-assets').getPublicUrl(filePath)
          uploadedGalleryUrls.push(publicUrlData.publicUrl)
        }
      }
    }

    const { error: upsertError } = await supabase
      .from('companies')
      .upsert({
        client_id: currentTenantId,
        name,
        about,
        logo_url: uploadedLogoUrl,
        instagram,
        facebook,
        youtube,
        linkedin,
        whatsapp,
        gallery_urls: uploadedGalleryUrls,
        address,
        google_maps_url: googleMapsUrl,
        updated_at: new Date().toISOString()
      }, { onConflict: 'client_id' })

    setCompanyLoading(false)

    if (upsertError) {
      setMsg({ type: 'error', text: `Profile write exception: ${upsertError.message}` })
    } else {
      setMsg({ type: 'success', text: '💼 Enterprise branding metrics synchronized live.' })
      setCompany({
        name,
        about,
        logo_url: uploadedLogoUrl,
        instagram,
        facebook,
        youtube,
        linkedin,
        whatsapp,
        gallery_urls: uploadedGalleryUrls,
        address,
        google_maps_url: googleMapsUrl
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-10 text-slate-100 selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto space-y-8">

        <header className="border-b border-white/5 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {company.logo_url && (
                <img src={company.logo_url} alt="Brand Logo" className="w-8 h-8 rounded-lg object-cover border border-white/10" />
              )}
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {company.name || 'Enterprise Workspace Hub'}
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              {company.about ? company.about : 'Manage your structural digital ecosystem metrics instantly.'}
            </p>
          </div>

          <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md self-start md:self-auto">
            <button
              onClick={() => { setActiveTab('inventory'); setMsg(null) }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'inventory' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Catalog & Inventory
            </button>
            <button
              onClick={() => { setActiveTab('company'); setMsg(null) }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'company' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Company Settings
            </button>
          </div>
        </header>

        {msg && (
          <div className={`text-xs p-4 rounded-xl border font-medium backdrop-blur-md ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
            {msg.text}
          </div>
        )}

        {activeTab === 'inventory' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
            <div className="lg:col-span-1 bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-200">New Production Entry</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${products.length >= 10 ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                  {products.length} / 10
                </span>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4" encType="multipart/form-data">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Item Title</label>
                  <input name="name" type="text" required placeholder="Luxury Coffee Bean" disabled={products.length >= 10} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50" />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Pricing (USD)</label>
                  <input name="price" type="number" step="0.01" required placeholder="14.99" disabled={products.length >= 10} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50" />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Product Showcase Image</label>
                  <input name="image" type="file" accept="image/*" disabled={products.length >= 10} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-cyan-500 file:mr-4 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 disabled:opacity-50" />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Public Description</label>
                  <textarea name="description" rows={3} placeholder="Describe your catalog item details..." disabled={products.length >= 10} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none disabled:opacity-50" />
                </div>

                <button type="submit" disabled={loading || products.length >= 10} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-sm font-medium py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Processing System Sync...' : products.length >= 10 ? 'Catalog Limit Reached' : 'Publish Item Live'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Your Distributed Catalog Workspace</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Image</th>
                      <th className="py-3 px-4 font-semibold">Product Name</th>
                      <th className="py-3 px-4 font-semibold text-right">Price</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 text-xs italic">No items found in your catalog. Add your first item to get started!</td>
                      </tr>
                    ) : (
                      products.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => setViewProduct(item)}
                        >
                          <td className="py-3 px-4">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-white/10 bg-slate-900" />
                            ) : (
                              <div className="w-10 h-10 bg-white/5 border border-white/5 rounded-lg flex items-center justify-center text-[10px] text-slate-500 font-mono">N/A</div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium text-white">{item.name}</td>
                          <td className="py-3 px-4 text-right text-emerald-400 font-semibold">${Number(item.price).toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setViewProduct(item) }}
                                title="View"
                                className="p-1.5 rounded-md bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setEditProduct(item) }}
                                title="Edit"
                                className="p-1.5 rounded-md bg-white/5 hover:bg-blue-500/20 text-slate-300 hover:text-blue-400 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteProduct(item) }}
                                title="Delete"
                                disabled={deletingId === item.id}
                                className="p-1.5 rounded-md bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors disabled:opacity-50"
                              >
                                {deletingId === item.id ? (
                                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-slate-200 mb-2">Company Core Identity</h3>
            <p className="text-xs text-slate-400 mb-6">Modify details across your public distributed storefront instances globally.</p>

            <form onSubmit={handleUpdateCompany} className="space-y-6" encType="multipart/form-data">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Legal or Trading Name</label>
                  <input name="company_name" type="text" required defaultValue={company.name} placeholder="Acme Logistics Ltd" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Corporate Emblem / Logo Asset</label>
                  <div className="flex items-center gap-4 p-3 bg-slate-900/50 border border-white/5 rounded-xl">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt="Current Logo Preview" className="w-12 h-12 object-cover rounded-lg border border-white/10 bg-slate-900" />
                    ) : (
                      <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-lg flex items-center justify-center text-[10px] text-slate-500 font-mono text-center px-1">No Logo</div>
                    )}
                    <input name="company_logo" type="file" accept="image/*" className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-cyan-500 file:mr-4 file:py-0.5 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">About / Business Mission Statement</label>
                  <textarea name="company_about" rows={4} defaultValue={company.about} placeholder="Provide an explicit historical mission brief or customer-facing details description..." className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none" />
                </div>
              </div>

              <hr className="border-white/5" />

              {/* ===== Location: Address & Google Maps ===== */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-300">Location & Directions</h4>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Company Address</label>
                  <textarea
                    name="address"
                    rows={2}
                    defaultValue={company.address}
                    placeholder="12 MG Road, Bengaluru, Karnataka 560001"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Google Maps Link</label>
                  <input
                    name="google_maps_url"
                    type="url"
                    defaultValue={company.google_maps_url}
                    placeholder="https://maps.app.goo.gl/xxxxxxxx"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    In Google Maps: search your location → Share → Copy link, then paste it here.
                  </p>
                  {company.google_maps_url && (
                    <a
                      href={company.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Open current location in Google Maps
                    </a>
                  )}
                </div>
              </div>

              <hr className="border-white/5" />

              {/* Social Media & Contact */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-300">Social Media & Contact (Optional)</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">WhatsApp Number</label>
                    <input name="whatsapp" type="text" defaultValue={company.whatsapp} placeholder="+1234567890" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Instagram Handle/URL</label>
                    <input name="instagram" type="text" defaultValue={company.instagram} placeholder="@yourbrand" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Facebook URL</label>
                    <input name="facebook" type="text" defaultValue={company.facebook} placeholder="facebook.com/yourbrand" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">YouTube Channel URL</label>
                    <input name="youtube" type="text" defaultValue={company.youtube} placeholder="youtube.com/@yourbrand" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">LinkedIn URL</label>
                    <input name="linkedin" type="text" defaultValue={company.linkedin} placeholder="linkedin.com/company/yourbrand" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                </div>
              </div>

              <hr className="border-white/5" />

              {/* Gallery */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-slate-300">Company Gallery</h4>
                  <span className="text-xs text-slate-400">Max 4 images</span>
                </div>

                <div className="p-4 bg-slate-900/50 border border-white/5 rounded-xl space-y-4">
                  <input
                    name="gallery_images"
                    type="file"
                    accept="image/*"
                    multiple
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-cyan-500 file:mr-4 file:py-0.5 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20"
                  />

                  {company.gallery_urls && company.gallery_urls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {company.gallery_urls.map((url, idx) => (
                        <img key={idx} src={url} alt={`Gallery ${idx + 1}`} className="w-full h-16 object-cover rounded-md border border-white/10" />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" disabled={companyLoading} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-sm font-medium py-3 rounded-lg transition-all disabled:opacity-50">
                {companyLoading ? 'Syncing Brand Architecture...' : 'Commit Branding Updates'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ===== VIEW PRODUCT MODAL ===== */}
      {viewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setViewProduct(null)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {viewProduct.image_url ? (
              <img src={viewProduct.image_url} alt={viewProduct.name} className="w-full h-48 object-cover rounded-xl border border-white/10 mb-4" />
            ) : (
              <div className="w-full h-48 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-xs text-slate-500 font-mono mb-4">No Image</div>
            )}

            <h3 className="text-xl font-bold text-white mb-1">{viewProduct.name}</h3>
            <p className="text-emerald-400 font-semibold text-lg mb-3">${Number(viewProduct.price).toFixed(2)}</p>
            <p className="text-sm text-slate-400 whitespace-pre-wrap">{viewProduct.description || 'No description provided.'}</p>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => { setEditProduct(viewProduct); setViewProduct(null) }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-sm font-medium py-2 rounded-lg transition-all"
              >
                Edit
              </button>
              <button
                onClick={() => setViewProduct(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-sm font-medium py-2 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT PRODUCT MODAL ===== */}
      {editProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => !editLoading && setEditProduct(null)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEditProduct(null)}
              disabled={editLoading}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-semibold text-slate-200 mb-4">Edit Product</h3>

            <form onSubmit={handleEditProduct} className="space-y-4" encType="multipart/form-data">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Item Title</label>
                <input name="edit_name" type="text" required defaultValue={editProduct.name} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Pricing (USD)</label>
                <input name="edit_price" type="number" step="0.01" required defaultValue={editProduct.price} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Product Showcase Image</label>
                <div className="flex items-center gap-3 mb-2">
                  {editProduct.image_url ? (
                    <img src={editProduct.image_url} alt={editProduct.name} className="w-12 h-12 object-cover rounded-lg border border-white/10" />
                  ) : (
                    <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-lg flex items-center justify-center text-[9px] text-slate-500 font-mono">N/A</div>
                  )}
                  <span className="text-[11px] text-slate-500">Leave empty to keep current image</span>
                </div>
                <input name="edit_image" type="file" accept="image/*" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-cyan-500 file:mr-4 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Public Description</label>
                <textarea name="edit_description" rows={3} defaultValue={editProduct.description} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={editLoading} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-sm font-medium py-2 rounded-lg transition-all disabled:opacity-50">
                  {editLoading ? 'Saving Changes...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  disabled={editLoading}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-sm font-medium py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}