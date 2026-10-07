import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Database, CalendarDays, Search, Columns } from 'lucide-react'
import CommandPalette from '../shared/CommandPalette'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/demos', icon: BookOpen, label: 'Demos' },
  { to: '/timeline', icon: CalendarDays, label: 'Timeline' },
  { to: '/kanban', icon: Columns, label: 'Kanban' },
  { to: '/master-data', icon: Database, label: 'Master Data' },
]

export default function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 flex-shrink-0 flex flex-col glass-sidebar">
        {/* Logo */}
        <div className="px-4 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4da6ff, #0070f2)', boxShadow: '0 4px 16px rgba(77,166,255,0.35)' }}>
              <span className="text-white text-xs font-bold">SP</span>
            </div>
            <div>
              <div className="text-white font-semibold text-sm leading-tight">SAP Presales</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Demo Repository</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pt-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Search size={13} style={{ color: 'rgba(255,255,255,0.35)' }} />
            <span className="flex-1 text-left text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Search…</span>
            <kbd className="text-xs rounded px-1.5 py-0.5 font-mono leading-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.30)' }}>⌘K</kbd>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 mt-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'text-white glass-nav-active' : 'hover:text-white/80'
                }`
              }
              style={({ isActive }) => isActive ? {} : { color: 'rgba(255,255,255,0.48)' }}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4da6ff, #0070f2)', boxShadow: '0 2px 8px rgba(77,166,255,0.30)' }}>U</div>
            <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>Presales User</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <Outlet />
      </main>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
