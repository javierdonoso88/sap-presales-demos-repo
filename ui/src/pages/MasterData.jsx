import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import Spinner from '../components/shared/Spinner'
import Modal from '../components/shared/Modal'
import StatusBadge from '../components/shared/StatusBadge'
import PageShell from '../components/layout/PageShell'
import { Server, Users, Plus, ExternalLink, BarChart2, ChevronRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const inputCls = 'glass-input'
const labelCls = 'block text-xs font-semibold mb-1.5 uppercase tracking-wide'
const labelStyle = { color: 'rgba(255,255,255,0.40)' }

const SYSTEM_TYPES = ['SAC', 'DATASPHERE', 'BDC', 'S4HANA', 'BW4HANA', 'OTHER']
const LANDSCAPES = ['BDC_GA', 'GLA26Q2', 'SANDBOX', 'EXTERNAL']
const LANDSCAPE_LABELS = { BDC_GA: 'BDC GA', GLA26Q2: 'GLA26Q2', SANDBOX: 'Sandbox', EXTERNAL: 'External' }

const LANDSCAPE_COLORS = {
  BDC_GA:   'bg-blue-400/15 text-blue-400',
  GLA26Q2:  'bg-violet-400/15 text-violet-400',
  SANDBOX:  'bg-amber-400/15 text-amber-400',
  EXTERNAL: 'bg-white/10 text-white/50',
}
const TYPE_COLORS = {
  SAC:        'bg-teal-400/15 text-teal-400',
  DATASPHERE: 'bg-blue-400/15 text-blue-400',
  BDC:        'bg-indigo-400/15 text-indigo-400',
  S4HANA:     'bg-emerald-400/15 text-emerald-400',
  BW4HANA:    'bg-orange-400/15 text-orange-400',
  OTHER:      'bg-white/10 text-white/50',
}
const RESULT_COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#c084fc', '#94a3b8']
const GRID_COLOR = 'rgba(255,255,255,0.08)'
const TICK_COLOR = 'rgba(255,255,255,0.38)'

// ─── Generic CRUD Tab ─────────────────────────────────────────────────────────
function CrudTab({ resource, columns, emptyForm, renderForm, onCountChange, extraActions }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    api.get(`/${resource}`)
      .then(res => {
        const data = res.data || []
        setItems(data)
        onCountChange?.(data.length)
      })
      .catch(err => setError(err.error || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [resource])

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      if (editId) await api.put(`/${resource}/${editId}`, form)
      else await api.post(`/${resource}`, form)
      setForm(emptyForm); setShowAdd(false); setEditId(null); load()
    } catch (err) { setError(err.error || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleEdit = (item) => {
    setForm(Object.fromEntries(columns.map(c => [c.field, item[c.editKey ?? c.key] ?? ''])))
    setEditId(item.ID); setShowAdd(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return
    try {
      await api.delete(`/${resource}/${id}`); load()
    } catch (err) {
      setError(err.error || 'Delete failed. It may be referenced by a demo.')
    }
  }

  const handleCancel = () => {
    setForm(emptyForm); setEditId(null); setShowAdd(false); setError(null)
  }

  return (
    <div>
      {error && (
        <div className="mx-5 mt-4 rounded-xl p-3 text-sm" style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5' }}>{error}</div>
      )}
      {showAdd && (
        <div className="m-5 p-5 rounded-xl" style={{ background: 'rgba(77,166,255,0.08)', border: '1px solid rgba(77,166,255,0.20)' }}>
          <h3 className="text-sm font-semibold text-white mb-4">{editId ? 'Edit record' : 'Add new record'}</h3>
          {renderForm(form, setForm)}
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={handleCancel}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.70)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : (
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {columns.map(col => (
                <th key={col.key} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>{col.label}</th>
              ))}
              <th className="px-5 py-3 text-right">
                {!showAdd && (
                  <button onClick={() => { setForm(emptyForm); setShowAdd(true); setEditId(null) }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand text-white hover:bg-brand-dark transition-colors">
                    <Plus size={11} /> Add
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.ID} className="group transition-colors"
                style={{ borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {columns.map(col => (
                  <td key={col.key} className="px-5 py-3.5 text-sm" style={{ color: 'rgba(255,255,255,0.70)' }}>
                    {col.render ? col.render(item[col.key], item) : (item[col.key] ?? '—')}
                  </td>
                ))}
                <td className="px-5 py-3.5 text-right">
                  {extraActions?.(item)}
                  <button onClick={() => handleEdit(item)} className="text-xs font-semibold text-brand hover:underline mr-4">Edit</button>
                  <button onClick={() => handleDelete(item.ID)} className="text-xs font-semibold hover:underline" style={{ color: '#f87171' }}>Delete</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  No items yet. Click "+ Add" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Systems Tab ──────────────────────────────────────────────────────────────
function SystemsTab({ onCount }) {
  const [statsSystem, setStatsSystem] = useState(null)

  return (
    <>
      <CrudTab
        resource="systems"
        onCountChange={onCount}
        extraActions={(item) => (
          <button onClick={() => setStatsSystem(item)} title="Analytics"
            className="text-xs font-semibold hover:underline mr-3 inline-flex items-center gap-1" style={{ color: '#c4b5fd' }}>
            <BarChart2 size={12} /> Stats
          </button>
        )}
        columns={[
        { key: 'NAME', label: 'Name', field: 'name' },
        {
          key: 'TYPE', label: 'Type', field: 'type',
          render: v => v ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[v] || TYPE_COLORS.OTHER}`}>{v}</span> : '—'
        },
        {
          key: 'LANDSCAPE', label: 'Landscape', field: 'landscape',
          render: v => v ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LANDSCAPE_COLORS[v] || LANDSCAPE_COLORS.EXTERNAL}`}>{LANDSCAPE_LABELS[v] || v}</span> : '—'
        },
        {
          key: 'URL', label: 'URL', field: 'url',
          render: v => v ? (
            <a href={v} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline text-xs font-mono">
              <ExternalLink size={11} /> Open
            </a>
          ) : '—'
        },
        {
          key: 'ACTIVE', label: 'Active', field: 'active',
          render: v => v
            ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.14)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.25)' }}>Active</span>
            : <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.10)' }}>Inactive</span>
        },
      ]}
      emptyForm={{ name: '', type: 'SAC', landscape: 'BDC_GA', url: '', description: '', active: true }}
      renderForm={(form, setForm) => (
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls} style={labelStyle}>Name *</label><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className={labelCls} style={labelStyle}>Type *</label>
            <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {SYSTEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className={labelCls} style={labelStyle}>Landscape</label>
            <select className={inputCls} value={form.landscape} onChange={e => setForm(f => ({ ...f, landscape: e.target.value }))}>
              <option value="">— none —</option>
              {LANDSCAPES.map(l => <option key={l} value={l}>{LANDSCAPE_LABELS[l]}</option>)}
            </select>
          </div>
          <div><label className={labelCls} style={labelStyle}>URL</label><input className={inputCls} value={form.url} placeholder="https://…" onChange={e => setForm(f => ({ ...f, url: e.target.value }))} /></div>
          <div className="col-span-2"><label className={labelCls} style={labelStyle}>Description</label><input className={inputCls} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="sysActiveCheck" checked={!!form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded bg-white/10 border-white/20" />
            <label htmlFor="sysActiveCheck" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.70)' }}>Active</label>
          </div>
        </div>
      )}
      />
      <SystemStatsModal system={statsSystem} open={!!statsSystem} onClose={() => setStatsSystem(null)} />
    </>
  )
}

// ─── System Stats Modal ───────────────────────────────────────────────────────
const STATUS_CHART_COLORS = { READY: '#34d399', DRAFT: '#fbbf24', ARCHIVED: '#94a3b8' }

function SystemStatsModal({ system, open, onClose }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !system) return
    setLoading(true)
    api.get(`/systems/${system.ID}/stats`)
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [open, system])

  const byStatus = stats?.demos
    ? Object.entries(
        stats.demos.reduce((acc, d) => {
          acc[d.STATUS] = (acc[d.STATUS] || 0) + 1
          return acc
        }, {})
      ).map(([status, count]) => ({ status, count }))
    : []

  const srColor = stats?.successRate == null ? 'rgba(255,255,255,0.35)'
    : stats.successRate >= 60 ? '#34d399'
    : stats.successRate >= 30 ? '#fbbf24'
    : '#f87171'

  return (
    <Modal open={open} onClose={onClose} title={`Analytics — ${system?.NAME}`}>
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : !stats ? (
        <p className="text-sm text-center py-8" style={{ color: 'rgba(255,255,255,0.35)' }}>No stats available.</p>
      ) : (
        <div className="space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(77,166,255,0.08)', border: '1px solid rgba(77,166,255,0.18)' }}>
              <p className="text-3xl font-bold text-white">{stats.demoCount}</p>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1 text-brand">Demos</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)' }}>
              <p className="text-3xl font-bold text-white">{stats.presentationCount}</p>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: '#c4b5fd' }}>Presentaciones</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(52,211,153,0.06)', border: `1px solid ${srColor}30` }}>
              <p className="text-3xl font-bold" style={{ color: srColor }}>
                {stats.successRate != null ? `${stats.successRate}%` : '—'}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'rgba(255,255,255,0.40)' }}>Éxito</p>
            </div>
          </div>

          {/* Status breakdown chart */}
          {byStatus.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.40)' }}>Demos por estado</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={byStatus} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="status" tick={{ fontSize: 11, fill: TICK_COLOR }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: TICK_COLOR }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [v, 'Demos']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, background: 'rgba(10,14,40,0.96)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {byStatus.map((entry, i) => (
                      <Cell key={i} fill={STATUS_CHART_COLORS[entry.status] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Demo list */}
          {stats.demos?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.40)' }}>Demos vinculadas ({stats.demos.length})</h3>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className="w-full">
                  <thead><tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Demo', 'Estado', 'Fecha', 'Pres.'].map(h =>
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>{h}</th>
                    )}
                  </tr></thead>
                  <tbody>
                    {stats.demos.map((d, i) => (
                      <tr key={i} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="px-4 py-3">
                          <Link to={`/demos/${d.ID}`} onClick={onClose} className="text-sm font-medium text-brand hover:underline flex items-center gap-1">
                            {d.TITLE} <ChevronRight size={12} />
                          </Link>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={d.STATUS} /></td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.50)' }}>{d.DEMODATE || '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: 'rgba(255,255,255,0.65)' }}>{d.presentationCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {stats.demoCount === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Este sistema no se ha usado en ninguna demo todavía.</p>
          )}
        </div>
      )}
    </Modal>
  )
}

// ─── Client Stats Modal ───────────────────────────────────────────────────────
const RESULT_COLOR_MAP = {
  VERY_INTERESTED: '#34d399',
  INTERESTED:      '#60a5fa',
  NEUTRAL:         '#fbbf24',
  NOT_INTERESTED:  '#f87171',
}

function ClientStatsModal({ client, open, onClose }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !client) return
    setLoading(true)
    api.get(`/clients/${client.ID}/stats`)
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [open, client])

  const totalPresentations = stats?.byResult?.reduce((s, r) => s + r.count, 0) ?? 0
  const positiveCount = stats?.byResult
    ?.filter(r => ['VERY_INTERESTED', 'INTERESTED'].includes(r.result))
    .reduce((s, r) => s + r.count, 0) ?? 0
  const successRate = totalPresentations > 0 ? Math.round((positiveCount / totalPresentations) * 100) : null
  const srColor = successRate == null ? 'rgba(255,255,255,0.35)' : successRate >= 60 ? '#34d399' : successRate >= 30 ? '#fbbf24' : '#f87171'

  return (
    <Modal open={open} onClose={onClose} title={`Analytics — ${client?.NAME}`}>
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : !stats ? (
        <p className="text-sm text-center py-8" style={{ color: 'rgba(255,255,255,0.35)' }}>No hay datos disponibles.</p>
      ) : (
        <div className="space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(77,166,255,0.08)', border: '1px solid rgba(77,166,255,0.18)' }}>
              <p className="text-3xl font-bold text-white">{stats.demos.length}</p>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1 text-brand">Demos</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)' }}>
              <p className="text-3xl font-bold text-white">{totalPresentations}</p>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: '#c4b5fd' }}>Presentaciones</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(52,211,153,0.06)', border: `1px solid ${srColor}30` }}>
              <p className="text-3xl font-bold" style={{ color: srColor }}>{successRate != null ? `${successRate}%` : '—'}</p>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'rgba(255,255,255,0.40)' }}>Éxito</p>
            </div>
          </div>

          {/* Result distribution chart */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.40)' }}>Distribución por resultado</h3>
            {stats.byResult.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={stats.byResult} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="result" tick={{ fontSize: 10, fill: TICK_COLOR }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: TICK_COLOR }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [v, 'Demos']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, background: 'rgba(10,14,40,0.96)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.byResult.map((r, i) => (
                      <Cell key={i} fill={RESULT_COLOR_MAP[r.result] || RESULT_COLORS[i % RESULT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Sin presentaciones registradas.</p>
            )}
          </div>

          {/* Demo list */}
          {stats.demos.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.40)' }}>Demos vinculadas ({stats.demos.length})</h3>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className="w-full">
                  <thead><tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Demo', 'Estado', 'Fecha Pres.', 'Resultado'].map(h =>
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>{h}</th>
                    )}
                  </tr></thead>
                  <tbody>
                    {stats.demos.map((d, i) => (
                      <tr key={i} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="px-4 py-3">
                          <Link to={`/demos/${d.ID}`} onClick={onClose} className="text-sm font-medium text-brand hover:underline flex items-center gap-1">
                            {d.TITLE} <ChevronRight size={12} />
                          </Link>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={d.STATUS} /></td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.50)' }}>{d.PRESENTATIONDATE || '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: RESULT_COLOR_MAP[d.RESULT] || 'rgba(255,255,255,0.50)' }}>
                          {d.RESULT || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

// ─── Clients Tab ──────────────────────────────────────────────────────────────
function ClientsTab({ onCount }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', industry: '', country: '', contact: '', email: '' })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [statsClient, setStatsClient] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/clients')
      .then(res => {
        const data = res.data || []
        setClients(data)
        onCount?.(data.length)
      })
      .catch(err => setError(err.error || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      if (editId) await api.put(`/clients/${editId}`, form)
      else await api.post('/clients', form)
      setForm({ name: '', industry: '', country: '', contact: '', email: '' })
      setShowAdd(false); setEditId(null); load()
    } catch (err) { setError(err.error || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleEdit = (item) => {
    setForm({ name: item.NAME || '', industry: item.INDUSTRY || '', country: item.COUNTRY || '', contact: item.CONTACT || '', email: item.EMAIL || '' })
    setEditId(item.ID); setShowAdd(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client?')) return
    try {
      await api.delete(`/clients/${id}`); load()
    } catch (err) { setError(err.error || 'Delete failed. The client may be referenced by demos.') }
  }

  return (
    <div>
      {error && (
        <div className="mx-5 mt-4 rounded-xl p-3 text-sm" style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5' }}>{error}</div>
      )}
      {showAdd && (
        <div className="m-5 p-5 rounded-xl" style={{ background: 'rgba(77,166,255,0.08)', border: '1px solid rgba(77,166,255,0.20)' }}>
          <h3 className="text-sm font-semibold text-white mb-4">{editId ? 'Edit client' : 'Add new client'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls} style={labelStyle}>Name *</label><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className={labelCls} style={labelStyle}>Industry</label><input className={inputCls} value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} /></div>
            <div><label className={labelCls} style={labelStyle}>Country</label><input className={inputCls} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div>
            <div><label className={labelCls} style={labelStyle}>Contact</label><input className={inputCls} value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} /></div>
            <div className="col-span-2"><label className={labelCls} style={labelStyle}>Email</label><input type="email" className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-50 transition-colors">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => { setForm({ name: '', industry: '', country: '', contact: '', email: '' }); setShowAdd(false); setEditId(null); setError(null) }}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.70)' }}>Cancel</button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : (
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['Name', 'Industry', 'Country', 'Email', 'Demos', 'Last Presentation'].map(h =>
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>{h}</th>
              )}
              <th className="px-5 py-3 text-right">
                {!showAdd && (
                  <button onClick={() => { setForm({ name: '', industry: '', country: '', contact: '', email: '' }); setShowAdd(true); setEditId(null) }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand text-white hover:bg-brand-dark transition-colors">
                    <Plus size={11} /> Add
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((item, i) => (
              <tr key={item.ID} className="group transition-colors"
                style={{ borderBottom: i < clients.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td className="px-5 py-3.5 text-sm font-medium text-white">{item.NAME}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>{item.INDUSTRY || '—'}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>{item.COUNTRY || '—'}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>{item.EMAIL || '—'}</td>
                <td className="px-5 py-3.5">
                  {item.demoCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.25)' }}>{item.demoCount}</span>
                  ) : <span className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>}
                </td>
                <td className="px-5 py-3.5 text-sm" style={{ color: 'rgba(255,255,255,0.50)' }}>{item.LAST_PRESENTATION || '—'}</td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => setStatsClient(item)} title="Analytics" className="text-xs font-semibold hover:underline mr-3 inline-flex items-center gap-1" style={{ color: '#c4b5fd' }}>
                    <BarChart2 size={12} /> Stats
                  </button>
                  <button onClick={() => handleEdit(item)} className="text-xs font-semibold text-brand hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(item.ID)} className="text-xs font-semibold hover:underline" style={{ color: '#f87171' }}>Delete</button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No clients yet. Click "+ Add" to create one.</td></tr>
            )}
          </tbody>
        </table>
      )}
      <ClientStatsModal client={statsClient} open={!!statsClient} onClose={() => setStatsClient(null)} />
    </div>
  )
}

// ─── Tab Config ───────────────────────────────────────────────────────────────
const TAB_CONFIG = [
  { key: 'systems', label: 'Systems', icon: Server },
  { key: 'clients', label: 'Clients', icon: Users },
]

// ─── Master Data Page ─────────────────────────────────────────────────────────
export default function MasterData() {
  const [activeTab, setActiveTab] = useState('systems')
  const [counts, setCounts] = useState({ systems: null, clients: null })

  const setCount = (key) => (val) => setCounts(c => ({ ...c, [key]: val }))

  return (
    <PageShell
      label="Configuration"
      title="Master Data"
      subtitle="BTP systems and clients"
    >
      <div className="space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4">
          {TAB_CONFIG.map(tab => {
            const Icon = tab.icon
            const count = counts[tab.key]
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="glass rounded-xl p-4 text-left flex items-center gap-3 transition-all"
                style={isActive ? { border: '1px solid rgba(77,166,255,0.35)', boxShadow: '0 0 0 2px rgba(77,166,255,0.12)' } : {}}
              >
                <div className="p-2 rounded-lg" style={{ background: isActive ? 'rgba(77,166,255,0.15)' : 'rgba(255,255,255,0.07)' }}>
                  <Icon size={15} className={isActive ? 'text-brand' : ''} style={!isActive ? { color: 'rgba(255,255,255,0.50)' } : {}} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white leading-none">
                    {count !== null ? count : <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>{tab.label}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex px-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {TAB_CONFIG.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors border-b-2 -mb-px"
                  style={{
                    borderColor: activeTab === tab.key ? '#4da6ff' : 'transparent',
                    color: activeTab === tab.key ? '#4da6ff' : 'rgba(255,255,255,0.45)',
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className={activeTab !== 'systems' ? 'hidden' : ''}>
            <SystemsTab onCount={setCount('systems')} />
          </div>
          <div className={activeTab !== 'clients' ? 'hidden' : ''}>
            <ClientsTab onCount={setCount('clients')} />
          </div>
        </div>
      </div>
    </PageShell>
  )
}
