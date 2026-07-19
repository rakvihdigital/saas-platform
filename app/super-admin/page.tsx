'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  createClientAccount,
  getSuperAdminMetrics,
  getClientList,
  deleteClientAccount
} from '@/app/actions/super-admin'

type Client = {
  id: string
  client_id: string
  company_name: string
  email: string
  password: string | null
  created_at: string
}

type Credentials = { email: string; password: string; clientId: string }

function generateClientPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  const arr = new Uint32Array(length)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(arr)
  } else {
    for (let i = 0; i < length; i++) arr[i] = Math.floor(Math.random() * chars.length)
  }
  return Array.from(arr, (n) => chars[n % chars.length]).join('')
}

// Robust clipboard copy: tries the async Clipboard API, falls back to a hidden
// textarea + execCommand for contexts where navigator.clipboard is unavailable
// (non-HTTPS, permissions blocked, older WebViews, etc).
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    throw new Error('Clipboard API unavailable')
  } catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      return ok
    } catch {
      return false
    }
  }
}

function buildLink(clientId: string) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/${clientId}`
  }
  return `http://localhost:3000/${clientId}`
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState({ totalClients: 0, totalProducts: 0 })
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newCredentials, setNewCredentials] = useState<Credentials | null>(null)

  const [password, setPassword] = useState(() => generateClientPassword())
  const [showPassword, setShowPassword] = useState(false)

  // toast for any copy action, keyed so multiple buttons can each show their own "Copied"
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [visiblePasswordId, setVisiblePasswordId] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const loadDashboardData = useCallback(async () => {
    const [dataMetrics, dataList] = await Promise.all([getSuperAdminMetrics(), getClientList()])
    setMetrics(dataMetrics)
    setClients(dataList)
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setActionMsg(null)
    setNewCredentials(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('password', password)

    const result = await createClientAccount(formData)

    setLoading(false)
    if (result?.error) {
      setActionMsg({ type: 'error', text: result.error })
    } else {
      setActionMsg({ type: 'success', text: 'Client profile created and active.' })
      if (result?.credentials) setNewCredentials(result.credentials)
      form.reset()
      setPassword(generateClientPassword())
      loadDashboardData()
    }
  }

  async function handleCopy(key: string, text: string) {
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800)
    } else {
      setActionMsg({ type: 'error', text: 'Copy failed — select and copy the text manually.' })
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteClientAccount(id)
    setDeletingId(null)
    setConfirmDeleteId(null)

    if (result?.error) {
      setActionMsg({ type: 'error', text: result.error })
    } else {
      setActionMsg({ type: 'success', text: 'Client removed.' })
      loadDashboardData()
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Control Center Portal
            </h1>
            <p className="text-sm text-slate-400">Manage tenant instances, create user environments, and monitor growth metrics.</p>
          </div>
        </header>

        {actionMsg && (
          <div className={`text-xs p-3 rounded-lg border ${actionMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
            {actionMsg.text}
          </div>
        )}

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

          {/* Tenant Creation Form */}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs uppercase tracking-wider text-slate-400">Password (auto-generated)</label>
                  <button
                    type="button"
                    onClick={() => setPassword(generateClientPassword())}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    Regenerate
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="shrink-0 px-3 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-300 hover:bg-white/5"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Generated automatically — edit it directly if you'd rather set your own.</p>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-sm font-medium py-2 rounded-lg transition-all disabled:opacity-50 mt-2">
                {loading ? 'Registering Instance...' : 'Deploy System Tenant'}
              </button>
            </form>

            {newCredentials && (
              <div className="mt-4 bg-slate-900 border border-white/10 rounded-lg p-4 space-y-3">
                <p className="text-xs uppercase tracking-wider text-slate-400">New Client Credentials</p>
                <div className="text-xs text-slate-300 space-y-1 font-mono break-all">
                  <div><span className="text-slate-500">Email:</span> {newCredentials.email}</div>
                  <div><span className="text-slate-500">Password:</span> {newCredentials.password}</div>
                  <div><span className="text-slate-500">Link:</span> {buildLink(newCredentials.clientId)}</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      'new-creds',
                      `Email: ${newCredentials.email}\nPassword: ${newCredentials.password}\nLink: ${buildLink(newCredentials.clientId)}`
                    )
                  }
                  className="w-full bg-white/10 hover:bg-white/20 text-xs font-medium py-2 rounded-lg transition-all"
                >
                  {copiedKey === 'new-creds' ? 'Copied ✓' : 'Copy Credentials'}
                </button>
              </div>
            )}
          </div>

          {/* Client Table */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl overflow-hidden">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Active System Platforms</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 px-4 font-semibold">Company Name</th>
                    <th className="pb-3 px-4 font-semibold">Slug / Link</th>
                    <th className="pb-3 px-4 font-semibold">Password</th>
                    <th className="pb-3 px-4 font-semibold">Date Registered</th>
                    <th className="pb-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xs italic">No client workspaces deployed yet.</td>
                    </tr>
                  ) : (
                    clients.map((client) => {
                      const link = buildLink(client.client_id)
                      const rowKey = `row-${client.id}`
                      const pwVisible = visiblePasswordId === client.id
                      return (
                        <tr key={client.id} className="hover:bg-white/5 transition-colors align-top">
                          <td className="py-3 px-4 font-medium text-white">
                            {client.company_name}
                            <div className="text-[11px] text-slate-500 font-normal">{client.email}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-cyan-400 text-xs">/{client.client_id}</td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-300">
                            <div className="flex items-center gap-2">
                              <span className="min-w-[70px]">
                                {client.password ? (pwVisible ? client.password : '••••••••') : '—'}
                              </span>
                              {client.password && (
                                <button
                                  type="button"
                                  onClick={() => setVisiblePasswordId(pwVisible ? null : client.id)}
                                  className="text-[10px] text-slate-500 hover:text-slate-300"
                                >
                                  {pwVisible ? 'Hide' : 'Show'}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{new Date(client.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(
                                    rowKey,
                                    `Email: ${client.email}\nPassword: ${client.password ?? ''}\nLink: ${link}`
                                  )
                                }
                                className="text-[11px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                              >
                                {copiedKey === rowKey ? 'Copied ✓' : 'Copy'}
                              </button>
                              {confirmDeleteId === client.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(client.id)}
                                    disabled={deletingId === client.id}
                                    className="text-[11px] px-2 py-1 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 disabled:opacity-50"
                                  >
                                    {deletingId === client.id ? 'Deleting…' : 'Confirm'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="text-[11px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(client.id)}
                                  className="text-[11px] px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
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