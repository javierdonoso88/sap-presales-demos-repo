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
      <aside className="w-60 flex-shrink-0 bg-[#0040b0] flex flex-col">
        <div className="p-4 border-b border-blue-700">
          <div className="text-white font-bold text-lg leading-tight">SAP Presales</div>
          <div className="text-blue-200 text-sm">Demo Repository</div>
        </div>

        {/* Search button */}
        <div className="px-3 pt-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-blue-300 hover:text-white hover:bg-blue-800 transition-colors border border-blue-700 hover:border-blue-600"
          >
            <Search size={14} />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="text-xs bg-blue-900/60 border border-blue-600 rounded px-1.5 py-0.5 font-mono leading-none">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 mt-2">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-sap-blue text-white'
                    : 'text-blue-200 hover:text-white hover:bg-blue-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sap-gold flex items-center justify-center text-sm font-bold text-gray-900">U</div>
            <span className="text-blue-200 text-sm">Presales User</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-sap-gray-light">
        <Outlet />
      </main>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
