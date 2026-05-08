'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Home, MessageSquare, Zap, BookOpen, TrendingUp, Trophy,
  LogOut, Menu, X, Map, Users, Clock, Heart, Scale, HomeIcon,
  Bell, Search, ChevronRight,
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: { id: string; name: string; email: string; lifeDecoderScore: number }
}

const NAV_ITEMS = [
  { label: 'Dashboard',     href: '/dashboard',   icon: Home,        emoji: '🏠' },
  { label: 'Roadmap',       href: '/roadmap',      icon: Map,         emoji: '🗺️' },
  { label: 'AI Coach',      href: '/coach',        icon: MessageSquare, emoji: '🤖' },
  { label: 'Simulations',   href: '/simulations',  icon: Zap,         emoji: '⚡' },
  { label: 'Micro Courses', href: '/courses',      icon: Clock,       emoji: '📚' },
  { label: 'Documents',     href: '/documents',    icon: BookOpen,    emoji: '📄' },
  { label: 'Finance',       href: '/finance',      icon: TrendingUp,  emoji: '💰' },
  { label: 'Healthcare',    href: '/healthcare',   icon: Heart,       emoji: '🏥' },
  { label: 'Renting 101',   href: '/renting',      icon: HomeIcon,    emoji: '🏡' },
  { label: 'Your Rights',   href: '/rights',       icon: Scale,       emoji: '⚖️' },
  { label: 'Community',     href: '/community',    icon: Users,       emoji: '👥' },
  { label: 'Achievements',  href: '/achievements', icon: Trophy,      emoji: '🏆' },
]

const BB  = '#00ABE4'
const BB2 = '#0090c0'
const T   = '#0a2540'
const LD  = '#c8dff0'

// Page title map
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':   'Dashboard',
  '/roadmap':     'Learning Roadmap',
  '/coach':       'AI Life Coach',
  '/simulations': 'Life Simulations',
  '/courses':     'Micro Courses',
  '/documents':   'Document Decoder',
  '/finance':     'Finance Hub',
  '/healthcare':  'Healthcare Navigator',
  '/renting':     'Renting 101',
  '/rights':      'Your Rights',
  '/community':   'Community',
  '/achievements':'Achievements',
}

export default function DashboardLayout({ children, user: propUser }: DashboardLayoutProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState(propUser)
  const [xp, setXp] = useState(0)

  useEffect(() => {
    if (!propUser) {
      const s = localStorage.getItem('currentUser')
      if (s) {
        const p = JSON.parse(s)
        setUser({ id: p.id, name: p.name, email: p.email, lifeDecoderScore: p.lifeDecoderScore || 0 })
        setXp(p.xp || 0)
      }
    }
    // Listen for XP updates
    const onStorage = () => {
      const s = localStorage.getItem('currentUser')
      if (s) { const p = JSON.parse(s); setXp(p.xp || 0) }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [propUser])

  const handleLogout = () => { localStorage.removeItem('currentUser'); router.push('/') }
  const pageTitle = PAGE_TITLES[pathname] || 'LifeDecoder'

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 z-40 flex flex-col transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'var(--card)', borderRight: `1px solid ${LD}`, boxShadow: '4px 0 20px rgba(0,0,0,0.06)' }}>

        {/* Logo */}
        <div className="px-5 py-4 flex-shrink-0 flex items-center gap-3" style={{ borderBottom: `1px solid ${LD}` }}>
          <Link href="/dashboard" className="flex items-center gap-2.5 group flex-1">
            <img src="/logo.png" alt="LifeDecoder" className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" style={{ color: '#6b6f9e' }} />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-2.5 flex-1 overflow-y-auto space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium relative overflow-hidden group transition-all duration-200"
                style={active
                  ? { background: `linear-gradient(135deg, ${T}, ${BB})`, color: '#fff', boxShadow: '0 3px 10px rgba(17,20,57,0.22)' }
                  : { color: '#4a4e7a' }}>
                {!active && (
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-xl"
                    style={{ background: 'rgba(17,20,57,0.05)' }} />
                )}
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white/40" />}
                <span className="text-base flex-shrink-0 relative z-10">{item.emoji}</span>
                <span className="relative z-10 flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 relative z-10 opacity-60" />}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        {user && (
          <div className="p-3 flex-shrink-0" style={{ borderTop: `1px solid ${LD}` }}>
            <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(17,20,57,0.04)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${T}, ${BB})` }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: T }}>{user.name}</p>
                <p className="text-xs" style={{ color: '#6b6f9e' }}>{xp} XP · Score {user.lifeDecoderScore}</p>
              </div>
              <button onClick={handleLogout}
                className="p-1.5 rounded-lg transition-all duration-200 hover:bg-red-50"
                style={{ color: '#9999b8' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9999b8')}>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Top header bar (mobile + desktop) ───────────────── */}
      <header className="lg:ml-64 sticky top-0 z-30 flex items-center justify-between px-5 lg:px-8 h-14"
        style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${LD}` }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl transition-all active:scale-95"
            style={{ background: '#fff', border: `1px solid ${LD}` }}>
            <Menu className="w-4 h-4" style={{ color: T }} />
          </button>
          <div>
            <h1 className="text-sm font-bold" style={{ color: T }}>{pageTitle}</h1>
            <p className="text-xs hidden sm:block" style={{ color: '#6b6f9e' }}>LifeDecoder Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* XP pill */}
          {xp > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(17,20,57,0.07)', color: T }}>
              ⚡ {xp} XP
            </div>
          )}
          {/* Avatar */}
          {user && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${T}, ${BB})` }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-5 lg:p-7 page-content">
          {children}
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
