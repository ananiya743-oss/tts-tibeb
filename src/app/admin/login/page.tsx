'use client'
import { useEffect, useState } from 'react'
import { AdminLogin } from '@/components/admin/AdminLogin'

export default function AdminLoginPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <AdminLogin onLogin={() => { window.location.href = '/admin/dashboard' }} />
}
