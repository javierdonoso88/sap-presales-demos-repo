import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight, Users } from 'lucide-react'
import { useDemos } from '../hooks/useDemos'
import Spinner from '../components/shared/Spinner'
import StatusBadge from '../components/shared/StatusBadge'
import PageShell from '../components/layout/PageShell'

function groupByMonth(demos) {
  const groups = {}
  const undated = []
  for (const d of demos) {
    const dateStr = d.DEMODATE || d.CREATEDAT
    if (!dateStr) { undated.push(d); continue }
    const date = new Date(dateStr)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(d)
  }
  const sorted = Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  if (undated.length) sorted.push(['__undated__', undated])
  return sorted
}

function monthLabel(key) {
  if (key === '__undated__') return 'No date'
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

export default function Timeline() {
  const [filters, setFilters] = useState({ status: '', systemType: '' })
  const { demos, loading } = useDemos(filters)
  const grouped = groupByMonth(demos)
  const hasFilters = filters.status || filters.systemType

  return (
    <PageShell
      label="History"
      title="Timeline"
      subtitle="Demo activity over time"
    >
      <div className="space-y-5">
        {/* Filter bar */}
        <div className="bg-white rounded-xl px-4 py-3 border border-zinc-100 shadow-sm flex gap-3 items-center flex-wrap">
          <CalendarDays size={15} className="text-zinc-400 flex-shrink-0" />
          <select
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand text-zinc-700"
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">All statuses</option>
            <option value="READY">Ready</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand text-zinc-700"
            value={filters.systemType}
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
            <button onClick={() => setFilters({ status: '', systemType: '' })} className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 ml-auto transition-colors">
              Clear ✕
            </button>
          )}
          {!hasFilters && <span className="ml-auto text-xs text-zinc-400">{demos.length} demos</span>}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : demos.length === 0 ? (
          <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-16 text-center">
            <CalendarDays size={28} className="text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-400">No demos found</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[116px] top-2 bottom-2 w-px bg-zinc-200 pointer-events-none" />
            <div className="space-y-8">
              {grouped.map(([month, monthDemos]) => (
                <div key={month} className="flex">
                  <div className="w-[108px] flex-shrink-0 text-right pr-4 pt-1.5">
                    <p className="text-xs font-semibold text-zinc-500 leading-snug">
                      {monthLabel(month).split(' ').map((part, i) => (
                        <span key={i} className="block">{part}</span>
                      ))}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-[16px] flex justify-center pt-2">
                    <div className="w-3 h-3 rounded-full bg-brand border-2 border-white shadow-sm" />
                  </div>
                  <div className="flex-1 pl-4 space-y-3">
                    {monthDemos.map(demo => (
                      <Link
                        key={demo.ID}
                        to={`/demos/${demo.ID}`}
                        className="block bg-white rounded-xl border border-zinc-100 shadow-sm hover:shadow-md hover:border-brand/30 transition-all p-4 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-800 group-hover:text-brand transition-colors truncate">
                              {demo.TITLE}
                            </p>
                            {demo.DEMODATE && <p className="text-xs text-zinc-400 mt-0.5">{demo.DEMODATE}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {demo.clientCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full">
                                <Users size={10} /> {demo.clientCount}
                              </span>
                            )}
                            <StatusBadge status={demo.STATUS} />
                            <ChevronRight size={14} className="text-zinc-300 group-hover:text-brand transition-colors" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
