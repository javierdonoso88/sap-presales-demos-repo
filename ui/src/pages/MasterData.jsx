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

const inputCls = 'w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent'
const labelCls = 'block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide'

const SYSTEM_TYPES = ['SAC', 'DATASPHERE', 'BDC', 'S4HANA', 'BW4HANA', 'OTHER']
const LANDSCAPES = ['BDC_GA', 'GLA26Q2', 'SANDBOX', 'EXTERNAL']

const LANDSCAPE_LABELS = { BDC_GA: 'BDC GA', GLA26Q2: 'GLA26Q2', SANDBOX: 'Sandbox', EXTERNAL: 'External' }
const LANDSCAPE_COLORS = {
  BDC_GA:   'bg-blue-100 text-blue-700',
  GLA26Q2:  'bg-violet-100 text-violet-700',
  SANDBOX:  'bg-amber-100 text-amber-700',
  EXTERNAL: 'bg-zinc-100 text-zinc-600',
}
const TYPE_COLORS = {
  SAC:        'bg-teal-100 text-teal-700',
  DATASPHERE: 'bg-blue-100 text-blue-700',
  BDC:        'bg-indigo-100 text-indigo-700',
  S4HANA:     'bg-emerald-100 text-emerald-700',
  BW4HANA:    'bg-orange-100 text-orange-700',
  OTHER:      'bg-zinc-100 text-zinc-600',
}

