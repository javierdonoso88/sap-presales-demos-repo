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
  BDC_GA:   'bg-blue-400/15 text-blue-300',
  GLA26Q2:  'bg-violet-400/15 text-violet-300',
  SANDBOX:  'bg-amber-400/15 text-amber-300',
  EXTERNAL: 'bg-white/10 text-white/50',
}
const TYPE_COLORS = {
  SAC:        'bg-teal-400/15 text-teal-300',
  DATASPHERE: 'bg-blue-400/15 text-blue-300',
  BDC:        'bg-indigo-400/15 text-indigo-300',
  S4HANA:     'bg-emerald-400/15 text-emerald-300',
  BW4HANA:    'bg-orange-400/15 text-orange-300',
  OTHER:      'bg-white/10 text-white/50',
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
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                  isCompleted ? 'bg-brand border-brand text-white'
                  : isActive ? 'bg-brand border-brand text-white'
                  : 'border-white/20 text-white/30'
                }`}
                style={!isActive && !isCompleted ? { background: 'rgba(255,255,255,0.06)' } : {}}
              >
                {isCompleted ? <Check size={14} /> : stepNum}
              </div>
              <span className={`text-sm font-medium ${
                isActive ? 'text-brand' : isCompleted ? 'text-white/60' : 'text-white/30'
              }`}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-2 ${stepNum < current ? 'bg-brand' : ''}`}
                style={stepNum >= current ? { background: 'rgba(255,255,255,0.10)' } : {}}
              />
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
    <div className="glass rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-white border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>General Information</h2>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Title <span className="text-red-400">*</span>
        </label>
        <input
          value={formData.title}
          onChange={e => update('title', e.target.value)}
          className="glass-input w-full rounded-md px-3 py-2 text-sm"
          placeholder="e.g. SAC Planning Demo – Telefónica"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Demo Date</label>
          <input
            type="date"
            value={formData.demoDate}
            onChange={e => update('demoDate', e.target.value)}
            className="glass-input w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Status</label>
          <select
            value={formData.status}
            onChange={e => update('status', e.target.value)}
            className="glass-input w-full rounded-md px-3 py-2 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Description</label>
        <textarea
          rows={5}
          value={formData.description}
          onChange={e => update('description', e.target.value)}
          className="glass-input w-full rounded-md px-3 py-2 text-sm"
          placeholder="Describe the demo context, goals, and key scenarios..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Tags</label>
        <TagInput value={formData.tags} onChange={v => update('tags', v)} />
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.30)' }}>Press Enter or comma to add a tag</p>
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
    <div className="glass rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white border-b pb-2 mb-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>Client Presentations</h2>
      <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>Add the clients this demo was presented to.</p>
      <div className="space-y-4">
        {formData.clients.map((c, i) => (
          <div key={i} className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex gap-2">
              <select
                value={c.clientId}
                onChange={e => updateClient(i, 'clientId', e.target.value)}
                className="glass-input flex-1 rounded-md px-2 py-1.5 text-sm"
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
                className="glass-input rounded-md px-2 py-1.5 text-sm"
              />
              <button
                onClick={() => removeClient(i)}
                className="px-2 text-lg leading-none transition-colors"
                style={{ color: 'rgba(248,113,113,0.70)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(248,113,113,0.70)' }}
              >
                ✕
              </button>
            </div>
            <select
              value={c.result}
              onChange={e => updateClient(i, 'result', e.target.value)}
              className="glass-input w-full rounded-md px-2 py-1.5 text-sm"
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
              className="glass-input w-full rounded-md px-2 py-1.5 text-sm"
            />
          </div>
        ))}
        <button
          onClick={addClient}
          className="w-full rounded-xl py-3 text-sm font-medium transition-all border-2 border-dashed"
          style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.45)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(77,166,255,0.40)'; e.currentTarget.style.color = '#4da6ff' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
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
    <div className="glass rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white border-b pb-2 mb-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>Systems Used</h2>
      <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Select the BTP systems used in this demo and add notes about what was shown.
      </p>

      {allSystems.length === 0 ? (
        <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>No systems configured. Add them in Master Data.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([landscape, systems]) => (
            <div key={landscape}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${LANDSCAPE_COLORS[landscape] || 'bg-white/10 text-white/50'}`}>
                  {LANDSCAPE_LABELS[landscape] || landscape}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <div className="space-y-2">
                {systems.map(sys => {
                  const sel = getSelected(sys.ID)
                  const selected = Boolean(sel)
                  return (
                    <div
                      key={sys.ID}
                      className="rounded-xl transition-all"
                      style={{
                        border: selected ? '2px solid rgba(77,166,255,0.55)' : '2px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <div
                        className="p-3 cursor-pointer flex items-center gap-3 rounded-xl"
                        style={selected ? { background: 'rgba(77,166,255,0.10)' } : {}}
                        onClick={() => toggle(sys)}
                        onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                        onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
                      >
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            border: selected ? '2px solid #4da6ff' : '2px solid rgba(255,255,255,0.25)',
                            background: selected ? '#4da6ff' : 'transparent',
                          }}
                        >
                          {selected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white">{sys.NAME}</div>
                          {sys.DESCRIPTION && (
                            <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>{sys.DESCRIPTION}</div>
                          )}
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[sys.TYPE] || TYPE_COLORS.OTHER}`}>
                          {sys.TYPE}
                        </span>
                      </div>
                      {selected && (
                        <div
                          className="px-3 pb-3 pt-2"
                          style={{ borderTop: '1px solid rgba(77,166,255,0.15)' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>What was shown (notes)</label>
                          <input
                            value={sel.notes}
                            onChange={e => updateNotes(sys.ID, e.target.value)}
                            placeholder="Key scenarios, stories, highlights..."
                            className="glass-input w-full rounded-md px-2.5 py-1.5 text-sm"
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
        <div className="glass rounded-xl p-5">
          <h3 className="text-base font-semibold text-white border-b pb-2 mb-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>General</h3>
          <dl className="grid grid-cols-2 gap-2">
            <div>
              <dt className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Title</dt>
              <dd className="text-sm font-medium text-white">{formData.title || '(untitled)'}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Status</dt>
              <dd className="text-sm text-white">{formData.status}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Date</dt>
              <dd className="text-sm text-white">{formData.demoDate || '—'}</dd>
            </div>
          </dl>
          {formData.description && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <dt className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Description</dt>
              <dd className="text-sm" style={{ color: 'rgba(255,255,255,0.70)' }}>{formData.description}</dd>
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="text-base font-semibold text-white border-b pb-2 mb-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            Systems ({formData.systems.length})
          </h3>
          {formData.systems.length === 0 ? (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No systems selected</p>
          ) : (
            <div className="space-y-2">
              {formData.systems.map(s => {
                const sys = getSystem(s.id)
                return (
                  <div key={s.id} className="rounded-xl p-3" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{sys?.NAME || s.id}</span>
                      {sys?.TYPE && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[sys.TYPE] || TYPE_COLORS.OTHER}`}>
                          {sys.TYPE}
                        </span>
                      )}
                    </div>
                    {s.notes && <div className="text-xs italic mt-1" style={{ color: 'rgba(255,255,255,0.40)' }}>{s.notes}</div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="col-span-2 glass rounded-xl p-5">
        <h3 className="text-base font-semibold text-white border-b pb-2 mb-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          Clients ({validClients.length})
        </h3>
        {validClients.length === 0 ? (
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No client presentations</p>
        ) : (
          <div className="space-y-2">
            {validClients.map((c, i) => (
              <div key={i} className="rounded-xl p-3" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                <div className="font-medium text-sm text-white">{getClientName(c.clientId)}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {c.presentationDate || '—'} · {c.result.replace(/_/g, ' ')}
                </div>
                {c.feedback && (
                  <div className="text-xs italic mt-1" style={{ color: 'rgba(255,255,255,0.50)' }}>{c.feedback}</div>
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
    <div className="min-h-screen pb-24">
      <div className="glass-header px-6 py-4 flex items-center gap-3">
        <Link to="/demos" className="text-brand text-sm hover:opacity-70 transition-opacity">← Back</Link>
        <h1 className="text-lg font-semibold text-white">
          {isEdit ? 'Edit Demo' : 'New Demo'}
        </h1>
      </div>

      <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <StepIndicator steps={STEPS} current={step} />
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {saveError && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5' }}>
            Error saving demo: {saveError}
          </div>
        )}
        {step === 1 && <Step1General formData={formData} onChange={setFormData} />}
        {step === 2 && <Step2Clients formData={formData} onChange={setFormData} />}
        {step === 3 && <Step3Systems formData={formData} onChange={setFormData} />}
        {step === 4 && <Step4Review formData={formData} />}
      </div>

      <div
        className="fixed bottom-0 left-56 right-0 px-6 py-4 flex justify-between items-center"
        style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="px-4 py-2 text-sm rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.70)' }}
        >
          ← Back
        </button>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Step {step} of {STEPS.length}</span>
        {step < STEPS.length ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canGoNext}
            className="px-4 py-2 text-sm rounded-lg bg-brand hover:bg-brand-dark text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-brand hover:bg-brand-dark text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Demo'}
          </button>
        )}
      </div>
    </div>
  )
}
