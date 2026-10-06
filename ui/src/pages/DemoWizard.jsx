import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'
import api from '../api/client'
import Spinner from '../components/shared/Spinner'
import TagInput from '../components/shared/TagInput'
import { useSystems, useClients } from '../hooks/useMasterData'

const STEPS = ['General', 'Clients', 'Systems', 'Review']

const LANDSCAPE_LABELS = { BDC_GA: 'BDC GA', GLA26Q2: 'GLA26Q2', SANDBOX: 'Sandbox', EXTERNAL: 'External' }
const LANDSCAPE_ORDER = ['BDC_GA', 'GLA26Q2', 'SANDBOX', 'EXTERNAL']
const LANDSCAPE_COLORS = {
  BDC_GA:   'bg-blue-100 text-blue-700',
  GLA26Q2:  'bg-violet-100 text-violet-700',
  SANDBOX:  'bg-amber-100 text-amber-700',
  EXTERNAL: 'bg-gray-100 text-gray-600',
}
const TYPE_COLORS = {
  SAC:        'bg-teal-100 text-teal-700',
  DATASPHERE: 'bg-blue-100 text-blue-700',
  BDC:        'bg-indigo-100 text-indigo-700',
  S4HANA:     'bg-emerald-100 text-emerald-700',
  BW4HANA:    'bg-orange-100 text-orange-700',
  OTHER:      'bg-gray-100 text-gray-600',
}

