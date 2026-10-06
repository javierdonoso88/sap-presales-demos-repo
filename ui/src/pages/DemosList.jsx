import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, CheckCircle, Edit3, Archive, Users, ChevronRight } from 'lucide-react'
import { useDemos } from '../hooks/useDemos'
import Spinner from '../components/shared/Spinner'

const STATUS_PILL = {
  READY: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  DRAFT: 'bg-slate-100 text-slate-600 border border-slate-200',
  ARCHIVED: 'bg-amber-50 text-amber-700 border border-amber-200',
}
const STATUS_LABEL = { READY: 'Ready', DRAFT: 'Draft', ARCHIVED: 'Archived' }

function StatCard({ label, value, icon: Icon, iconClass, dimmed }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-gray-50 flex items-center gap-3 transition-opacity ${dimmed ? 'opacity-60' : ''}`}>
      <div className={`p-2 rounded-lg ${iconClass}`}>
        <Icon size={15} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function DemosList() {
  const [filters, setFilters] = useState({ status: '', search: '', systemType: '' })
  const { demos, loading, error } = useDemos(filters)

  const ready = demos.filter(d => d.STATUS === 'READY').length
  const draft = demos.filter(d => d.STATUS === 'DRAFT').length
  const archived = demos.filter(d => d.STATUS === 'ARCHIVED').length
  const totalClients = demos.reduce((sum, d) => sum + (d.clientCount || 0), 0)
  const hasFilters = filters.status || filters.search || filters.systemType

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 px-6 pt-8 pb-20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Repository</p>
            <h1 className="text-white text-3xl font-black tracking-tight">Demos</h1>
            <p className="text-slate-400 text-sm mt-1">All presales demo records</p>
          </div>
          <Link
            to="/demos/new"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors border border-white/15"
          >
            <Plus size={15} /> New Demo
          </Link>
        </div>
      </div>

      <div className="px-6 -mt-12 space-y-5">
        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-4 gap-4">
            <StatCard label={hasFilters ? 'Filtered' : 'Total'} value={demos.length} icon={ChevronRight} iconClass="bg-gradient-to-br from-blue-500 to-blue-700" />
            <StatCard label="Ready" value={ready} icon={CheckCircle} iconClass="bg-gradient-to-br from-emerald-400 to-emerald-600" dimmed={ready === 0} />
            <StatCard label="Draft" value={draft} icon={Edit3} iconClass="bg-gradient-to-br from-amber-400 to-amber-600" dimmed={draft === 0} />
            <StatCard label="Presentations" value={totalClients} icon={Users} iconClass="bg-gradient-to-br from-violet-500 to-violet-700" dimmed={totalClients === 0} />
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white rounded-2xl px-4 py-3 shadow-xl shadow-slate-200/60 border border-gray-50 flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search demos…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sap-blue focus:border-transparent"
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sap-blue text-gray-700"
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">All statuses</option>
            <option value="READY">Ready</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sap-blue text-gray-700"
            onChange={e => setFilters(f => ({ ...f, systemType: e.target.value }))}
          >
            <option value="">All system types</option>
            <option value="SAC">SAC</option>
            <option value="DATASPHERE">Datasphere</option>
            <option value="BDC">BDC</option>
            <option value="S4HANA">S/4HANA</option>
            <option value="BW4HANA">BW/4HANA</option>
          </select>
          {hasFilters && (
            <button
              onClick={() => setFilters({ status: '', search: '', systemType: '' })}
              className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
            >
              Clear ✕
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
            Failed to load demos. Please try again.
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-gray-50 overflow-hidden pb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-50">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Title</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Created by</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Presentations</th>
                <th className="px-4 py-4" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Spinner />
                      <span className="text-xs text-gray-400">Loading…</span>
                    </div>
                  </td>
                </tr>
              ) : demos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                        <Search size={18} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-400">No demos found</p>
                      {hasFilters && <p className="text-xs text-gray-300">Try adjusting your filters</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                demos.map(demo => (
                  <tr key={demo.ID} className="group border-b border-gray-50 last:border-0 hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/demos/${demo.ID}`} className="font-semibold text-gray-800 group-hover:text-sap-blue transition-colors text-sm line-clamp-1">
                        {demo.TITLE}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{demo.DEMODATE || '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_PILL[demo.STATUS] || STATUS_PILL.DRAFT}`}>
                        {STATUS_LABEL[demo.STATUS] || demo.STATUS}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {demo.CREATEDBY ? demo.CREATEDBY.split('@')[0] : '—'}
                    </td>
                    <td className="px-4 py-4">
                      {demo.clientCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">
                          <Users size={10} /> {demo.clientCount}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link to={`/demos/${demo.ID}`} className="text-gray-300 group-hover:text-sap-blue transition-colors">
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
