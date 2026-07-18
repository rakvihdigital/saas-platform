'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Hardcoded Super Admin Credentials inside the client check
  const SUPER_ADMIN_EMAIL = "admin@platform.com"
  const SUPER_ADMIN_PASSWORD = "SuperSecureAdminPassword2026"

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Check if entered details match your master credentials
    if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
      // Success! Route directly to your Master Super Admin panel
      router.push('/super-admin')
    } else {
      setLoading(false)
      setError('Invalid master administrative credentials.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-sm bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        
        <div className="text-center mb-6">
          <div className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
            System Core
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Super Admin Gate
          </h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Master Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="admin@platform.com"
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 placeholder:text-slate-600" 
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Master Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 placeholder:text-slate-600" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50"
          >
            {loading ? 'Authorizing Access...' : 'Authenticate Master Control'}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-center font-medium">
            {error}
          </p>
        )}

        <div className="mt-6 border-t border-white/5 pt-4 text-center">
          <p className="text-[10px] text-slate-500 font-mono">
            Authorized administrative personnel only. Terminal access logged.
          </p>
        </div>

      </div>
    </div>
  )
}