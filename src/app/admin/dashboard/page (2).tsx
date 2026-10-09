'use client'
import { useEffect, useState } from 'react'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <AdminDashboard onLogout={async () => {
    await fetch('/api/admin/session', { method: 'DELETE' })
    window.location.href = '/admin/login'
  }} />
}
