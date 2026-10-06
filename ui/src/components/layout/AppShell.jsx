import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Database } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/demos', icon: BookOpen, label: 'Demos' },
  { to: '/master-data', icon: Database, label: 'Master Data' },
]

export default function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 flex-shrink-0 bg-[#0040b0] flex flex-col">
        <div className="p-4 border-b border-blue-700">
          <div className="text-white font-bold text-lg leading-tight">SAP Presales</div>
          <div className="text-blue-200 text-sm">Demo Repository</div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
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
    </div>
  )
}
