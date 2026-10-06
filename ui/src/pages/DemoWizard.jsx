import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import api from '../api/client'
import Spinner from '../components/shared/Spinner'
import { useTenants, useSolutions, useObjects, useClients } from '../hooks/useMasterData'

const STEPS = ['General', 'Tenants', 'Solutions', 'Objects', 'Clients & Review']

// ─── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, idx) => {
        const stepNum = idx + 1
        const isActive = stepNum === current
        const isCompleted = stepNum < current
        return (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                  isCompleted
                    ? 'bg-sap-blue border-sap-blue text-white'
                    : isActive
                    ? 'bg-sap-blue border-sap-blue text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? <Check size={14} /> : stepNum}
              </div>
              <span
                className={`text-sm font-medium ${
                  isActive ? 'text-sap-blue' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${stepNum < current ? 'bg-sap-blue' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: General ───────────────────────────────────────────────────────────
function Step1General({ formData, onChange }) {
  const update = (k, v) => onChange(fd => ({ ...fd, [k]: v }))
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
      <h2 className="text-lg font-semibold border-b pb-2">General Information</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          value={formData.title}
          onChange={e => update('title', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sap-blue"
          placeholder="e.g. SAC Planning Demo – Telefónica"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Demo Date</label>
          <input
            type="date"
            value={formData.demoDate}
            onChange={e => update('demoDate', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sap-blue"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={e => update('status', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sap-blue"
          >
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          rows={5}
          value={formData.description}
          onChange={e => update('description', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sap-blue"
          placeholder="Describe the demo context, goals, and key scenarios..."
        />
      </div>
    </div>
  )
}

// ─── Step 2: Tenants ───────────────────────────────────────────────────────────
function Step2Tenants({ formData, onChange }) {
  const { items: tenants, loading } = useTenants()
  const selected = formData.tenants

  const toggle = (tenant) => {
    onChange(fd => {
      const exists = fd.tenants.find(t => t.id === tenant.ID)
      if (exists) return { ...fd, tenants: fd.tenants.filter(t => t.id !== tenant.ID) }
      return { ...fd, tenants: [...fd.tenants, { id: tenant.ID, notes: '' }] }
    })
  }

  const setNotes = (id, notes) => {
    onChange(fd => ({ ...fd, tenants: fd.tenants.map(t => t.id === id ? { ...t, notes } : t) }))
  }

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold border-b pb-2 mb-4">Select Tenants</h2>
      <p className="text-sm text-gray-500 mb-4">Select the SAP tenant environments used in this demo.</p>
      <div className="grid grid-cols-3 gap-3">
        {tenants.map(t => {
          const sel = selected.find(s => s.id === t.ID)
          return (
            <div
              key={t.ID}
              onClick={() => toggle(t)}
              className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                sel ? 'border-sap-blue bg-sap-blue-light' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-sm">{t.NAME}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t.TYPE}</div>
              {t.URL && <div className="text-xs text-blue-600 truncate mt-1">{t.URL}</div>}
              {sel && (
                <div onClick={e => e.stopPropagation()} className="mt-2">
                  <input
                    value={sel.notes}
                    onChange={e => setNotes(t.ID, e.target.value)}
                    placeholder="Notes..."
                    onClick={e => e.stopPropagation()}
                    className="w-full text-xs border border-blue-200 rounded px-2 py-1 bg-white"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {tenants.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No tenants configured. Add them in Master Data.
        </div>
      )}
    </div>
  )
}

// ─── Step 3: Solutions ─────────────────────────────────────────────────────────
function Step3Solutions({ formData, onChange }) {
  const { items: solutions, loading } = useSolutions()
  const selected = formData.solutions

  const toggle = (solution) => {
    onChange(fd => {
      const exists = fd.solutions.find(s => s.id === solution.ID)
      if (exists) return { ...fd, solutions: fd.solutions.filter(s => s.id !== solution.ID) }
      return { ...fd, solutions: [...fd.solutions, { id: solution.ID, notes: '' }] }
    })
  }

  const setNotes = (id, notes) => {
    onChange(fd => ({ ...fd, solutions: fd.solutions.map(s => s.id === id ? { ...s, notes } : s) }))
  }

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold border-b pb-2 mb-4">Select Solutions</h2>
      <p className="text-sm text-gray-500 mb-4">Select the SAP solutions showcased in this demo.</p>
      <div className="grid grid-cols-3 gap-3">
        {solutions.map(s => {
          const sel = selected.find(x => x.id === s.ID)
          return (
            <div
              key={s.ID}
              onClick={() => toggle(s)}
              className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                sel ? 'border-sap-blue bg-sap-blue-light' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-sm">{s.NAME}</div>
              {s.AREA && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                  {s.AREA}
                </span>
              )}
              {sel && (
                <div onClick={e => e.stopPropagation()} className="mt-2">
                  <input
                    value={sel.notes}
                    onChange={e => setNotes(s.ID, e.target.value)}
                    placeholder="Notes..."
                    onClick={e => e.stopPropagation()}
                    className="w-full text-xs border border-blue-200 rounded px-2 py-1 bg-white"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {solutions.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No solutions configured. Add them in Master Data.
        </div>
      )}
    </div>
  )
}

// ─── Step 4: Objects ───────────────────────────────────────────────────────────
function Step4Objects({ formData, onChange }) {
  const { items: objects, loading } = useObjects()
  const selected = formData.objects

  const toggle = (obj) => {
    onChange(fd => {
      const exists = fd.objects.find(o => o.id === obj.ID)
      if (exists) return { ...fd, objects: fd.objects.filter(o => o.id !== obj.ID) }
      return { ...fd, objects: [...fd.objects, { id: obj.ID, notes: '' }] }
    })
  }

  const setNotes = (id, notes) => {
    onChange(fd => ({ ...fd, objects: fd.objects.map(o => o.id === id ? { ...o, notes } : o) }))
  }

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold border-b pb-2 mb-4">Select Objects</h2>
      <p className="text-sm text-gray-500 mb-4">Select the demo objects and assets used in this demo.</p>
      <div className="grid grid-cols-3 gap-3">
        {objects.map(obj => {
          const sel = selected.find(o => o.id === obj.ID)
          return (
            <div
              key={obj.ID}
              onClick={() => toggle(obj)}
              className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                sel ? 'border-sap-blue bg-sap-blue-light' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-sm">{obj.NAME}</div>
              {obj.OBJECTTYPE && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                  {obj.OBJECTTYPE}
                </span>
              )}
              {sel && (
                <div onClick={e => e.stopPropagation()} className="mt-2">
                  <input
                    value={sel.notes}
                    onChange={e => setNotes(obj.ID, e.target.value)}
                    placeholder="Notes..."
                    onClick={e => e.stopPropagation()}
                    className="w-full text-xs border border-blue-200 rounded px-2 py-1 bg-white"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {objects.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No objects configured. Add them in Master Data.
        </div>
      )}
    </div>
  )
}

// ─── Review Section ────────────────────────────────────────────────────────────
function ReviewSection({ title, items }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title} ({items.length})</h3>
      {items.length === 0
        ? <p className="text-xs text-gray-400">None selected</p>
        : (
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li key={i} className="text-xs text-gray-600">
                • <span className="font-medium">{item.label}</span>: {item.value}
              </li>
            ))}
          </ul>
        )
      }
    </div>
  )
}

// ─── Step 5: Clients + Review ──────────────────────────────────────────────────
function Step5ClientsReview({ formData, onChange }) {
  const { items: clientsList } = useClients()

  const addClient = () => {
    onChange(fd => ({
      ...fd,
      clients: [...fd.clients, { clientId: '', presentationDate: '', result: 'INTERESTED', feedback: '' }]
    }))
  }

  const updateClient = (idx, key, val) => {
    onChange(fd => ({
      ...fd,
      clients: fd.clients.map((c, i) => i === idx ? { ...c, [key]: val } : c)
    }))
  }

  const removeClient = (idx) => {
    onChange(fd => ({ ...fd, clients: fd.clients.filter((_, i) => i !== idx) }))
  }

  return (
    <div className="grid grid-cols-5 gap-4">
      {/* Clients */}
      <div className="col-span-3 bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold border-b pb-2 mb-4">Client Presentations</h2>
        <div className="space-y-4">
          {formData.clients.map((c, i) => (
            <div key={i} className="border rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <select
                  value={c.clientId}
                  onChange={e => updateClient(i, 'clientId', e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                >
                  <option value="">Select client...</option>
                  {clientsList.map(cl => (
                    <option key={cl.ID} value={cl.ID}>{cl.NAME}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={c.presentationDate}
                  onChange={e => updateClient(i, 'presentationDate', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
                <button
                  onClick={() => removeClient(i)}
                  className="text-red-500 hover:text-red-700 px-1 text-lg leading-none"
                >
                  ✕
                </button>
              </div>
              <select
                value={c.result}
                onChange={e => updateClient(i, 'result', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              >
                <option value="VERY_INTERESTED">Very Interested</option>
                <option value="INTERESTED">Interested</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="NOT_INTERESTED">Not Interested</option>
              </select>
              <textarea
                value={c.feedback}
                onChange={e => updateClient(i, 'feedback', e.target.value)}
                placeholder="Feedback notes..."
                rows={2}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              />
            </div>
          ))}
          <button
            onClick={addClient}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-sap-blue hover:text-sap-blue transition-colors"
          >
            + Add Client Presentation
          </button>
        </div>
      </div>

      {/* Review Summary */}
      <div className="col-span-2 bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold border-b pb-2 mb-4">Summary</h2>
        <ReviewSection
          title="General"
          items={[
            { label: 'Title', value: formData.title || '(untitled)' },
            { label: 'Date', value: formData.demoDate || '—' },
            { label: 'Status', value: formData.status },
          ]}
        />
        <ReviewSection
          title="Tenants"
          items={formData.tenants.map(t => ({ label: t.id, value: t.notes || 'No notes' }))}
        />
        <ReviewSection
          title="Solutions"
          items={formData.solutions.map(s => ({ label: s.id, value: s.notes || 'No notes' }))}
        />
        <ReviewSection
          title="Objects"
          items={formData.objects.map(o => ({ label: o.id, value: o.notes || 'No notes' }))}
        />
      </div>
    </div>
  )
}

// ─── Main Wizard ────────────────────────────────────────────────────────────────
export default function DemoWizard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    demoDate: '',
    status: 'DRAFT',
    tenants: [],
    solutions: [],
    objects: [],
    clients: [],
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Load existing demo for edit
  useEffect(() => {
    if (!id) return
    api.get(`/demos/${id}`).then(res => {
      const d = res.data
      setFormData({
        title: d.TITLE || '',
        description: d.DESCRIPTION || '',
        demoDate: d.DEMODATE || '',
        status: d.STATUS || 'DRAFT',
        tenants: (d.tenants || []).map(t => ({ id: t.TENANT_ID, notes: t.NOTES || '' })),
        solutions: (d.solutions || []).map(s => ({ id: s.SOLUTION_ID, notes: s.NOTES || '' })),
        objects: (d.objects || []).map(o => ({ id: o.OBJECT_ID, notes: o.NOTES || '' })),
        clients: (d.clients || []).map(c => ({
          clientId: c.CLIENT_ID,
          presentationDate: c.PRESENTATIONDATE || '',
          result: c.RESULT || 'INTERESTED',
          feedback: c.FEEDBACK || ''
        }))
      })
    }).catch(err => console.error('Failed to load demo for edit:', err))
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        demoDate: formData.demoDate || null,
        status: formData.status,
        tenants: formData.tenants,
        solutions: formData.solutions,
        objects: formData.objects,
        clients: formData.clients.filter(c => c.clientId)
      }
      if (isEdit) {
        await api.put(`/demos/${id}`, payload)
        navigate(`/demos/${id}`)
      } else {
        const res = await api.post('/demos', payload)
        navigate(`/demos/${res.data.ID}`)
      }
    } catch (err) {
      console.error('Save failed:', err)
      setSaveError(err.error || err.message || 'Unknown error')
      setSaving(false)
    }
  }

  const canGoNext = step !== 1 || formData.title.trim().length > 0

  return (
    <div className="min-h-screen bg-sap-gray-light pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="p-4 flex items-center gap-3">
          <Link to="/demos" className="text-sap-blue text-sm hover:underline">← Back</Link>
          <h1 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Demo' : 'New Demo'}
          </h1>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-white border-b px-6 py-4">
        <StepIndicator steps={STEPS} current={step} />
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto p-6">
        {saveError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            Error saving demo: {saveError}
          </div>
        )}
        {step === 1 && <Step1General formData={formData} onChange={setFormData} />}
        {step === 2 && <Step2Tenants formData={formData} onChange={setFormData} />}
        {step === 3 && <Step3Solutions formData={formData} onChange={setFormData} />}
        {step === 4 && <Step4Objects formData={formData} onChange={setFormData} />}
        {step === 5 && <Step5ClientsReview formData={formData} onChange={setFormData} />}
      </div>

      {/* Navigation Bar */}
      <div className="fixed bottom-0 left-60 right-0 bg-white border-t p-4 flex justify-between items-center">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <span className="text-xs text-gray-400">Step {step} of {STEPS.length}</span>
        {step < 5 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canGoNext}
            className="px-4 py-2 text-sm rounded-md bg-sap-blue hover:bg-sap-blue-dark text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-md bg-sap-blue hover:bg-sap-blue-dark text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Demo'}
          </button>
        )}
      </div>
    </div>
  )
}
