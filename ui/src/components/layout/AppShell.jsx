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
    <div className="flex h-screen overflow-hidden bg-surface-secondary">
      <aside className="w-56 flex-shrink-0 bg-white border-r border-surface-border flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">SP</span>
            </div>
            <div>
              <div className="text-slate-900 font-semibold text-sm leading-tight">SAP Presales</div>
              <div className="text-slate-400 text-xs">Demo Repository</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pt-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200"
          >
            <Search size={13} />
            <span className="flex-1 text-left text-xs">Search…</span>
            <kbd className="text-xs bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono leading-none text-slate-400">⌘K</kbd>
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
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-light text-brand font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-surface-border">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white flex-shrink-0">U</div>
            <span className="text-slate-500 text-xs truncate">Presales User</span>
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
