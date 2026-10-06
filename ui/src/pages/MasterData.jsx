import { useState, useEffect } from 'react'
import api from '../api/client'
import PageHeader from '../components/shared/PageHeader'
import Spinner from '../components/shared/Spinner'

// ─── Generic CRUD Tab ─────────────────────────────────────────────────────────
function CrudTab({ resource, columns, emptyForm, renderForm }) {
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
      .then(res => setItems(res.data || []))
      .catch(err => setError(err.error || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [resource])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      if (editId) {
        await api.put(`/${resource}/${editId}`, form)
      } else {
        await api.post(`/${resource}`, form)
      }
      setForm(emptyForm)
      setShowAdd(false)
      setEditId(null)
      load()
    } catch (err) {
      setError(err.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item) => {
    setForm(Object.fromEntries(columns.map(c => [c.field, item[c.editKey ?? c.key] ?? ''])))
    setEditId(item.ID)
    setShowAdd(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return
    try {
      await api.delete(`/${resource}/${id}`)
      load()
    } catch (err) {
      setError(err.error || 'Delete failed. It may be referenced by a demo.')
    }
  }

  const handleCancel = () => {
    setForm(emptyForm)
    setEditId(null)
    setShowAdd(false)
    setError(null)
  }

  return (
    <div>
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAdd && (
        <div className="m-4 p-4 border-2 border-sap-blue rounded-lg bg-sap-blue-light">
          <h3 className="text-sm font-semibold mb-3">{editId ? 'Edit' : 'Add New'}</h3>
          {renderForm(form, setForm)}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-sm rounded bg-sap-blue text-white hover:bg-sap-blue-dark disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right">
                {!showAdd && (
                  <button
                    onClick={() => { setForm(emptyForm); setShowAdd(true); setEditId(null) }}
                    className="px-3 py-1 text-xs rounded bg-sap-blue text-white hover:bg-sap-blue-dark"
                  >
                    + Add
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.ID} className="border-b hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                    {col.render ? col.render(item[col.key]) : (item[col.key] ?? '—')}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(item)} className="text-xs text-sap-blue hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(item.ID)} className="text-xs text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-400">
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

const inputCls = 'w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sap-blue'
const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

// ─── Tenants Tab ──────────────────────────────────────────────────────────────
function TenantsTab() {
  return (
    <CrudTab
      resource="tenants"
      columns={[
        { key: 'NAME', label: 'Name', field: 'name' },
        { key: 'TYPE', label: 'Type', field: 'type' },
        { key: 'URL', label: 'URL', field: 'url' },
        { key: 'ACTIVE', label: 'Active', field: 'active', render: v => v ? '✓' : '✗' },
      ]}
      emptyForm={{ name: '', type: '', url: '', description: '', active: true }}
      renderForm={(form, setForm) => (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Name *</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <input className={inputCls} value={form.type} placeholder="e.g. SAC, Datasphere..." onChange={e => setForm(f => ({ ...f, type: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>URL</label>
            <input className={inputCls} value={form.url} placeholder="https://..." onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input className={inputCls} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="activeCheck" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
            <label htmlFor="activeCheck" className="text-sm text-gray-700">Active</label>
          </div>
        </div>
      )}
    />
  )
}

// ─── Solutions Tab ────────────────────────────────────────────────────────────
function SolutionsTab() {
  return (
    <CrudTab
      resource="solutions"
      columns={[
        { key: 'NAME', label: 'Name', field: 'name' },
        { key: 'AREA', label: 'Area', field: 'area' },
        { key: 'DESCRIPTION', label: 'Description', field: 'description' },
      ]}
      emptyForm={{ name: '', area: '', description: '' }}
      renderForm={(form, setForm) => (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Name *</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Area</label>
            <input className={inputCls} value={form.area} placeholder="e.g. Analytics, Planning..." onChange={e => setForm(f => ({ ...f, area: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Description</label>
            <input className={inputCls} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
      )}
    />
  )
}

// ─── Clients Tab ──────────────────────────────────────────────────────────────
function ClientsTab() {
  return (
    <CrudTab
      resource="clients"
      columns={[
        { key: 'NAME', label: 'Name', field: 'name' },
        { key: 'INDUSTRY', label: 'Industry', field: 'industry' },
        { key: 'COUNTRY', label: 'Country', field: 'country' },
        { key: 'EMAIL', label: 'Contact Email', field: 'email' },
      ]}
      emptyForm={{ name: '', industry: '', country: '', contact: '', email: '' }}
      renderForm={(form, setForm) => (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Name *</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Industry</label>
            <input className={inputCls} value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <input className={inputCls} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Contact</label>
            <input className={inputCls} value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Email</label>
            <input type="email" className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
        </div>
      )}
    />
  )
}

// ─── Objects Tab ──────────────────────────────────────────────────────────────
function ObjectsTab() {
  const [tenants, setTenants] = useState([])
  const [solutions, setSolutions] = useState([])

  useEffect(() => {
    api.get('/tenants').then(r => setTenants(r.data || []))
    api.get('/solutions').then(r => setSolutions(r.data || []))
  }, [])

  return (
    <CrudTab
      resource="objects"
      columns={[
        { key: 'NAME', label: 'Name', field: 'name' },
        { key: 'OBJECTTYPE', label: 'Type', field: 'objectType' },
        { key: 'TENANT_NAME', label: 'Tenant', field: 'tenant_id', editKey: 'TENANT_ID' },
        { key: 'SOLUTION_NAME', label: 'Solution', field: 'solution_id', editKey: 'SOLUTION_ID' },
        { key: 'ACTIVE', label: 'Active', field: 'active', render: v => v ? '✓' : '✗' },
      ]}
      emptyForm={{ name: '', objectType: '', tenant_id: '', solution_id: '', path: '', description: '', active: true }}
      renderForm={(form, setForm) => (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Name *</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <input className={inputCls} value={form.objectType} placeholder="e.g. Story, Model..." onChange={e => setForm(f => ({ ...f, objectType: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Tenant</label>
            <select className={inputCls} value={form.tenant_id} onChange={e => setForm(f => ({ ...f, tenant_id: e.target.value }))}>
              <option value="">— none —</option>
              {tenants.map(t => <option key={t.ID} value={t.ID}>{t.NAME}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Solution</label>
            <select className={inputCls} value={form.solution_id} onChange={e => setForm(f => ({ ...f, solution_id: e.target.value }))}>
              <option value="">— none —</option>
              {solutions.map(s => <option key={s.ID} value={s.ID}>{s.NAME}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Path</label>
            <input className={inputCls} value={form.path} onChange={e => setForm(f => ({ ...f, path: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="objActiveCheck" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
            <label htmlFor="objActiveCheck" className="text-sm text-gray-700">Active</label>
          </div>
        </div>
      )}
    />
  )
}

// ─── Master Data Page ─────────────────────────────────────────────────────────
const TABS = ['tenants', 'solutions', 'clients', 'objects']

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('tenants')

  return (
    <div className="p-6">
      <PageHeader title="Master Data" subtitle="Manage tenants, solutions, clients, and objects" />

      <div className="bg-white rounded-lg border border-sap-gray-border overflow-hidden shadow-sm">
        {/* Tab header */}
        <div className="flex border-b border-sap-gray-border">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-sap-blue text-sap-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'tenants' && <TenantsTab />}
        {activeTab === 'solutions' && <SolutionsTab />}
        {activeTab === 'clients' && <ClientsTab />}
        {activeTab === 'objects' && <ObjectsTab />}
      </div>
    </div>
  )
}
