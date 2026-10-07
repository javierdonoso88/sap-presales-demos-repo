import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, CheckCircle, Edit3, Archive, Users, ChevronRight, Download, Trash2, X, Keyboard } from 'lucide-react'
import { useDemos } from '../hooks/useDemos'
import api from '../api/client'
import Spinner from '../components/shared/Spinner'
import CompletenessBar from '../components/shared/CompletenessBar'
import StatusBadge from '../components/shared/StatusBadge'
import PageShell from '../components/layout/PageShell'

const LANDSCAPE_LABELS = { BDC_GA: 'BDC GA', GLA26Q2: 'GLA26Q2', SANDBOX: 'Sandbox', EXTERNAL: 'External' }

function StatCard({ label, value, icon: Icon, iconBg, dimmed }) {
  return (
    <div className={`glass rounded-xl p-4 flex items-center gap-3 transition-opacity ${dimmed ? 'opacity-40' : ''}`}>
      <div className={`p-2 rounded-lg ${iconBg}`}>
        <Icon size={15} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>{label}</p>
      </div>
    </div>
  )
}

function exportCSV(demos) {
  const headers = ['Title', 'Date', 'Status', 'Completeness', 'Created By', 'Presentations']
  const rows = demos.map(d => [
    `"${(d.TITLE || '').replace(/"/g, '""')}"`,
    d.DEMODATE || '',
    d.STATUS || '',
    d.completeness ?? 0,
    d.CREATEDBY ? d.CREATEDBY.split('@')[0] : '',
    d.clientCount || 0,
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `demos-export-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const selectCls = 'glass-input rounded-lg px-3 py-2 text-sm focus:outline-none'

export default function DemosList() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ status: '', search: '', systemType: '', landscape: '' })
  const { demos, loading, error, reload } = useDemos(filters)
  const [selected, setSelected] = useState(new Set())
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkError, setBulkError] = useState(null)
  const tableRef = useRef(null)

  const ready    = demos.filter(d => d.STATUS === 'READY').length
  const draft    = demos.filter(d => d.STATUS === 'DRAFT').length
  const totalClients = demos.reduce((sum, d) => sum + (d.clientCount || 0), 0)
  const hasFilters = filters.status || filters.search || filters.systemType || filters.landscape

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIdx(i => Math.min(i + 1, demos.length - 1))
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && focusedIdx >= 0 && demos[focusedIdx]) {
        navigate(`/demos/${demos[focusedIdx].ID}`)
      } else if (e.key === 'e' && focusedIdx >= 0 && demos[focusedIdx]) {
        navigate(`/demos/${demos[focusedIdx].ID}/edit`)
      } else if (e.key === 'x' && focusedIdx >= 0 && demos[focusedIdx]) {
        const id = demos[focusedIdx].ID
        setSelected(prev => {
          const next = new Set(prev)
          next.has(id) ? next.delete(id) : next.add(id)
          return next
        })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [demos, focusedIdx, navigate])

  useEffect(() => { setFocusedIdx(-1) }, [filters])

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (selected.size === demos.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(demos.map(d => d.ID)))
    }
  }, [selected.size, demos])

  const handleBulkAction = async (action) => {
    if (!window.confirm(`${action === 'delete' ? 'Delete' : 'Archive'} ${selected.size} demo(s)? This cannot be undone.`)) return
    setBulkLoading(true); setBulkError(null)
    try {
      await api.post('/demos/bulk', { ids: [...selected], action })
      setSelected(new Set())
      reload()
    } catch (err) { setBulkError(err.error || `Bulk ${action} failed`) }
    finally { setBulkLoading(false) }
  }

  return (
    <PageShell
      label="Repository"
      title="Demos"
      subtitle="All presales demo records"
      action={
        <>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
            <Keyboard size={12} />
            <span>j/k · Enter · e · x</span>
          </div>
          <Link to="/demos/new" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            style={{ boxShadow: '0 4px 16px rgba(77,166,255,0.30)' }}>
            <Plus size={15} /> New Demo
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-4 gap-4">
            <StatCard label={hasFilters ? 'Filtered' : 'Total'} value={demos.length} icon={ChevronRight} iconBg="bg-blue-400/15 text-blue-400" />
            <StatCard label="Ready"         value={ready}        icon={CheckCircle} iconBg="bg-emerald-400/15 text-emerald-400" dimmed={ready === 0} />
            <StatCard label="Draft"         value={draft}        icon={Edit3}       iconBg="bg-amber-400/15 text-amber-400"    dimmed={draft === 0} />
            <StatCard label="Presentations" value={totalClients} icon={Users}       iconBg="bg-violet-400/15 text-violet-400"  dimmed={totalClients === 0} />
          </div>
        )}

        {/* Filter bar */}
        <div className="glass rounded-xl px-4 py-3 flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.35)' }} />
            <input
              type="text"
              placeholder="Search title, description, tags…"
              className="glass-input w-full pl-8 pr-3 py-2 text-sm rounded-lg"
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <select className={selectCls} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All statuses</option>
            <option value="READY">Ready</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select className={selectCls} onChange={e => setFilters(f => ({ ...f, systemType: e.target.value }))}>
            <option value="">All system types</option>
            <option value="SAC">SAC</option>
            <option value="DATASPHERE">Datasphere</option>
            <option value="BDC">BDC</option>
            <option value="S4HANA">S/4HANA</option>
            <option value="BW4HANA">BW/4HANA</option>
          </select>
          <select className={selectCls} onChange={e => setFilters(f => ({ ...f, landscape: e.target.value }))}>
            <option value="">All landscapes</option>
            {Object.entries(LANDSCAPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {hasFilters && (
            <button onClick={() => setFilters({ status: '', search: '', systemType: '', landscape: '' })}
              className="text-xs font-semibold transition-colors" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Clear ✕
            </button>
          )}
          {demos.length > 0 && !loading && (
            <button onClick={() => exportCSV(demos)}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.60)' }}>
              <Download size={13} /> Export CSV
            </button>
          )}
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="rounded-xl px-5 py-3 flex items-center gap-4"
            style={{ background: 'rgba(77,166,255,0.15)', border: '1px solid rgba(77,166,255,0.30)', boxShadow: '0 4px 24px rgba(77,166,255,0.15)' }}>
            <span className="text-white text-sm font-semibold">{selected.size} selected</span>
            <button onClick={() => setSelected(new Set())} style={{ color: 'rgba(255,255,255,0.50)' }}><X size={14} /></button>
            <div className="ml-auto flex items-center gap-2">
              {bulkError && <span className="text-red-300 text-xs">{bulkError}</span>}
              <button onClick={() => handleBulkAction('archive')} disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)', color: 'white' }}>
                <Archive size={13} /> Archive
              </button>
              <button onClick={() => handleBulkAction('delete')} disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                style={{ background: 'rgba(248,113,113,0.20)', border: '1px solid rgba(248,113,113,0.30)', color: '#fca5a5' }}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="glass rounded-xl p-4 text-sm" style={{ border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5' }}>
            Failed to load demos. Please try again.
          </div>
        )}

        {/* Table */}
        <div ref={tableRef} className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <th className="pl-5 pr-3 py-3 w-10">
                  <input type="checkbox" className="rounded border-white/20 bg-white/10 text-brand focus:ring-brand/50"
                    checked={demos.length > 0 && selected.size === demos.length} onChange={toggleAll} />
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-36" style={{ color: 'rgba(255,255,255,0.40)' }}>Completeness</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>Created by</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>Presentations</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Spinner />
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading…</span>
                    </div>
                  </td>
                </tr>
              ) : demos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <Search size={18} style={{ color: 'rgba(255,255,255,0.20)' }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>No demos found</p>
                      {hasFilters && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Try adjusting your filters</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                demos.map((demo, idx) => {
                  const isFocused  = focusedIdx === idx
                  const isSelected = selected.has(demo.ID)
                  return (
                    <tr
                      key={demo.ID}
                      onClick={() => setFocusedIdx(idx)}
                      className="group transition-colors cursor-pointer"
                      style={{
                        borderBottom: idx < demos.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: isFocused
                          ? 'rgba(77,166,255,0.10)'
                          : isSelected
                          ? 'rgba(77,166,255,0.06)'
                          : 'transparent',
                      }}
                      onMouseEnter={e => { if (!isFocused && !isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { if (!isFocused && !isSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      <td className="pl-5 pr-3 py-4" onClick={e => { e.stopPropagation(); toggleSelect(demo.ID) }}>
                        <input type="checkbox" className="rounded border-white/20 bg-white/10 text-brand focus:ring-brand/50" checked={isSelected} onChange={() => toggleSelect(demo.ID)} />
                      </td>
                      <td className="px-3 py-4">
                        <Link to={`/demos/${demo.ID}`} className="font-medium text-white group-hover:text-brand transition-colors text-sm line-clamp-1">
                          {demo.TITLE}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.50)' }}>{demo.DEMODATE || '—'}</td>
                      <td className="px-4 py-4"><StatusBadge status={demo.STATUS} /></td>
                      <td className="px-4 py-4 w-36">
                        {demo.completeness != null ? <CompletenessBar score={demo.completeness} compact /> : <span className="text-xs" style={{ color: 'rgba(255,255,255,0.20)' }}>—</span>}
                      </td>
                      <td className="px-4 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.50)' }}>{demo.CREATEDBY ? demo.CREATEDBY.split('@')[0] : '—'}</td>
                      <td className="px-4 py-4">
                        {demo.clientCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.25)' }}>
                            <Users size={10} /> {demo.clientCount}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link to={`/demos/${demo.ID}`} className="group-hover:text-brand transition-colors" style={{ color: 'rgba(255,255,255,0.18)' }}>
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  )
}
