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
      <aside className="w-60 flex-shrink-0 bg-sidebar-bg flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-zinc-800">
          <div className="text-white font-bold text-base leading-tight tracking-tight">SAP Presales</div>
          <div className="text-zinc-400 text-xs mt-0.5">Demo Repository</div>
        </div>

        {/* Search */}
        <div className="px-3 pt-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-sidebar-hover transition-colors border border-zinc-800"
          >
            <Search size={13} />
            <span className="flex-1 text-left text-xs">Search…</span>
            <kbd className="text-xs bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 font-mono leading-none text-zinc-500">⌘K</kbd>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 mt-2">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-sidebar-text hover:text-white hover:bg-sidebar-hover'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white flex-shrink-0">U</div>
            <span className="text-zinc-400 text-xs truncate">Presales User</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-zinc-50 scrollbar-thin">
        <Outlet />
      </main>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
