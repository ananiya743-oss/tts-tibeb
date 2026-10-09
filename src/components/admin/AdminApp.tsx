'use client'
import { useEffect, useState } from 'react'
import { AdminLogin } from './AdminLogin'
import { AdminDashboard } from './AdminDashboard'

interface Admin { id: string; email: string; name: string | null; role: string }

export function AdminApp() {
  const [admin, setAdmin] = useState<Admin | null | undefined>(undefined)

  useEffect(() => {
    fetch('/api/admin/session', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setAdmin(d.admin || null))
  }, [])

  const logout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' })
    setAdmin(null)
    window.location.hash = ''
  }

  if (admin === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!admin) return <AdminLogin onLogin={() => setAdmin({ id: '', email: '', name: '', role: 'admin' })} />
  return <AdminDashboard onLogout={logout} />
}
