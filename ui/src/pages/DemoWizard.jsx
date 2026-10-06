import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import api from '../api/client'
import Spinner from '../components/shared/Spinner'
import { useTenants, useSolutions, useObjects, useClients } from '../hooks/useMasterData'

const STEPS = ['General', 'Clients', 'Systems', 'Review']

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
  const { items: solutions, loading: loadingSol } = useSolutions()
  const { items: tenants, loading: loadingTen } = useTenants()
  const { items: allObjects, loading: loadingObj } = useObjects()

  if (loadingSol || loadingTen || loadingObj) {
    return <div className="flex justify-center p-8"><Spinner /></div>
  }

  const getSystem = (solutionId) => formData.systems.find(s => s.solutionId === solutionId)

  const toggleSolution = (sol) => {
    onChange(fd => {
      const exists = fd.systems.find(s => s.solutionId === sol.ID)
      if (exists) return { ...fd, systems: fd.systems.filter(s => s.solutionId !== sol.ID) }
      return { ...fd, systems: [...fd.systems, { solutionId: sol.ID, solutionNotes: '', tenantId: '', tenantNotes: '', objects: [] }] }
    })
  }

  const updateSystem = (solutionId, key, value) => {
    onChange(fd => ({
      ...fd,
      systems: fd.systems.map(s => s.solutionId === solutionId ? { ...s, [key]: value } : s)
    }))
  }

  const toggleObject = (solutionId, obj) => {
    onChange(fd => ({
      ...fd,
      systems: fd.systems.map(s => {
        if (s.solutionId !== solutionId) return s
        const exists = s.objects.find(o => o.id === obj.ID)
        const objects = exists
          ? s.objects.filter(o => o.id !== obj.ID)
          : [...s.objects, { id: obj.ID, notes: '' }]
        return { ...s, objects }
      })
    }))
  }

  const setObjectNotes = (solutionId, objId, notes) => {
    onChange(fd => ({
      ...fd,
      systems: fd.systems.map(s => {
        if (s.solutionId !== solutionId) return s
        return { ...s, objects: s.objects.map(o => o.id === objId ? { ...o, notes } : o) }
      })
    }))
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold border-b pb-2 mb-2">Systems & Objects</h2>
      <p className="text-sm text-gray-500 mb-4">
        Select which solutions were used in the demo. For each, specify the tenant environment and the objects demonstrated.
      </p>

      {solutions.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No solutions configured. Add them in Master Data.</div>
      ) : (
        <div className="space-y-3">
          {solutions.map(sol => {
            const sys = getSystem(sol.ID)
            const isSelected = Boolean(sys)

            const solutionObjects = allObjects.filter(o => o.SOLUTION_ID === sol.ID)
            const filteredObjects = sys?.tenantId
              ? solutionObjects.filter(o => o.TENANT_ID === sys.tenantId || !o.TENANT_ID)
              : solutionObjects

            return (
              <div
                key={sol.ID}
                className={`border-2 rounded-lg transition-all ${isSelected ? 'border-sap-blue' : 'border-gray-200'}`}
              >
                {/* Solution header */}
                <div
                  className={`p-4 cursor-pointer flex items-center justify-between rounded-t-lg ${
                    isSelected ? 'bg-sap-blue-light' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleSolution(sol)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-sap-blue border-sap-blue' : 'border-gray-400'
                    }`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{sol.NAME}</div>
                      {sol.AREA && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-0.5 inline-block">
                          {sol.AREA}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-xs text-sap-blue font-medium">
                      {sys.tenantId ? tenants.find(t => t.ID === sys.tenantId)?.NAME : 'No tenant'} · {sys.objects.length} object{sys.objects.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Expanded content */}
                {isSelected && (
                  <div className="p-4 border-t border-blue-100 space-y-4" onClick={e => e.stopPropagation()}>
                    {/* Tenant + Notes */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tenant Environment</label>
                        <select
                          value={sys.tenantId}
                          onChange={e => updateSystem(sol.ID, 'tenantId', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                        >
                          <option value="">— select tenant —</option>
                          {tenants.map(t => (
                            <option key={t.ID} value={t.ID}>
                              {t.NAME}{t.TYPE ? ` (${t.TYPE})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                        <input
                          value={sys.solutionNotes}
                          onChange={e => updateSystem(sol.ID, 'solutionNotes', e.target.value)}
                          placeholder="Key scenarios, highlights..."
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>

                    {/* Objects */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Objects used
                        {sys.tenantId && <span className="text-gray-400 font-normal"> — filtered to selected tenant</span>}
                      </label>
                      {filteredObjects.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-2">
                          No objects found for this solution{sys.tenantId ? '/tenant combination' : ''}. Add them in Master Data.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {filteredObjects.map(obj => {
                            const selObj = sys.objects.find(o => o.id === obj.ID)
                            return (
                              <div
                                key={obj.ID}
                                className={`border rounded p-2.5 cursor-pointer transition-all ${
                                  selObj ? 'border-sap-blue bg-sap-blue-light' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                                onClick={() => toggleObject(sol.ID, obj)}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                    selObj ? 'bg-sap-blue border-sap-blue' : 'border-gray-400'
                                  }`}>
                                    {selObj && <Check size={10} className="text-white" />}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-medium truncate">{obj.NAME}</div>
                                    {obj.OBJECTTYPE && (
                                      <span className="text-xs text-gray-500">{obj.OBJECTTYPE}</span>
                                    )}
                                  </div>
                                </div>
                                {selObj && (
                                  <div className="mt-1.5" onClick={e => e.stopPropagation()}>
                                    <input
                                      value={selObj.notes}
                                      onChange={e => setObjectNotes(sol.ID, obj.ID, e.target.value)}
                                      placeholder="Notes..."
                                      className="w-full text-xs border border-blue-200 rounded px-2 py-1 bg-white"
                                    />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Step 4: Review ────────────────────────────────────────────────────────────
function Step4Review({ formData }) {
  const { items: solutions } = useSolutions()
  const { items: tenants } = useTenants()
  const { items: allObjects } = useObjects()
  const { items: clientsList } = useClients()

  const getSolutionName = id => solutions.find(s => s.ID === id)?.NAME || id
  const getTenantName = id => tenants.find(t => t.ID === id)?.NAME || id
  const getObjectName = id => allObjects.find(o => o.ID === id)?.NAME || id
  const getClientName = id => clientsList.find(c => c.ID === id)?.NAME || id

  const validClients = formData.clients.filter(c => c.clientId)

  return (
    <div className="grid grid-cols-5 gap-4">
      {/* Left: General + Systems */}
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
            <div className="space-y-3">
              {formData.systems.map(sys => (
                <div key={sys.solutionId} className="border border-gray-200 rounded-lg p-3">
                  <div className="font-medium text-sm text-gray-900">{getSolutionName(sys.solutionId)}</div>
                  {sys.tenantId && (
                    <div className="text-xs text-gray-600 mt-1">
                      Tenant: <span className="font-medium">{getTenantName(sys.tenantId)}</span>
                    </div>
                  )}
                  {sys.solutionNotes && (
                    <div className="text-xs text-gray-500 mt-1 italic">{sys.solutionNotes}</div>
                  )}
                  {sys.objects.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Objects:</div>
                      <div className="flex flex-wrap gap-1">
                        {sys.objects.map(o => (
                          <span key={o.id} className="text-xs bg-sap-blue-light text-sap-blue px-2 py-0.5 rounded border border-blue-200">
                            {getObjectName(o.id)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Clients */}
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
  const isEdit = Boolean(id)

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    demoDate: '',
    status: 'DRAFT',
    clients: [],
    systems: [],
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    if (!id) return
    api.get(`/demos/${id}`).then(res => {
      const d = res.data

      // Reconstruct grouped systems from flat solutions + objects
      const solutionMap = {}
      for (const sol of (d.solutions || [])) {
        solutionMap[sol.SOLUTION_ID] = {
          solutionId: sol.SOLUTION_ID,
          solutionNotes: sol.NOTES || '',
          tenantId: '',
          tenantNotes: '',
          objects: []
        }
      }
      for (const obj of (d.objects || [])) {
        const solId = obj.OBJECT_SOLUTION_ID
        if (solId && solutionMap[solId]) {
          solutionMap[solId].objects.push({ id: obj.OBJECT_ID, notes: obj.NOTES || '' })
          if (!solutionMap[solId].tenantId && obj.OBJECT_TENANT_ID) {
            solutionMap[solId].tenantId = obj.OBJECT_TENANT_ID
          }
        }
      }
      for (const ten of (d.tenants || [])) {
        for (const sys of Object.values(solutionMap)) {
          if (sys.tenantId === ten.TENANT_ID) {
            sys.tenantNotes = ten.NOTES || ''
          }
        }
      }

      setFormData({
        title: d.TITLE || '',
        description: d.DESCRIPTION || '',
        demoDate: d.DEMODATE || '',
        status: d.STATUS || 'DRAFT',
        clients: (d.clients || []).map(c => ({
          clientId: c.CLIENT_ID,
          presentationDate: c.PRESENTATIONDATE || '',
          result: c.RESULT || 'INTERESTED',
          feedback: c.FEEDBACK || ''
        })),
        systems: Object.values(solutionMap)
      })
    }).catch(err => console.error('Failed to load demo for edit:', err))
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      // Flatten systems back to separate arrays for the backend
      const tenantIds = [...new Set(formData.systems.filter(s => s.tenantId).map(s => s.tenantId))]
      const tenants = tenantIds.map(tid => ({
        id: tid,
        notes: formData.systems.find(s => s.tenantId === tid)?.tenantNotes || ''
      }))
      const solutions = formData.systems.map(s => ({ id: s.solutionId, notes: s.solutionNotes || '' }))
      const objects = formData.systems.flatMap(s => s.objects)

      const payload = {
        title: formData.title,
        description: formData.description,
        demoDate: formData.demoDate || null,
        status: formData.status,
        tenants,
        solutions,
        objects,
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
        {step === 2 && <Step2Clients formData={formData} onChange={setFormData} />}
        {step === 3 && <Step3Systems formData={formData} onChange={setFormData} />}
        {step === 4 && <Step4Review formData={formData} />}
      </div>

      {/* Navigation Bar */}
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
