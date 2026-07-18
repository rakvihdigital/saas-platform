'use client'

import React, { useState, useEffect } from 'react'
import { createClientAccount, getSuperAdminMetrics, getClientList } from '@/app/actions/super-admin'

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState({ totalClients: 0, totalProducts: 0 })
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load platform analytics and registered user tables
  async function loadDashboardData() {
    const dataMetrics = await getSuperAdminMetrics()
    const dataList = await getClientList()
    setMetrics(dataMetrics)
    setClients(dataList)
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setActionMsg(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const result = await createClientAccount(formData)

    setLoading(false)
    if (result?.error) {
      setActionMsg({ type: 'error', text: result.error })
    } else {
      setActionMsg({ type: 'success', text: 'Client profile introduced and active!' })
      form.reset()
      loadDashboardData() // Refresh tables immediately
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Title */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Control Center Portal
            </h1>
            <p className="text-sm text-slate-400">Manage tenant instances, create user environments, and monitor growth metrics.</p>
          </div>
        </header>

        {/* Dynamic Analytics Data Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Registered Tenants</span>
            <div className="text-4xl font-black text-cyan-400 mt-2">{metrics.totalClients} Companies</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platform Synchronized Items</span>
            <div className="text-4xl font-black text-indigo-400 mt-2">{metrics.totalProducts} Items</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Tenant Creation Core Form */}
          <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Provision New Client</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Company Name</label>
                <input name="companyName" type="text" required placeholder="e.g. Apex Corporation" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Client Custom Slug (URL ID)</label>
                <input name="clientId" type="text" required placeholder="e.g. apex-corp" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Admin User Email</label>
                <input name="email" type="email" required placeholder="manager@apex.com" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Secure Default Password</label>
                <input name="password" type="password" required placeholder="••••••••" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-sm font-medium py-2 rounded-lg transition-all disabled:opacity-50 mt-2">
                {loading ? 'Registering Instance...' : 'Deploy System Tenant'}
              </button>
            </form>

            {actionMsg && (
              <div className={`mt-4 text-xs p-3 rounded-lg border ${actionMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                {actionMsg.text}
              </div>
            )}
          </div>

          {/* Active Tenant Overview List Table */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl overflow-hidden">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Active System Platforms</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 px-4 font-semibold">Company Name</th>
                    <th className="pb-3 px-4 font-semibold">Client Slug Parameter</th>
                    <th className="pb-3 px-4 font-semibold">Date Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-500 text-xs italic">No client workspaces deployed yet.</td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                      <tr key={client.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-medium text-white">{client.company_name}</td>
                        <td className="py-3 px-4 font-mono text-cyan-400">/{client.client_id}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{new Date(client.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}