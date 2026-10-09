'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, ShoppingCart, FileText,
  LogOut, TrendingUp, AlertCircle, Clock, DollarSign, Bell,
  Globe, CheckCircle2, XCircle, Settings, Users, Image as ImageIcon, X
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminProducts } from './AdminProducts'
import { AdminOrders } from './AdminOrders'
import { AdminContent } from './AdminContent'
import { AdminSettings } from './AdminSettings'

type Tab = 'dashboard' | 'products' | 'orders' | 'content' | 'settings'

interface Stats {
  total: number
  newOrders: number
  contacted: number
  priceConfirmed: number
  international: number
  processing: number
  ready: number
  shipped: number
  delivered: number
  cancelled: number
  recentOrders: Array<{
    id: string; orderNumber: string; customerName: string
    totalAmount: number; status: string; createdAt: string
    isInternational: boolean; contactMethod: string | null
  }>
}

interface Notification {
  id: string; type: string; title: string; message: string
  orderId: string | null; read: boolean; createdAt: string
}

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)

  useEffect(() => {
    if (tab !== 'dashboard') return
    fetch('/api/orders', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const orders = d.orders || []
        setStats({
          total: orders.length,
          newOrders: orders.filter((o: { status: string }) => o.status === 'new').length,
          contacted: orders.filter((o: { status: string }) => o.status === 'contacted').length,
          priceConfirmed: orders.filter((o: { status: string }) => o.status === 'price_confirmed').length,
          international: orders.filter((o: { isInternational: boolean }) => o.isInternational).length,
          processing: orders.filter((o: { status: string }) => o.status === 'processing').length,
          ready: orders.filter((o: { status: string }) => o.status === 'ready').length,
          shipped: orders.filter((o: { status: string }) => o.status === 'shipped').length,
          delivered: orders.filter((o: { status: string }) => o.status === 'delivered').length,
          cancelled: orders.filter((o: { status: string }) => o.status === 'cancelled').length,
          recentOrders: orders.slice(0, 6)
        })
      })
  }, [tab])

  // Poll notifications
  useEffect(() => {
    const load = () => {
      fetch('/api/notifications', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          setNotifications(d.notifications || [])
          setUnreadCount(d.unreadCount || 0)
        })
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, 15000) // every 15s
    return () => clearInterval(interval)
  }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true })
    })
    setNotifications(n => n.map(x => ({ ...x, read: true })))
    setUnreadCount(0)
  }

  const navItems: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="md:w-64 md:min-h-screen border-b md:border-b-0 md:border-r border-[#2a2418] bg-[#0d0d0d] flex md:flex-col">
        <div className="p-5 border-b border-[#2a2418] flex-1 md:flex-none">
          <h2 className="font-display text-lg font-bold tracking-[0.15em] text-gold-gradient">TT&apos;S TIBEB</h2>
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#9a8c66] mt-1">Admin Panel</p>
        </div>

        <nav className="flex md:flex-col gap-1 p-3 md:p-4 md:flex-1 overflow-x-auto">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex items-center gap-3 px-4 py-3 text-sm tracking-[0.1em] transition-all whitespace-nowrap ${
                tab === n.id
                  ? 'bg-gold/10 border-l-2 border-gold text-gold'
                  : 'text-[#f5efe2]/70 hover:bg-[#1a1714] hover:text-[#f5efe2] border-l-2 border-transparent'
              }`}
            >
              <n.icon className="w-4 h-4" />
              <span>{n.label}</span>
              {n.id === 'orders' && stats && (stats.newOrders + stats.processing + stats.ready) > 0 && (
                <span className="ml-auto bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {stats.newOrders + stats.processing + stats.ready}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 md:p-4 border-t border-[#2a2418] flex items-center gap-3">
          {/* Notifications */}
          <button
            onClick={() => setShowNotifs(true)}
            className="relative p-2 text-[#f5efe2]/70 hover:text-gold transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#f5efe2]/70 hover:text-red-400 transition-colors flex-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        {tab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-[#f5efe2]">Dashboard</h1>
                <p className="text-sm text-[#9a8c66] mt-1">Overview of your store performance.</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={ShoppingCart} label="Total Orders" value={String(stats?.total || 0)} tone="cream" />
              <StatCard icon={Clock} label="New Requests" value={String(stats?.newOrders || 0)} tone="amber" />
              <StatCard icon={CheckCircle2} label="Contacted" value={String(stats?.contacted || 0)} tone="blue" />
              <StatCard icon={CheckCircle2} label="Price Confirmed" value={String(stats?.priceConfirmed || 0)} tone="cyan" />
              <StatCard icon={Globe} label="International" value={String(stats?.international || 0)} tone="purple" />
              <StatCard icon={TrendingUp} label="Processing" value={String(stats?.processing || 0)} tone="blue" />
              <StatCard icon={CheckCircle2} label="Ready" value={String(stats?.ready || 0)} tone="green" />
              <StatCard icon={TrendingUp} label="Shipped" value={String(stats?.shipped || 0)} tone="indigo" />
              <StatCard icon={CheckCircle2} label="Delivered" value={String(stats?.delivered || 0)} tone="green" />
              <StatCard icon={XCircle} label="Cancelled" value={String(stats?.cancelled || 0)} tone="red" />
            </div>

            {/* Recent orders */}
            <div className="border border-[#2a2418] bg-[#0f0f0f] p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg text-[#f5efe2] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gold" /> Recent Orders
                </h2>
                <button
                  onClick={() => setTab('orders')}
                  className="text-xs tracking-[0.15em] uppercase text-gold hover:underline"
                >
                  View all →
                </button>
              </div>

              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] tracking-[0.15em] uppercase text-[#9a8c66] border-b border-[#2a2418]">
                        <th className="text-left py-3 px-2">Order</th>
                        <th className="text-left py-3 px-2">Customer</th>
                        <th className="text-center py-3 px-2">Contact</th>
                        <th className="text-center py-3 px-2">Status</th>
                        <th className="text-right py-3 px-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map((o) => (
                        <tr key={o.id} className="border-b border-[#1a1714] hover:bg-[#1a1714]/40 cursor-pointer" onClick={() => setTab('orders')}>
                          <td className="py-3 px-2 text-gold font-mono text-xs">
                            {o.orderNumber}
                            {o.isInternational && <span className="ml-1 text-purple-400">🌍</span>}
                          </td>
                          <td className="py-3 px-2 text-[#f5efe2]">{o.customerName}</td>
                          <td className="py-3 px-2 text-center text-[10px] uppercase tracking-[0.15em] text-[#9a8c66]">
                            {o.contactMethod || '—'}
                          </td>
                          <td className="py-3 px-2 text-center text-[10px] uppercase tracking-[0.15em]">{o.status.replace(/_/g, ' ')}</td>
                          <td className="py-3 px-2 text-right text-[#9a8c66] text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-[#9a8c66] py-8 text-center">No orders yet. Be patient — heritage takes time.</p>
              )}
            </div>
          </motion.div>
        )}

        {tab === 'products' && <AdminProducts />}
        {tab === 'orders' && <AdminOrders />}
        {tab === 'content' && <AdminContent />}
        {tab === 'settings' && <AdminSettings />}
      </main>

      {/* Notifications panel */}
      <AnimatePresence>
        {showNotifs && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNotifs(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[#0d0d0d] z-50 border-l border-[#2a2418] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#2a2418]">
                <h3 className="font-display text-lg text-[#f5efe2] flex items-center gap-2">
                  <Bell className="w-5 h-5 text-gold" /> Notifications
                  {unreadCount > 0 && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>}
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] tracking-[0.15em] uppercase text-gold hover:underline">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)} className="text-[#f5efe2]/70 hover:text-gold">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-sm text-[#9a8c66] text-center py-12">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border ${n.read ? 'border-[#2a2418] bg-[#0a0a0a]/50' : 'border-gold/30 bg-gold/5'}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-gold">
                          {n.type === 'payment_success' && <CheckCircle2 className="w-4 h-4" />}
                          {n.type === 'payment_failed' && <XCircle className="w-4 h-4" />}
                          {n.type === 'new_order' && <ShoppingCart className="w-4 h-4" />}
                          {n.type === 'international_order' && <Globe className="w-4 h-4" />}
                          {n.type === 'cancelled' && <XCircle className="w-4 h-4" />}
                        </span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[#f5efe2]">{n.title}</div>
                          <div className="text-xs text-[#9a8c66] mt-1">{n.message}</div>
                          <div className="text-[10px] text-[#9a8c66] mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({
  icon: Icon, label, value, tone
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone: 'gold' | 'cream' | 'amber' | 'red' | 'green' | 'purple' | 'blue' | 'indigo'
}) {
  const toneClass = {
    gold: 'text-gold border-gold/30 bg-gold/5',
    cream: 'text-[#f5efe2] border-[#2a2418] bg-[#0f0f0f]',
    amber: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
    red: 'text-red-400 border-red-500/30 bg-red-500/5',
    green: 'text-green-400 border-green-500/30 bg-green-500/5',
    purple: 'text-purple-400 border-purple-500/30 bg-purple-500/5',
    blue: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
    indigo: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5'
  }[tone]

  return (
    <div className={`border p-5 ${toneClass}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-5 h-5 opacity-80" />
      </div>
      <div className="font-display text-2xl md:text-3xl font-bold">{value}</div>
      <div className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] mt-1">{label}</div>
    </div>
  )
}
