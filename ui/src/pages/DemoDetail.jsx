import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useDemo } from '../hooks/useDemos'
import api from '../api/client'
import StatusBadge from '../components/shared/StatusBadge'
import Spinner from '../components/shared/Spinner'
import Modal from '../components/shared/Modal'
import CompletenessBar from '../components/shared/CompletenessBar'
import { TagChip } from '../components/shared/TagInput'
import {
  Pencil, Trash2, Download, Upload, X, FileText, File,
  Image, ChevronRight, Paperclip, AlertCircle, Copy,
  ExternalLink, CheckCircle2, XCircle, ArrowRight,
  Share2, Clock, Eye, History, MessageSquare, Send, Trash
} from 'lucide-react'

const TABS = ['General', 'Systems', 'Clients', 'Attachments', 'History', 'Comments']

const TYPE_COLORS = {
  SAC: 'bg-teal-400/15 text-teal-300', DATASPHERE: 'bg-blue-400/15 text-blue-300',
  BDC: 'bg-indigo-400/15 text-indigo-300', S4HANA: 'bg-emerald-400/15 text-emerald-300',
  BW4HANA: 'bg-orange-400/15 text-orange-300', OTHER: 'bg-white/10 text-white/50',
}
const LANDSCAPE_LABELS = { BDC_GA: 'BDC GA', GLA26Q2: 'GLA26Q2', SANDBOX: 'Sandbox', EXTERNAL: 'External' }
const LANDSCAPE_COLORS = {
  BDC_GA: 'bg-blue-400/15 text-blue-300', GLA26Q2: 'bg-violet-400/15 text-violet-300',
  SANDBOX: 'bg-amber-400/15 text-amber-300', EXTERNAL: 'bg-white/10 text-white/50',
}

// ─── File helpers ─────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(ct) {
  if (!ct) return <File size={16} style={{ color: 'rgba(255,255,255,0.30)' }} />
  if (ct === 'application/pdf') return <FileText size={16} className="text-red-400" />
  if (ct.includes('presentation') || ct.includes('powerpoint')) return <FileText size={16} className="text-orange-400" />
  if (ct.includes('spreadsheet') || ct.includes('excel')) return <FileText size={16} className="text-emerald-400" />
  if (ct.includes('word') || ct.includes('document')) return <FileText size={16} className="text-blue-400" />
  if (ct.startsWith('image/')) return <Image size={16} className="text-violet-400" />
  return <File size={16} style={{ color: 'rgba(255,255,255,0.30)' }} />
}

function fileTypeLabel(ct) {
  if (!ct) return 'File'
  if (ct === 'application/pdf') return 'PDF'
  if (ct.includes('presentation') || ct.includes('powerpoint')) return 'PPTX'
  if (ct.includes('spreadsheet') || ct.includes('excel')) return 'XLSX'
  if (ct.includes('word') || ct.includes('document')) return 'DOCX'
  if (ct.startsWith('image/')) return ct.split('/')[1].toUpperCase()
  return 'File'
}

function canPreview(ct) {
  if (!ct) return false
  return ct.startsWith('image/') || ct === 'application/pdf'
}

// ─── Attachments Tab ──────────────────────────────────────────────────────────

