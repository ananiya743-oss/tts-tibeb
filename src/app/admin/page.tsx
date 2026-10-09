// /admin → middleware redirects to /admin/login or /admin/dashboard
// This page is a fallback in case middleware doesn't fire
import { redirect } from 'next/navigation'
import { getAdmin } from '@/lib/auth'

export default async function AdminIndex() {
  const admin = await getAdmin()
  if (admin) redirect('/admin/dashboard')
  redirect('/admin/login')
}