const RESULT_COLORS = ['#10b981', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#a1a1aa']

// ─── Generic CRUD Tab ─────────────────────────────────────────────────────────
function CrudTab({ resource, columns, emptyForm, renderForm, onCountChange }) {
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
        <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{error}</div>
      )}
      {showAdd && (
        <div className="m-5 p-5 border-2 border-brand/20 rounded-xl bg-brand-light/30">
          <h3 className="text-sm font-semibold text-zinc-800 mb-4">{editId ? 'Edit record' : 'Add new record'}</h3>
          {renderForm(form, setForm)}
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={handleCancel} className="px-4 py-2 text-sm font-semibold rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors">
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
            <tr className="bg-zinc-50 border-b border-zinc-100">
              {columns.map(col => (
                <th key={col.key} className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{col.label}</th>
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
            {items.map(item => (
              <tr key={item.ID} className="group border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-5 py-3.5 text-sm text-zinc-700">
                    {col.render ? col.render(item[col.key], item) : (item[col.key] ?? '—')}
                  </td>
                ))}
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => handleEdit(item)} className="text-xs font-semibold text-brand hover:underline mr-4">Edit</button>
                  <button onClick={() => handleDelete(item.ID)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-sm text-zinc-400">
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
  return (
    <CrudTab
      resource="systems"
      onCountChange={onCount}
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
            ? <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
            : <span className="text-xs font-semibold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">Inactive</span>
        },
      ]}
      emptyForm={{ name: '', type: 'SAC', landscape: 'BDC_GA', url: '', description: '', active: true }}
      renderForm={(form, setForm) => (
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Name *</label><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className={labelCls}>Type *</label>
            <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {SYSTEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Landscape</label>
            <select className={inputCls} value={form.landscape} onChange={e => setForm(f => ({ ...f, landscape: e.target.value }))}>
              <option value="">— none —</option>
              {LANDSCAPES.map(l => <option key={l} value={l}>{LANDSCAPE_LABELS[l]}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>URL</label><input className={inputCls} value={form.url} placeholder="https://…" onChange={e => setForm(f => ({ ...f, url: e.target.value }))} /></div>
          <div className="col-span-2"><label className={labelCls}>Description</label><input className={inputCls} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="sysActiveCheck" checked={!!form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
            <label htmlFor="sysActiveCheck" className="text-sm font-medium text-zinc-700">Active</label>
          </div>
        </div>
      )}
    />
  )
}

// ─── Client Stats Modal ───────────────────────────────────────────────────────
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

  return (
    <Modal open={open} onClose={onClose} title={`Analytics — ${client?.NAME}`}>
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : !stats ? (
        <p className="text-sm text-zinc-400 text-center py-8">No stats available.</p>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Result Distribution</h3>
            {stats.byResult.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stats.byResult} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis dataKey="result" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [v, 'Demos']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.byResult.map((_, i) => <Cell key={i} fill={RESULT_COLORS[i % RESULT_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-zinc-400 text-center py-4">No presentations recorded.</p>
            )}
          </div>
          {stats.demos.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Linked Demos ({stats.demos.length})</h3>
              <div className="rounded-xl border border-zinc-100 overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-zinc-50 border-b border-zinc-100">
                    {['Demo', 'Status', 'Presentation Date', 'Result'].map(h =>
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                    )}
                  </tr></thead>
                  <tbody>
                    {stats.demos.map((d, i) => (
                      <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link to={`/demos/${d.ID}`} onClick={onClose} className="text-sm font-medium text-brand hover:underline flex items-center gap-1">
                            {d.TITLE} <ChevronRight size={12} />
                          </Link>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={d.STATUS} /></td>
                        <td className="px-4 py-3 text-sm text-zinc-500">{d.PRESENTATIONDATE || '—'}</td>
                        <td className="px-4 py-3 text-sm text-zinc-500">{d.RESULT || '—'}</td>
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
        <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{error}</div>
      )}
      {showAdd && (
        <div className="m-5 p-5 border-2 border-brand/20 rounded-xl bg-brand-light/30">
          <h3 className="text-sm font-semibold text-zinc-800 mb-4">{editId ? 'Edit client' : 'Add new client'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Name *</label><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className={labelCls}>Industry</label><input className={inputCls} value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} /></div>
            <div><label className={labelCls}>Country</label><input className={inputCls} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div>
            <div><label className={labelCls}>Contact</label><input className={inputCls} value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} /></div>
            <div className="col-span-2"><label className={labelCls}>Email</label><input type="email" className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-50 transition-colors">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => { setForm({ name: '', industry: '', country: '', contact: '', email: '' }); setShowAdd(false); setEditId(null); setError(null) }} className="px-4 py-2 text-sm font-semibold rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors">Cancel</button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100">
              {['Name', 'Industry', 'Country', 'Email', 'Demos', 'Last Presentation'].map(h =>
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
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
            {clients.map(item => (
              <tr key={item.ID} className="group border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors">
                <td className="px-5 py-3.5 text-sm font-medium text-zinc-800">{item.NAME}</td>
                <td className="px-5 py-3.5 text-sm text-zinc-600">{item.INDUSTRY || '—'}</td>
                <td className="px-5 py-3.5 text-sm text-zinc-600">{item.COUNTRY || '—'}</td>
                <td className="px-5 py-3.5 text-sm text-zinc-600">{item.EMAIL || '—'}</td>
                <td className="px-5 py-3.5">
                  {item.demoCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full">{item.demoCount}</span>
                  ) : <span className="text-xs text-zinc-300">—</span>}
                </td>
                <td className="px-5 py-3.5 text-sm text-zinc-500">{item.LAST_PRESENTATION || '—'}</td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => setStatsClient(item)} title="Analytics" className="text-xs font-semibold text-violet-600 hover:underline mr-3 inline-flex items-center gap-1">
                    <BarChart2 size={12} /> Stats
                  </button>
                  <button onClick={() => handleEdit(item)} className="text-xs font-semibold text-brand hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(item.ID)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-zinc-400">No clients yet. Click "+ Add" to create one.</td></tr>
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
                className={`bg-white rounded-xl p-4 border text-left flex items-center gap-3 transition-all hover:shadow-sm ${isActive ? 'border-brand/40 ring-2 ring-brand/10 shadow-sm' : 'border-zinc-100 shadow-sm'}`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-brand-light' : 'bg-zinc-100'}`}>
                  <Icon size={15} className={isActive ? 'text-brand' : 'text-zinc-500'} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900 leading-none">
                    {count !== null ? count : <span className="text-zinc-200">—</span>}
                  </p>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-0.5">{tab.label}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-zinc-100 px-2">
            {TAB_CONFIG.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'border-brand text-brand'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
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
