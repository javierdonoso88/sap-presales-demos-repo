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
        <div className="glass rounded-xl px-4 py-2.5 flex gap-2 items-center">
          <CalendarDays size={14} className="text-brand flex-shrink-0" />
          <select className="glass-input flex-shrink-0 rounded-md py-1.5 px-2.5 text-sm" style={{ width: 'auto' }}
            value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">Status</option>
            <option value="READY">Ready</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select className="glass-input flex-shrink-0 rounded-md py-1.5 px-2.5 text-sm" style={{ width: 'auto' }}
            value={filters.systemType} onChange={e => setFilters(f => ({ ...f, systemType: e.target.value }))}>
            <option value="">System</option>
            <option value="SAC">SAC</option>
            <option value="DATASPHERE">Datasphere</option>
            <option value="BDC">BDC</option>
            <option value="S4HANA">S/4HANA</option>
            <option value="BW4HANA">BW/4HANA</option>
          </select>
          {hasFilters && (
            <button onClick={() => setFilters({ status: '', systemType: '' })}
              className="flex-shrink-0 text-xs font-semibold transition-colors" style={{ color: 'rgba(255,255,255,0.38)' }}>
              ✕
            </button>
          )}
          <span className="ml-auto text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.38)' }}>{demos.length} demos</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : demos.length === 0 ? (
          <div className="glass rounded-xl p-16 text-center">
            <CalendarDays size={28} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.18)' }} />
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>No demos found</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[116px] top-2 bottom-2 w-px pointer-events-none" style={{ background: 'rgba(255,255,255,0.10)' }} />
            <div className="space-y-8">
              {grouped.map(([month, monthDemos]) => (
                <div key={month} className="flex">
                  <div className="w-[108px] flex-shrink-0 text-right pr-4 pt-1.5">
                    <p className="text-xs font-semibold leading-snug" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {monthLabel(month).split(' ').map((part, i) => (
                        <span key={i} className="block">{part}</span>
                      ))}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-[16px] flex justify-center pt-2">
                    <div className="w-3 h-3 rounded-full bg-brand" style={{ boxShadow: '0 0 8px rgba(77,166,255,0.60)', border: '2px solid rgba(255,255,255,0.12)' }} />
                  </div>
                  <div className="flex-1 pl-4 space-y-3">
                    {monthDemos.map(demo => (
                      <Link
                        key={demo.ID}
                        to={`/demos/${demo.ID}`}
                        className="block glass rounded-xl p-4 group transition-all"
                        style={{ textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white group-hover:text-brand transition-colors truncate">
                              {demo.TITLE}
                            </p>
                            {demo.DEMODATE && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{demo.DEMODATE}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {demo.clientCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.25)' }}>
                                <Users size={10} /> {demo.clientCount}
                              </span>
                            )}
                            <StatusBadge status={demo.STATUS} />
                            <ChevronRight size={14} className="group-hover:text-brand transition-colors" style={{ color: 'rgba(255,255,255,0.20)' }} />
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
