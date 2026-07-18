'use client'

import React, { useState, useMemo, useEffect } from 'react'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
}

interface Company {
  name: string
  about: string
  logo_url: string
  instagram: string
  facebook: string
  youtube: string
  linkedin: string
  whatsapp: string
  gallery_urls: string[]
  email: string
  // Sourced from `companies` (address, google_maps_url)
  address: string | null
  google_maps_url: string | null
}

interface CartItem extends Product {
  qty: number
}

interface Props {
  company: Company
  products: Product[]
}

type Theme = 'dark' | 'light'

const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.8}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </svg>
)
const IconFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M13.5 21v-7.6h2.55l.38-2.97h-2.93V8.53c0-.86.24-1.44 1.47-1.44h1.57V4.42A21 21 0 0014.6 4.3c-2.28 0-3.84 1.39-3.84 3.94v2.19H8.2v2.97h2.56V21h2.74z" />
  </svg>
)
const IconYoutube = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M21.6 7.2s-.21-1.5-.86-2.16c-.82-.86-1.74-.86-2.16-.91C15.6 4 12 4 12 4h-.01s-3.59 0-6.58.13c-.42.05-1.34.05-2.16.91C2.6 5.7 2.4 7.2 2.4 7.2S2.2 8.95 2.2 10.7v1.6c0 1.75.2 3.5.2 3.5s.21 1.5.86 2.16c.82.86 1.9.83 2.38.92 1.73.17 7.36.22 7.36.22s3.6 0 6.6-.13c.42-.06 1.34-.06 2.16-.92.65-.66.86-2.16.86-2.16s.2-1.75.2-3.5v-1.6c0-1.75-.2-3.5-.2-3.5zM9.9 14.4V8.6l5.4 2.9-5.4 2.9z" />
  </svg>
)
const IconLinkedin = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M6.94 8.5H3.56V21h3.38V8.5zM5.25 3.5a1.94 1.94 0 100 3.88 1.94 1.94 0 000-3.88zM20.44 21h-3.38v-6.4c0-1.53-.03-3.5-2.13-3.5-2.14 0-2.47 1.67-2.47 3.39V21H9.08V8.5h3.24v1.7h.05c.45-.86 1.56-1.77 3.22-1.77 3.44 0 4.08 2.27 4.08 5.22V21z" />
  </svg>
)
const IconWhatsapp = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2 22l5.28-1.38a9.9 9.9 0 004.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.92C21.95 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.95-.3-1.64-.6-2.88-1.24-4.76-4.15-4.9-4.34-.14-.2-1.17-1.55-1.17-2.96s.73-2.1.99-2.38c.26-.28.57-.35.76-.35s.38 0 .55.01c.18.01.41-.07.64.49.24.58.81 2 .88 2.15.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.28-.12.56.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.7-.81.88-1.09.19-.28.37-.23.62-.14.26.09 1.63.77 1.91.91.28.14.47.21.54.33.07.12.07.68-.17 1.36z" />
  </svg>
)
const IconCart = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
  </svg>
)
const IconLocation = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.5-7-11a7 7 0 1114 0c0 4.5-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)
const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
    />
  </svg>
)
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
  </svg>
)
const IconExternal = () => (
  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
  </svg>
)
const IconSun = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="12" r="4" />
    <path
      strokeLinecap="round"
      d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
    />
  </svg>
)
const IconMoon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
)

const THEME_STORAGE_KEY = 'storefront-theme'

