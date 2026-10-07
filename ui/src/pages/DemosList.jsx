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
    <div className={`bg-white rounded-xl p-4 border border-zinc-100 shadow-sm flex items-center gap-3 transition-opacity ${dimmed ? 'opacity-50' : ''}`}>
      <div className={`p-2 rounded-lg ${iconBg}`}>
        <Icon size={15} />
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-900 leading-none">{value}</p>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-0.5">{label}</p>
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
  const archived = demos.filter(d => d.STATUS === 'ARCHIVED').length
  const totalClients = demos.reduce((sum, d) => sum + (d.clientCount || 0), 0)
  const hasFilters = filters.status || filters.search || filters.systemType || filters.landscape

  // Keyboard shortcuts
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
          <div className="flex items-center gap-1 text-zinc-400 text-xs">
            <Keyboard size={12} />
            <span>j/k · Enter · e · x</span>
          </div>
          <Link to="/demos/new" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} /> New Demo
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-4 gap-4">
            <StatCard label={hasFilters ? 'Filtered' : 'Total'} value={demos.length} icon={ChevronRight} iconBg="bg-brand-light text-brand" />
            <StatCard label="Ready"         value={ready}        icon={CheckCircle} iconBg="bg-emerald-50 text-emerald-600" dimmed={ready === 0} />
            <StatCard label="Draft"         value={draft}        icon={Edit3}       iconBg="bg-amber-50 text-amber-600"    dimmed={draft === 0} />
            <StatCard label="Presentations" value={totalClients} icon={Users}       iconBg="bg-violet-50 text-violet-600"  dimmed={totalClients === 0} />
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white rounded-xl px-4 py-3 border border-zinc-100 shadow-sm flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search title, description, tags…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <select
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand text-zinc-700"
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">All statuses</option>
            <option value="READY">Ready</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand text-zinc-700"
            onChange={e => setFilters(f => ({ ...f, systemType: e.target.value }))}
          >
            <option value="">All system types</option>
            <option value="SAC">SAC</option>
            <option value="DATASPHERE">Datasphere</option>
            <option value="BDC">BDC</option>
            <option value="S4HANA">S/4HANA</option>
            <option value="BW4HANA">BW/4HANA</option>
          </select>
          <select
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand text-zinc-700"
            onChange={e => setFilters(f => ({ ...f, landscape: e.target.value }))}
          >
            <option value="">All landscapes</option>
            {Object.entries(LANDSCAPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {hasFilters && (
            <button onClick={() => setFilters({ status: '', search: '', systemType: '', landscape: '' })} className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors">
              Clear ✕
            </button>
          )}
          {demos.length > 0 && !loading && (
            <button onClick={() => exportCSV(demos)} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors flex-shrink-0">
              <Download size={13} /> Export CSV
            </button>
          )}
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="bg-brand rounded-xl px-5 py-3 flex items-center gap-4 shadow-lg shadow-blue-900/20">
            <span className="text-white text-sm font-semibold">{selected.size} selected</span>
            <button onClick={() => setSelected(new Set())} className="text-blue-200 hover:text-white transition-colors"><X size={14} /></button>
            <div className="ml-auto flex items-center gap-2">
              {bulkError && <span className="text-red-300 text-xs">{bulkError}</span>}
              <button onClick={() => handleBulkAction('archive')} disabled={bulkLoading} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors disabled:opacity-50">
                <Archive size={13} /> Archive
              </button>
              <button onClick={() => handleBulkAction('delete')} disabled={bulkLoading} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-red-500/30 hover:bg-red-500/50 text-white border border-red-400/30 transition-colors disabled:opacity-50">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">Failed to load demos. Please try again.</div>
        )}

        {/* Table */}
        <div ref={tableRef} className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="pl-5 pr-3 py-3 w-10">
                  <input type="checkbox" className="rounded border-zinc-300 text-brand focus:ring-brand" checked={demos.length > 0 && selected.size === demos.length} onChange={toggleAll} />
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider w-36">Completeness</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Created by</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Presentations</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2"><Spinner /><span className="text-xs text-zinc-400">Loading…</span></div>
                  </td>
                </tr>
              ) : demos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center"><Search size={18} className="text-zinc-300" /></div>
                      <p className="text-sm font-medium text-zinc-400">No demos found</p>
                      {hasFilters && <p className="text-xs text-zinc-300">Try adjusting your filters</p>}
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
                      className={`group border-b border-zinc-50 last:border-0 transition-colors cursor-pointer ${
                        isFocused ? 'bg-brand-light ring-1 ring-inset ring-brand/30' : isSelected ? 'bg-blue-50/50' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <td className="pl-5 pr-3 py-4" onClick={e => { e.stopPropagation(); toggleSelect(demo.ID) }}>
                        <input type="checkbox" className="rounded border-zinc-300 text-brand focus:ring-brand" checked={isSelected} onChange={() => toggleSelect(demo.ID)} />
                      </td>
                      <td className="px-3 py-4">
                        <Link to={`/demos/${demo.ID}`} className="font-medium text-zinc-800 group-hover:text-brand transition-colors text-sm line-clamp-1">
                          {demo.TITLE}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-500 whitespace-nowrap">{demo.DEMODATE || '—'}</td>
                      <td className="px-4 py-4"><StatusBadge status={demo.STATUS} /></td>
                      <td className="px-4 py-4 w-36">
                        {demo.completeness != null ? <CompletenessBar score={demo.completeness} compact /> : <span className="text-xs text-zinc-300">—</span>}
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-500">{demo.CREATEDBY ? demo.CREATEDBY.split('@')[0] : '—'}</td>
                      <td className="px-4 py-4">
                        {demo.clientCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full">
                            <Users size={10} /> {demo.clientCount}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link to={`/demos/${demo.ID}`} className="text-zinc-300 group-hover:text-brand transition-colors"><ChevronRight size={16} /></Link>
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
