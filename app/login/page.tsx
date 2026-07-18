'use client'

import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { verifyAndGetClientId } from '@/app/actions/login-action'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ClientLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // 1. Authenticate credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!authData.user?.id) {
      setError('Authentication failed.')
      setLoading(false)
      return
    }

    // 2. Fetch the client profile safely using our server action bypass
    const result = await verifyAndGetClientId(authData.user.id)

    setLoading(false)

    if (result.error || !result.clientId) {
      setError('Workspace profile mapping failure. Contact platform admin.')
      return
    }

    // 3. Save to local storage for our dashboard tables
    localStorage.setItem('tenant_client_id', result.clientId)

    // 4. Route directly to dashboard
    router.push('/dashboard/products')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-sm bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-block px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
            Tenant Space
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Client Login
          </h2>
          <p className="text-xs text-slate-400 mt-1">Access your business tools and management console</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Workspace Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="manager@company.com" className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-teal-500 text-slate-100" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-teal-500 text-slate-100" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all disabled:opacity-50">
            {loading ? 'Entering Workspace...' : 'Sign In To Dashboard'}
          </button>
        </form>

        {error && <p className="mt-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-center font-medium">{error}</p>}
      </div>
    </div>
  )
}