export default function StorefrontClient({ company, products }: Props) {
  // Theme defaults to dark; the user can flip to light and it's remembered
  // for their next visit via localStorage.
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_STORAGE_KEY) : null
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
    }
  }, [])

  function toggleTheme() {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, next)
      }
      return next
    })
  }

  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [viewProduct, setViewProduct] = useState<Product | null>(null)

  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [contactError, setContactError] = useState('')
  const [contactSent, setContactSent] = useState(false)

  const totalItems = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart])
  const totalPrice = useMemo(() => cart.reduce((sum, i) => sum + i.qty * Number(i.price), 0), [cart])

  // Derived contact/location data (all sourced from the `companies` row)
  const phoneDisplay = company.whatsapp || null
  const mapsLink =
    company.google_maps_url ||
    (company.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}` : null)
  const mapEmbedSrc = company.address
    ? `https://www.google.com/maps?q=${encodeURIComponent(company.address)}&output=embed`
    : null
  const hasContactInfo = Boolean(company.address || company.email || company.whatsapp)

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { ...product, qty: 1 }]
    })
    setCartOpen(true)
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    )
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id))
  }

  function scrollTo(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
  }

  function checkoutOnWhatsapp() {
    if (cart.length === 0) return

    const lines = cart.map(
      (item, idx) =>
        `${idx + 1}. ${item.name} x${item.qty} - Rs.${(Number(item.price) * item.qty).toFixed(2)}`
    )

    const message =
      `Hi ${company.name}, I'd like to place an order:\n\n` +
      lines.join('\n') +
      `\n\nTotal: Rs.${totalPrice.toFixed(2)}`

    const phone = (company.whatsapp || '').replace(/[^0-9]/g, '')
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`

    window.open(url, '_blank')
  }

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      setContactError('Please fill in your name and phone number.')
      return
    }
    setContactError('')

    const lines = [
      `Hi ${company.name}, I have a question.`,
      '',
      `Name: ${contactForm.name}`,
      contactForm.email ? `Email: ${contactForm.email}` : null,
      `Phone: ${contactForm.phone}`,
      contactForm.message ? `Message: ${contactForm.message}` : null,
    ].filter(Boolean)

    const message = lines.join('\n')
    const phone = (company.whatsapp || '').replace(/[^0-9]/g, '')
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`

    window.open(url, '_blank')
    setContactForm({ name: '', email: '', phone: '', message: '' })
    setContactSent(true)
    setTimeout(() => setContactSent(false), 4000)
  }

  const socialLinks = [
    { key: 'instagram', url: company.instagram, icon: <IconInstagram />, label: 'Instagram' },
    { key: 'facebook', url: company.facebook, icon: <IconFacebook />, label: 'Facebook' },
    { key: 'youtube', url: company.youtube, icon: <IconYoutube />, label: 'YouTube' },
    { key: 'linkedin', url: company.linkedin, icon: <IconLinkedin />, label: 'LinkedIn' }
  ].filter((s) => s.url)

  return (
    // Tailwind's class-based dark mode: this wrapper toggles the `dark` class,
    // and every `dark:` utility below responds to it. Make sure your
    // tailwind.config has `darkMode: 'class'` (or `'selector'` on Tailwind 3.4+).
    <div className={theme}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-cyan-500/30 transition-colors duration-300">
        {/* ===== NAVIGATION ===== */}
        <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-6 py-4 shadow-lg shadow-slate-200/40 dark:shadow-black/20">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <img
                src={company.logo_url}
                alt={`${company.name} Corporate Emblem`}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 shadow-md shadow-cyan-950/10 dark:shadow-cyan-950/20"
              />
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent hidden sm:inline">
                {company.name}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              <button onClick={() => scrollTo('home')} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Home</button>
              <button onClick={() => scrollTo('products')} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Products</button>
              {company.gallery_urls.length > 0 && (
                <button onClick={() => scrollTo('gallery')} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Gallery</button>
              )}
              <button onClick={() => scrollTo('contact')} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Contact</button>
              {hasContactInfo && (
                <button onClick={() => scrollTo('location')} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Location</button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 mr-1">
                {socialLinks.map(function renderSocialLink(s) {
                  return React.createElement(
                    'a',
                    {
                      key: s.key,
                      href: s.url,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      title: s.label,
                      className:
                        'w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-400/40 dark:hover:border-cyan-500/30 transition-colors'
                    },
                    s.icon
                  )
                })}
                {company.whatsapp &&
                  React.createElement(
                    'a',
                    {
                      href: `https://wa.me/${company.whatsapp.replace(/[^0-9]/g, '')}`,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      title: 'WhatsApp',
                      className:
                        'w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors'
                    },
                    React.createElement(IconWhatsapp)
                  )}
              </div>

              <button
                onClick={toggleTheme}
                aria-label="Toggle light and dark mode"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              >
                {theme === 'dark' ? <IconSun /> : <IconMoon />}
              </button>

              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-colors"
              >
                <IconCart />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-cyan-500 text-white dark:text-slate-950 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex md:hidden items-center justify-center gap-5 text-xs font-medium text-slate-600 dark:text-slate-300 mt-3 flex-wrap">
            <button onClick={() => scrollTo('home')} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Home</button>
            <button onClick={() => scrollTo('products')} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Products</button>
            {company.gallery_urls.length > 0 && (
              <button onClick={() => scrollTo('gallery')} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Gallery</button>
            )}
            <button onClick={() => scrollTo('contact')} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Contact</button>
            {hasContactInfo && (
              <button onClick={() => scrollTo('location')} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Location</button>
            )}
          </div>
        </nav>

        {/* ===== HERO ===== */}
        <header id="home" className="relative w-full h-[350px] sm:h-[450px] flex items-center justify-center overflow-hidden border-b border-slate-200 dark:border-white/5">
          <img
            src="/banner.png"
            alt="Storefront Banner"
            className="absolute inset-0 w-full h-full object-cover opacity-20 dark:opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-slate-50 dark:from-slate-950/50 dark:via-slate-950/80 dark:to-slate-950" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-300/20 dark:bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto text-center px-6 space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight drop-shadow-sm dark:drop-shadow-md">
              Explore Our Digital Catalog
            </h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-light drop-shadow-sm">
              {company.about}
            </p>

            {company.whatsapp &&
              React.createElement(
                'a',
                {
                  href: `https://wa.me/${company.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Hi, I'm interested in your products")}`,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  className: 'inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/30'
                },
                React.createElement(IconWhatsapp, { className: 'w-4 h-4' }),
                ' Chat on WhatsApp'
              )}
          </div>
        </header>

        {/* ===== PRODUCTS ===== */}
        <main id="products" className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Featured Products</h2>
            <span className="text-sm text-slate-400 dark:text-slate-500 font-mono">{products.length} Items</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-slate-200 dark:border-white/10 hover:border-cyan-400/40 dark:hover:border-cyan-500/30 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg shadow-slate-200/40 dark:shadow-black/10 hover:shadow-cyan-100 dark:hover:shadow-cyan-950/10"
              >
                <div className="aspect-square relative bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 font-mono text-xs gap-2 select-none bg-slate-100/50 dark:bg-slate-900/50">
                      <span className="text-2xl opacity-40">?</span>
                      Image Unallocated
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors tracking-tight line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 font-light">
                      {item.description || 'No descriptive technical reference parameters configured.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/5">
                    <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400 tracking-tight">
                      Rs.{Number(item.price).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewProduct(item)}
                      className="flex-1 text-xs font-semibold py-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => addToCart(item)}
                      className="flex-1 text-xs font-semibold py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition-all"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* ===== GALLERY ===== */}
        {company.gallery_urls.length > 0 && (
          <section id="gallery" className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-white/5">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-8">Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {company.gallery_urls.map((url, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 group"
                >
                  <img
                    src={url}
                    alt={`${company.name} gallery ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== ASK US ANYTHING (WhatsApp contact form) ===== */}
        <section id="contact" className="max-w-2xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-white/5">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Ask Us Anything</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">We reply on WhatsApp within a few hours.</p>
          </div>

          <form
            onSubmit={handleContactSubmit}
            className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 space-y-5 shadow-lg shadow-slate-200/40 dark:shadow-black/20"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Your Name <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={contactForm.name}
                onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="optional"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Your Phone <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 XXXXX XXXXX"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Your Message</label>
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="What can we help you with?"
                rows={4}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors resize-none"
              />
            </div>

            {contactError && <p className="text-xs text-rose-500 dark:text-rose-400">{contactError}</p>}
            {contactSent && <p className="text-xs text-emerald-600 dark:text-emerald-400">Opening WhatsApp with your message…</p>}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm py-3 rounded-xl transition-colors shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/30"
            >
              <IconWhatsapp className="w-4 h-4" />
              Send on WhatsApp
            </button>
          </form>
        </section>

        {/* ===== GET IN TOUCH (address / phone / whatsapp / email / map) ===== */}
        {hasContactInfo && (
          <section id="location" className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-white/5">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Get in Touch</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">We're here to help and answer any questions you might have</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                {company.address && (
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      <IconLocation />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Address</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{company.address}</p>
                      {mapsLink && (
                        <a
                          href={mapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 inline-flex items-center gap-1 mt-1"
                        >
                          View on Google Maps →
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {phoneDisplay && (
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      <IconPhone />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Phone</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{phoneDisplay}</p>
                    </div>
                  </div>
                )}

                {company.whatsapp && (
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <IconWhatsapp />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">WhatsApp</p>
                      <a
                        href={`https://wa.me/${company.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 mt-0.5 inline-block"
                      >
                        Chat with us
                      </a>
                    </div>
                  </div>
                )}

                {company.email && (
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      <IconMail />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Email</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{company.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {mapEmbedSrc && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 h-[320px] lg:h-full min-h-[320px]">
                  <iframe
                    src={mapEmbedSrc}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${company.name} location`}
                  />
                  {mapsLink && (
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm border border-slate-200 dark:border-white/10 text-xs font-semibold text-cyan-600 dark:text-cyan-400 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      Open in Maps
                      <IconExternal />
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===== FOOTER ===== */}
        <footer className="border-t border-slate-200 dark:border-white/5 mt-10 bg-slate-50/50 dark:bg-slate-950/50">
          {company.email && (
            <div className="max-w-6xl mx-auto px-6 py-8 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500">{company.email}</p>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-white/5 py-6 px-6 text-center text-xs text-slate-400 dark:text-slate-600 font-mono tracking-wide space-y-1">
            <p>POWERED BY CUSTOM DIGITAL ENTERPRISE MATRICES &copy; {new Date().getFullYear()}</p>
            <p className="font-sans tracking-normal">
              Designed and Developed by{' '}
              {React.createElement(
                'a',
                {
                  href: 'https://rakvih.in/',
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  className: 'text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors font-semibold'
                },
                'Rakvih'
              )}
            </p>
          </div>
        </footer>

        {/* ===== VIEW PRODUCT MODAL ===== */}
        {viewProduct && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setViewProduct(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setViewProduct(null)}
                className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {viewProduct.image_url ? (
                <img src={viewProduct.image_url} alt={viewProduct.name} className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-white/10 mb-4" />
              ) : (
                <div className="w-full h-48 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-mono mb-4">No Image</div>
              )}

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{viewProduct.name}</h3>
              <p className="text-cyan-600 dark:text-cyan-400 font-semibold text-lg mb-3">Rs.{Number(viewProduct.price).toFixed(2)}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap mb-6">{viewProduct.description || 'No description provided.'}</p>

              <button
                onClick={() => { addToCart(viewProduct); setViewProduct(null) }}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-all"
              >
                Add to Cart
              </button>
            </div>
          </div>
        )}

        {/* ===== CART SLIDE-OUT PANEL (from right) ===== */}
        <div
          className={`fixed inset-0 z-50 ${cartOpen ? '' : 'pointer-events-none'}`}
          aria-hidden={!cartOpen}
        >
          <div
            onClick={() => setCartOpen(false)}
            className={`absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
              cartOpen ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <div
            className={`absolute top-0 right-0 h-full w-full sm:w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ${
              cartOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-white/10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <IconCart className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                Your Cart
              </h3>
              <button
                onClick={() => setCartOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 gap-2 py-20">
                  <IconCart className="w-10 h-10 opacity-30" />
                  <p className="text-sm">Your cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-white/10 shrink-0" />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 shrink-0">N/A</div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold mt-0.5">Rs.{Number(item.price).toFixed(2)}</p>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm"
                        >
                          -
                        </button>
                        <span className="text-xs text-slate-800 dark:text-slate-200 w-5 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto text-[11px] text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-200 dark:border-white/10 px-6 py-5 space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">Total:</span>
                  <span className="text-xl text-cyan-600 dark:text-cyan-400 font-bold">Rs.{totalPrice.toFixed(2)}</span>
                </div>
                <button
                  onClick={checkoutOnWhatsapp}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm py-3 rounded-xl transition-colors shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/30"
                >
                  <IconWhatsapp className="w-4 h-4" />
                  Checkout on WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}