// ─── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center gap-0 flex-wrap">
      {steps.map((label, idx) => {
        const stepNum = idx + 1
        const isActive = stepNum === current
        const isCompleted = stepNum < current
        return (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                isCompleted ? 'bg-sap-blue border-sap-blue text-white'
                : isActive ? 'bg-sap-blue border-sap-blue text-white'
                : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {isCompleted ? <Check size={14} /> : stepNum}
              </div>
              <span className={`text-sm font-medium ${
                isActive ? 'text-sap-blue' : isCompleted ? 'text-gray-600' : 'text-gray-400'
              }`}>
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <TagInput value={formData.tags} onChange={v => update('tags', v)} />
        <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add a tag</p>
      </div>
    </div>
  )
}

// ─── Step 2: Clients ───────────────────────────────────────────────────────────
function Step2Clients({ formData, onChange }) {
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
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold border-b pb-2 mb-4">Client Presentations</h2>
      <p className="text-sm text-gray-500 mb-4">Add the clients this demo was presented to.</p>
      <div className="space-y-4">
        {formData.clients.map((c, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2 bg-gray-50">
            <div className="flex gap-2">
              <select
                value={c.clientId}
                onChange={e => updateClient(i, 'clientId', e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
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
                className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
              />
              <button
                onClick={() => removeClient(i)}
                className="text-red-500 hover:text-red-700 px-2 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <select
              value={c.result}
              onChange={e => updateClient(i, 'result', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
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
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
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
  )
}

// ─── Step 3: Systems ───────────────────────────────────────────────────────────
function Step3Systems({ formData, onChange }) {
  const { items: allSystems, loading } = useSystems()

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>

  const isSelected = (id) => formData.systems.some(s => s.id === id)
  const getSelected = (id) => formData.systems.find(s => s.id === id)

  const toggle = (sys) => {
    onChange(fd => {
      if (fd.systems.some(s => s.id === sys.ID)) {
        return { ...fd, systems: fd.systems.filter(s => s.id !== sys.ID) }
      }
      return { ...fd, systems: [...fd.systems, { id: sys.ID, notes: '' }] }
    })
  }

  const updateNotes = (id, notes) => {
    onChange(fd => ({
      ...fd,
      systems: fd.systems.map(s => s.id === id ? { ...s, notes } : s)
    }))
  }

  const grouped = LANDSCAPE_ORDER.reduce((acc, land) => {
    const items = allSystems.filter(s => (s.LANDSCAPE || 'EXTERNAL') === land)
    if (items.length > 0) acc[land] = items
    return acc
  }, {})

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold border-b pb-2 mb-2">Systems Used</h2>
      <p className="text-sm text-gray-500 mb-5">
        Select the BTP systems used in this demo and add notes about what was shown.
      </p>

      {allSystems.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No systems configured. Add them in Master Data.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([landscape, systems]) => (
            <div key={landscape}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${LANDSCAPE_COLORS[landscape] || 'bg-gray-100 text-gray-600'}`}>
                  {LANDSCAPE_LABELS[landscape] || landscape}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="space-y-2">
                {systems.map(sys => {
                  const sel = getSelected(sys.ID)
                  const selected = Boolean(sel)
                  return (
                    <div
                      key={sys.ID}
                      className={`border-2 rounded-lg transition-all ${selected ? 'border-sap-blue' : 'border-gray-200'}`}
                    >
                      <div
                        className={`p-3 cursor-pointer flex items-center gap-3 rounded-t-lg ${selected ? 'bg-sap-blue-light' : 'hover:bg-gray-50'}`}
                        onClick={() => toggle(sys)}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selected ? 'bg-sap-blue border-sap-blue' : 'border-gray-400'
                        }`}>
                          {selected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{sys.NAME}</div>
                          {sys.DESCRIPTION && (
                            <div className="text-xs text-gray-400 truncate">{sys.DESCRIPTION}</div>
                          )}
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[sys.TYPE] || TYPE_COLORS.OTHER}`}>
                          {sys.TYPE}
                        </span>
                      </div>
                      {selected && (
                        <div className="px-3 pb-3 pt-2 border-t border-blue-100" onClick={e => e.stopPropagation()}>
                          <label className="block text-xs font-medium text-gray-500 mb-1">What was shown (notes)</label>
                          <input
                            value={sel.notes}
                            onChange={e => updateNotes(sys.ID, e.target.value)}
                            placeholder="Key scenarios, stories, highlights..."
                            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sap-blue"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Step 4: Review ────────────────────────────────────────────────────────────
function Step4Review({ formData }) {
  const { items: allSystems } = useSystems()
  const { items: clientsList } = useClients()

  const getSystem = id => allSystems.find(s => s.ID === id)
  const getClientName = id => clientsList.find(c => c.ID === id)?.NAME || id

  const validClients = formData.clients.filter(c => c.clientId)

  return (
    <div className="grid grid-cols-5 gap-4">
      <div className="col-span-3 space-y-4">
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h3 className="text-base font-semibold border-b pb-2 mb-3">General</h3>
          <dl className="grid grid-cols-2 gap-2">
            <div>
              <dt className="text-xs text-gray-500">Title</dt>
              <dd className="text-sm font-medium">{formData.title || '(untitled)'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Status</dt>
              <dd className="text-sm">{formData.status}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Date</dt>
              <dd className="text-sm">{formData.demoDate || '—'}</dd>
            </div>
          </dl>
          {formData.description && (
            <div className="mt-3 pt-3 border-t">
              <dt className="text-xs text-gray-500 mb-1">Description</dt>
              <dd className="text-sm text-gray-700">{formData.description}</dd>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h3 className="text-base font-semibold border-b pb-2 mb-3">
            Systems ({formData.systems.length})
          </h3>
          {formData.systems.length === 0 ? (
            <p className="text-sm text-gray-400">No systems selected</p>
          ) : (
            <div className="space-y-2">
              {formData.systems.map(s => {
                const sys = getSystem(s.id)
                return (
                  <div key={s.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{sys?.NAME || s.id}</span>
                      {sys?.TYPE && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[sys.TYPE] || TYPE_COLORS.OTHER}`}>
                          {sys.TYPE}
                        </span>
                      )}
                    </div>
                    {s.notes && <div className="text-xs text-gray-500 mt-1 italic">{s.notes}</div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="col-span-2 bg-white rounded-lg p-5 shadow-sm">
        <h3 className="text-base font-semibold border-b pb-2 mb-3">
          Clients ({validClients.length})
        </h3>
        {validClients.length === 0 ? (
          <p className="text-sm text-gray-400">No client presentations</p>
        ) : (
          <div className="space-y-2">
            {validClients.map((c, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="font-medium text-sm">{getClientName(c.clientId)}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {c.presentationDate || '—'} · {c.result.replace(/_/g, ' ')}
                </div>
                {c.feedback && (
                  <div className="text-xs text-gray-600 mt-1 italic">{c.feedback}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Wizard ────────────────────────────────────────────────────────────────
export default function DemoWizard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isEdit = Boolean(id)

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    demoDate: '',
    status: 'DRAFT',
    tags: [],
    clients: [],
    systems: [],
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Clone mode: pre-populate from passed demo
  useEffect(() => {
    const src = location.state?.cloneFrom
    if (!src || id) return
    setFormData({
      title: `Clone of ${src.TITLE}`,
      description: src.DESCRIPTION || '',
      demoDate: '',
      status: 'DRAFT',
      tags: src.TAGS ? src.TAGS.split(',').filter(Boolean) : [],
      systems: (src.systems || []).map(s => ({ id: s.SYSTEM_ID, notes: s.NOTES || '' })),
      clients: [],
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!id) return
    api.get(`/demos/${id}`).then(res => {
      const d = res.data
      setFormData({
        title: d.TITLE || '',
        description: d.DESCRIPTION || '',
        demoDate: d.DEMODATE || '',
        status: d.STATUS || 'DRAFT',
        tags: d.TAGS ? d.TAGS.split(',').filter(Boolean) : [],
        clients: (d.clients || []).map(c => ({
          clientId: c.CLIENT_ID,
          presentationDate: c.PRESENTATIONDATE || '',
          result: c.RESULT || 'INTERESTED',
          feedback: c.FEEDBACK || ''
        })),
        systems: (d.systems || []).map(s => ({ id: s.SYSTEM_ID, notes: s.NOTES || '' }))
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
        tags: formData.tags,
        systems: formData.systems,
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
      <div className="bg-white shadow-sm border-b">
        <div className="p-4 flex items-center gap-3">
          <Link to="/demos" className="text-sap-blue text-sm hover:underline">← Back</Link>
          <h1 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Demo' : 'New Demo'}
          </h1>
        </div>
      </div>

      <div className="bg-white border-b px-6 py-4">
        <StepIndicator steps={STEPS} current={step} />
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {saveError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            Error saving demo: {saveError}
          </div>
        )}
        {step === 1 && <Step1General formData={formData} onChange={setFormData} />}
        {step === 2 && <Step2Clients formData={formData} onChange={setFormData} />}
        {step === 3 && <Step3Systems formData={formData} onChange={setFormData} />}
        {step === 4 && <Step4Review formData={formData} />}
      </div>

      <div className="fixed bottom-0 left-60 right-0 bg-white border-t p-4 flex justify-between items-center shadow-lg">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <span className="text-xs text-gray-400">Step {step} of {STEPS.length}</span>
        {step < STEPS.length ? (
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
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Demo'}
          </button>
        )}
      </div>
    </div>
  )
}