function AttachmentsTab({ demoId }) {
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewAtt, setPreviewAtt] = useState(null)
  const fileInputRef = useRef(null)

  const loadAttachments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/demos/${demoId}/attachments`)
      setAttachments(res.data || [])
    } catch { setError('Failed to load attachments') }
    finally { setLoading(false) }
  }, [demoId])

  useEffect(() => { loadAttachments() }, [loadAttachments])

  const handleUpload = async (file) => {
    if (!file) return
    setError(null); setUploading(true); setUploadProgress(0)
    const formData = new FormData()
    formData.append('file', file)
    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed'))
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.open('POST', `/api/demos/${demoId}/attachments`)
        xhr.send(formData)
      })
      await loadAttachments()
    } catch (err) { setError(err.message) }
    finally { setUploading(false); setUploadProgress(0); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const handleDownload = async (att) => {
    try {
      const res = await api.get(`/demos/${demoId}/attachments/${att.ID}/download`)
      window.open(res.data.url, '_blank', 'noopener')
    } catch { setError('Failed to generate download link') }
  }

  const handlePreview = async (att) => {
    try {
      const res = await api.get(`/demos/${demoId}/attachments/${att.ID}/download`)
      setPreviewAtt(att)
      setPreviewUrl(res.data.url)
    } catch { setError('Failed to load preview') }
  }

  const handleDelete = async (att) => {
    if (!window.confirm(`Delete "${att.FILENAME}"?`)) return
    try {
      await api.delete(`/demos/${demoId}/attachments/${att.ID}`)
      setAttachments(prev => prev.filter(a => a.ID !== att.ID))
    } catch { setError('Delete failed') }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5' }}>
          <AlertCircle size={15} /><span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto opacity-70 hover:opacity-100 transition-opacity"><X size={14} /></button>
        </div>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f) }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-10 gap-3 cursor-pointer transition-all"
        style={{
          borderColor: dragOver ? 'rgba(77,166,255,0.50)' : 'rgba(255,255,255,0.12)',
          background: dragOver ? 'rgba(77,166,255,0.08)' : 'rgba(255,255,255,0.02)',
          opacity: uploading ? 0.75 : 1,
          pointerEvents: uploading ? 'none' : 'auto',
        }}
      >
        <input ref={fileInputRef} type="file" className="hidden"
          accept=".pdf,.ppt,.pptx,.xls,.xlsx,.doc,.docx,.png,.jpg,.jpeg"
          onChange={(e) => handleUpload(e.target.files?.[0])} />
        {uploading ? (
          <>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(77,166,255,0.15)' }}>
              <Upload size={18} className="text-brand" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-brand">Uploading… {uploadProgress}%</p>
              <div className="mt-2 w-48 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(77,166,255,0.15)' }}>
                <div className="h-full bg-brand rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <Paperclip size={18} style={{ color: 'rgba(255,255,255,0.35)' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>Drop a file here or <span className="text-brand font-semibold">browse</span></p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.30)' }}>PDF, PPT/PPTX, XLS/XLSX, DOC/DOCX, PNG, JPEG · max 200 MB</p>
            </div>
          </>
        )}
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : attachments.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Paperclip size={22} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.18)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No attachments yet</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
            <Paperclip size={14} style={{ color: 'rgba(255,255,255,0.35)' }} />
            <span className="text-sm font-semibold text-white">Files</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-1" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.50)' }}>{attachments.length}</span>
          </div>
          <ul>
            {attachments.map((att, i) => (
              <li
                key={att.ID}
                className="flex items-center gap-4 px-5 py-4 transition-colors"
                style={{
                  borderBottom: i < attachments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  {fileIcon(att.CONTENTTYPE)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{att.FILENAME}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>{fileTypeLabel(att.CONTENTTYPE)}</span>
                    {' · '}{formatBytes(att.SIZE)}
                    {att.CREATEDBY && <>{' · '}{att.CREATEDBY.split('@')[0]}</>}
                    {att.CREATEDAT && <>{' · '}{new Date(att.CREATEDAT).toLocaleDateString('es-ES')}</>}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canPreview(att.CONTENTTYPE) && (
                    <button onClick={() => handlePreview(att)} title="Preview"
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.12)'; e.currentTarget.style.color = '#c4b5fd' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
                      <Eye size={14} />
                    </button>
                  )}
                  <button onClick={() => handleDownload(att)} title="Download"
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(77,166,255,0.12)'; e.currentTarget.style.color = '#4da6ff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
                    <Download size={14} />
                  </button>
                  <button onClick={() => handleDelete(att)} title="Delete"
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.color = '#f87171' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Modal open={!!previewUrl} onClose={() => { setPreviewUrl(null); setPreviewAtt(null) }} title={previewAtt?.FILENAME || 'Preview'}>
        <div className="flex items-center justify-center min-h-[300px]">
          {previewAtt?.CONTENTTYPE?.startsWith('image/') ? (
            <img src={previewUrl} alt={previewAtt?.FILENAME} className="max-w-full max-h-[60vh] rounded-lg object-contain" />
          ) : (
            <iframe src={previewUrl} title={previewAtt?.FILENAME} className="w-full h-[60vh] rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.10)' }} />
          )}
        </div>
      </Modal>
    </div>
  )
}

// ─── History Tab ──────────────────────────────────────────────────────────────

const FIELD_LABELS = {
  TITLE: 'Título', STATUS: 'Estado', DEMODATE: 'Fecha demo',
  DESCRIPTION: 'Descripción', TAGS: 'Tags', SYSTEMS: 'Sistemas (nº)', CLIENTS: 'Clientes (nº)'
}

function HistoryTab({ demoId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/demos/${demoId}/history`)
      .then(res => setHistory(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [demoId])

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>
  if (history.length === 0) return (
    <div className="text-center py-10">
      <History size={24} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.15)' }} />
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No hay cambios registrados todavía.</p>
    </div>
  )

  return (
    <div className="space-y-1">
      {history.map((h, i) => (
        <div key={h.ID || i} className="flex gap-4 py-3 last:border-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(77,166,255,0.12)' }}>
            <Clock size={14} className="text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-white">{FIELD_LABELS[h.FIELD] || h.FIELD}</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>·</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{h.CHANGEDBY?.split('@')[0]}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded line-through max-w-[180px] truncate" style={{ background: 'rgba(248,113,113,0.12)', color: '#fca5a5' }}>{h.OLDVALUE || '(vacío)'}</span>
              <ArrowRight size={12} style={{ color: 'rgba(255,255,255,0.20)' }} className="flex-shrink-0" />
              <span className="text-xs px-2 py-0.5 rounded max-w-[180px] truncate" style={{ background: 'rgba(52,211,153,0.12)', color: '#6ee7b7' }}>{h.NEWVALUE || '(vacío)'}</span>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{h.CHANGEDAT ? new Date(h.CHANGEDAT).toLocaleDateString('es-ES') : ''}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>{h.CHANGEDAT ? new Date(h.CHANGEDAT).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Comments Tab ─────────────────────────────────────────────────────────────

function CommentsTab({ demoId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/demos/${demoId}/comments`)
      setComments(res.data || [])
    } catch { setError('Failed to load comments') }
    finally { setLoading(false) }
  }, [demoId])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true); setError(null)
    try {
      await api.post(`/demos/${demoId}/comments`, { comment: text.trim() })
      setText('')
      await load()
    } catch (err) { setError(err.error || 'Failed to post comment') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await api.delete(`/demos/${demoId}/comments/${commentId}`)
      setComments(prev => prev.filter(c => c.ID !== commentId))
    } catch (err) { setError(err.error || 'Delete failed') }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5' }}>
          <AlertCircle size={15} /><span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto opacity-70 hover:opacity-100 transition-opacity"><X size={14} /></button>
        </div>
      )}

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="glass rounded-xl p-4">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Añade un comentario interno…"
          rows={3}
          className="glass-input w-full resize-none text-sm"
          style={{ minHeight: 80 }}
        />
        <div className="flex justify-end mt-3">
          <button type="submit" disabled={submitting || !text.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-brand hover:bg-brand-dark text-white disabled:opacity-40 transition-colors">
            <Send size={13} /> {submitting ? 'Enviando…' : 'Comentar'}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <MessageSquare size={22} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.18)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Todavía no hay comentarios.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map(c => (
            <div key={c.ID} className="glass rounded-xl p-4 group"
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(77,166,255,0.18)', color: '#4da6ff' }}>
                    {c.CREATEDBY ? c.CREATEDBY.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white">{c.CREATEDBY?.split('@')[0] || 'Unknown'}</span>
                    <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.30)' }}>
                      {c.CREATEDAT ? new Date(c.CREATEDAT).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleDelete(c.ID)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all flex-shrink-0"
                  style={{ color: 'rgba(248,113,113,0.60)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.10)'; e.currentTarget.style.color = '#f87171' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(248,113,113,0.60)' }}
                  title="Delete comment">
                  <Trash size={13} />
                </button>
              </div>
              <p className="text-sm mt-2.5 whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)' }}>{c.COMMENT}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Status Transition Modal ──────────────────────────────────────────────────

function StatusModal({ open, onClose, demo, onSuccess }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const checks = [
    { label: 'Tiene título',          ok: Boolean(demo?.TITLE) },
    { label: 'Tiene fecha de demo',   ok: Boolean(demo?.DEMODATE) },
    { label: 'Al menos un sistema',   ok: (demo?.systems?.length || 0) > 0 },
    { label: 'Al menos un cliente',   ok: (demo?.clients?.length || 0) > 0 },
  ]

  const handleMarkReady = async () => {
    setSaving(true); setError(null)
    try {
      await api.patch(`/demos/${demo.ID}/status`, { status: 'READY' })
      onClose(); onSuccess()
    } catch (err) { setError(err.error || 'Failed to update status') }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Mark as Ready"
      footer={
        <>
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.70)' }}>
            Cancel
          </button>
          <button onClick={handleMarkReady} disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : <><ArrowRight size={14} /> Mark as Ready</>}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Verifica que la demo está lista para presentar:</p>
        <ul className="space-y-2">
          {checks.map(c => (
            <li key={c.label} className="flex items-center gap-2.5 text-sm">
              {c.ok ? <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" /> : <XCircle size={16} className="text-amber-400 flex-shrink-0" />}
              <span style={{ color: c.ok ? 'rgba(255,255,255,0.75)' : '#fcd34d' }}>{c.label}</span>
            </li>
          ))}
        </ul>
        {error && (
          <p className="text-xs rounded-lg px-3 py-2" style={{ color: '#fca5a5', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)' }}>{error}</p>
        )}
      </div>
    </Modal>
  )
}

// ─── Demo Detail ──────────────────────────────────────────────────────────────

export default function DemoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { demo, loading, error } = useDemo(id)
  const [activeTab, setActiveTab] = useState('General')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this demo? This action cannot be undone.')) return
    try { await api.delete(`/demos/${id}`); navigate('/demos') }
    catch (err) { console.error('Delete failed:', err) }
  }

  const handleClone = () => navigate('/demos/new', { state: { cloneFrom: demo } })

  const handleShare = async () => {
    try {
      const res = await api.post(`/demos/${id}/share`)
      const url = `${window.location.origin}/share/${res.data.token}`
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 3000)
    } catch { setShareCopied(false) }
  }

  if (loading) return <div className="flex items-center justify-center p-12"><Spinner size="lg" /></div>
  if (error || !demo) return (
    <div className="p-6">
      <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5' }}>
        Failed to load demo. <Link to="/demos" className="underline">Back to demos</Link>.
      </div>
    </div>
  )

  const tags = demo.TAGS ? demo.TAGS.split(',').filter(Boolean) : []
  const completeness = demo.completeness ?? (
    (demo.TITLE ? 20 : 0) + (demo.DESCRIPTION ? 20 : 0) + (demo.DEMODATE ? 20 : 0) +
    ((demo.systems?.length || 0) > 0 ? 20 : 0) + ((demo.clients?.length || 0) > 0 ? 20 : 0)
  )

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="glass-header px-6 py-5">
        <Link to="/demos" className="inline-flex items-center gap-1 text-brand text-xs font-semibold uppercase tracking-widest mb-4 hover:opacity-70 transition-opacity">
          ← Demos
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white leading-tight">{demo.TITLE}</h1>
            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
              {demo.STATUS === 'DRAFT' ? (
                <button onClick={() => setShowStatusModal(true)} className="group inline-flex items-center gap-1.5 hover:opacity-80" title="Click to mark as Ready">
                  <StatusBadge status={demo.STATUS} />
                  <ArrowRight size={12} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ) : (
                <StatusBadge status={demo.STATUS} />
              )}
              {demo.DEMODATE && <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>{demo.DEMODATE}</span>}
              {demo.CREATEDBY && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>by {demo.CREATEDBY.split('@')[0]}</span>}
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">{tags.map(t => <TagChip key={t} tag={t} />)}</div>
            )}
            <div className="mt-3 max-w-xs">
              <CompletenessBar score={completeness} />
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
            <button onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              style={shareCopied
                ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.30)', color: '#6ee7b7' }
                : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.70)' }
              }>
              <Share2 size={13} /> {shareCopied ? '¡Copiado!' : 'Share'}
            </button>
            <button onClick={handleClone}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.70)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.11)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}>
              <Copy size={13} /> Clone
            </button>
            <Link to={`/demos/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-brand hover:bg-brand-dark text-white transition-colors">
              <Pencil size={13} /> Edit
            </Link>
            <button onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(248,113,113,0.70)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.10)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)'; e.currentTarget.style.color = '#f87171' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(248,113,113,0.70)' }}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="px-6 py-6">
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex px-2 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex items-center gap-1.5 px-4 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px"
                style={{
                  borderBottomColor: activeTab === tab ? '#4da6ff' : 'transparent',
                  color: activeTab === tab ? '#4da6ff' : 'rgba(255,255,255,0.45)',
                }}
                onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
                onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
              >
                {tab === 'Attachments' && <Paperclip size={13} />}
                {tab === 'History' && <History size={13} />}
                {tab === 'Comments' && <MessageSquare size={13} />}
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'General' && (
              <div className="max-w-2xl">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.38)' }}>Title</dt>
                    <dd className="mt-1 text-sm text-white font-medium">{demo.TITLE}</dd>
                  </div>
                  {demo.DESCRIPTION && (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.38)' }}>Description</dt>
                      <dd className="mt-1 text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)' }}>{demo.DESCRIPTION}</dd>
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.38)' }}>Tags</dt>
                      <dd className="mt-2 flex flex-wrap gap-1.5">{tags.map(t => <TagChip key={t} tag={t} />)}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.38)' }}>Status</dt>
                    <dd className="mt-1"><StatusBadge status={demo.STATUS} /></dd>
                  </div>
                  {demo.DEMODATE && (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.38)' }}>Demo Date</dt>
                      <dd className="mt-1 text-sm text-white">{demo.DEMODATE}</dd>
                    </div>
                  )}
                  {demo.CREATEDAT && (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.38)' }}>Created</dt>
                      <dd className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{new Date(demo.CREATEDAT).toLocaleString('es-ES')}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
            {activeTab === 'Systems' && <SystemsSection systems={demo.systems || []} />}
            {activeTab === 'Clients' && (
              <AssociationTable
                items={demo.clients || []}
                columns={[{ label: 'Client', key: 'NAME' }, { label: 'Industry', key: 'INDUSTRY' }, { label: 'Date', key: 'PRESENTATIONDATE' }, { label: 'Result', key: 'RESULT' }, { label: 'Feedback', key: 'FEEDBACK' }]}
                emptyMsg="No client presentations recorded for this demo."
              />
            )}
            {activeTab === 'Attachments' && <AttachmentsTab demoId={id} />}
            {activeTab === 'History' && <HistoryTab demoId={id} />}
            {activeTab === 'Comments' && <CommentsTab demoId={id} />}
          </div>
        </div>
      </div>

      <StatusModal open={showStatusModal} onClose={() => setShowStatusModal(false)} demo={demo} onSuccess={() => navigate(0)} />
    </div>
  )
}

// ─── Systems Section ──────────────────────────────────────────────────────────

function SystemsSection({ systems }) {
  if (systems.length === 0) return (
    <div className="text-center py-10 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No systems associated with this demo.</div>
  )
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <table className="w-full">
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {['System', 'Type', 'Landscape', 'URL', 'Notes'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {systems.map((sys, i) => (
            <tr
              key={i}
              className="transition-colors"
              style={{ borderBottom: i < systems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <td className="px-4 py-3 text-sm font-medium text-white">{sys.NAME || '—'}</td>
              <td className="px-4 py-3">{sys.TYPE && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[sys.TYPE] || TYPE_COLORS.OTHER}`}>{sys.TYPE}</span>}</td>
              <td className="px-4 py-3">{sys.LANDSCAPE && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LANDSCAPE_COLORS[sys.LANDSCAPE] || LANDSCAPE_COLORS.EXTERNAL}`}>{LANDSCAPE_LABELS[sys.LANDSCAPE] || sys.LANDSCAPE}</span>}</td>
              <td className="px-4 py-3">{sys.URL
                ? <a href={sys.URL} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors"
                    style={{ background: 'rgba(77,166,255,0.12)', border: '1px solid rgba(77,166,255,0.25)', color: '#4da6ff' }}>
                    <ExternalLink size={11} /> Open
                  </a>
                : '—'}
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{sys.NOTES || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AssociationTable({ items, columns, emptyMsg }) {
  return items.length === 0 ? (
    <div className="text-center py-10 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>{emptyMsg}</div>
  ) : (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <table className="w-full">
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr
              key={i}
              className="transition-colors"
              style={{ borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {col.render ? col.render(item[col.key]) : (item[col.key] || '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
