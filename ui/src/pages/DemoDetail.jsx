import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useDemo } from '../hooks/useDemos'
import api from '../api/client'
import StatusBadge from '../components/shared/StatusBadge'
import Spinner from '../components/shared/Spinner'
import {
  Pencil, Trash2, Download, Upload, X, FileText, File,
  Image, ChevronRight, Paperclip, AlertCircle
} from 'lucide-react'

const TABS = ['General', 'Tenants', 'Solutions', 'Objects', 'Clients', 'Attachments']

// ─── File helpers ─────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(contentType) {
  if (!contentType) return <File size={16} className="text-gray-400" />
  if (contentType === 'application/pdf') return <FileText size={16} className="text-red-500" />
  if (contentType.includes('presentation') || contentType.includes('powerpoint'))
    return <FileText size={16} className="text-orange-500" />
  if (contentType.includes('spreadsheet') || contentType.includes('excel'))
    return <FileText size={16} className="text-emerald-600" />
  if (contentType.includes('word') || contentType.includes('document'))
    return <FileText size={16} className="text-blue-500" />
  if (contentType.startsWith('image/'))
    return <Image size={16} className="text-violet-500" />
  return <File size={16} className="text-gray-400" />
}

function fileTypeLabel(contentType) {
  if (!contentType) return 'File'
  if (contentType === 'application/pdf') return 'PDF'
  if (contentType.includes('presentation') || contentType.includes('powerpoint')) return 'PPTX'
  if (contentType.includes('spreadsheet') || contentType.includes('excel')) return 'XLSX'
  if (contentType.includes('word') || contentType.includes('document')) return 'DOCX'
  if (contentType.startsWith('image/')) return contentType.split('/')[1].toUpperCase()
  return 'File'
}

// ─── Attachments Tab ──────────────────────────────────────────────────────────

function AttachmentsTab({ demoId }) {
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const loadAttachments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/demos/${demoId}/attachments`)
      setAttachments(res.data || [])
    } catch {
      setError('Failed to load attachments')
    } finally {
      setLoading(false)
    }
  }, [demoId])

  useEffect(() => { loadAttachments() }, [loadAttachments])

  const handleUpload = async (file) => {
    if (!file) return
    setError(null)
    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else {
            try { reject(new Error(JSON.parse(xhr.responseText).error || 'Upload failed')) }
            catch { reject(new Error('Upload failed')) }
          }
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.open('POST', `/api/demos/${demoId}/attachments`)
        xhr.send(formData)
      })
      await loadAttachments()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDownload = async (att) => {
    try {
      const res = await api.get(`/demos/${demoId}/attachments/${att.ID}/download`)
      window.open(res.data.url, '_blank', 'noopener')
    } catch {
      setError('Failed to generate download link')
    }
  }

  const handleDelete = async (att) => {
    if (!window.confirm(`Delete "${att.FILENAME}"?`)) return
    try {
      await api.delete(`/demos/${demoId}/attachments/${att.ID}`)
      setAttachments(prev => prev.filter(a => a.ID !== att.ID))
    } catch {
      setError('Delete failed')
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div className="space-y-4">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle size={15} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700"><X size={14} /></button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-10 gap-3 cursor-pointer transition-all ${
          dragOver
            ? 'border-sap-blue bg-blue-50'
            : 'border-gray-200 hover:border-sap-blue hover:bg-blue-50/30'
        } ${uploading ? 'pointer-events-none opacity-75' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.ppt,.pptx,.xls,.xlsx,.doc,.docx,.png,.jpg,.jpeg"
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />
        {uploading ? (
          <>
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Upload size={18} className="text-sap-blue" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-sap-blue">Uploading… {uploadProgress}%</p>
              <div className="mt-2 w-48 h-2 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sap-blue rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Paperclip size={18} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">Drop a file here or <span className="text-sap-blue">browse</span></p>
              <p className="text-xs text-gray-400 mt-1">PDF, PPT/PPTX, XLS/XLSX, DOC/DOCX, PNG, JPEG · max 200 MB</p>
            </div>
          </>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : attachments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-50 p-10 text-center">
          <Paperclip size={22} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No attachments yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-gray-50 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
            <Paperclip size={14} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-700">Files</span>
            <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-1">{attachments.length}</span>
          </div>
          <ul>
            {attachments.map((att, i) => (
              <li
                key={att.ID}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-blue-50/30 transition-colors ${i < attachments.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
                  {fileIcon(att.CONTENTTYPE)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{att.FILENAME}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="font-semibold text-gray-500">{fileTypeLabel(att.CONTENTTYPE)}</span>
                    {' · '}{formatBytes(att.SIZE)}
                    {att.CREATEDBY && <>{' · '}{att.CREATEDBY.split('@')[0]}</>}
                    {att.CREATEDAT && <>{' · '}{new Date(att.CREATEDAT).toLocaleDateString('es-ES')}</>}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(att)}
                    title="Download"
                    className="p-2 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-sap-blue transition-colors"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(att)}
                    title="Delete"
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Demo Detail ──────────────────────────────────────────────────────────────

export default function DemoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { demo, loading, error } = useDemo(id)
  const [activeTab, setActiveTab] = useState('General')

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this demo? This action cannot be undone.')) return
    try {
      await api.delete(`/demos/${id}`)
      navigate('/demos')
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !demo) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load demo. <Link to="/demos" className="underline">Back to demos</Link>.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 px-6 pt-8 pb-16">
        <Link to="/demos" className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-widest mb-4 transition-colors">
          ← Demos
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-black tracking-tight leading-tight">{demo.TITLE}</h1>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <StatusBadge status={demo.STATUS} />
              {demo.DEMODATE && (
                <span className="text-slate-400 text-xs font-semibold">📅 {demo.DEMODATE}</span>
              )}
              {demo.CREATEDBY && (
                <span className="text-slate-400 text-xs font-semibold">by {demo.CREATEDBY.split('@')[0]}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link
              to={`/demos/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
            >
              <Pencil size={13} /> Edit
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/20 transition-colors"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="px-6 -mt-4">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-gray-50 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100 px-2 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-sap-blue text-sap-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab === 'Attachments' && <Paperclip size={13} />}
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'General' && (
              <div className="max-w-2xl">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest">Title</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{demo.TITLE}</dd>
                  </div>
                  {demo.DESCRIPTION && (
                    <div>
                      <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</dt>
                      <dd className="mt-1 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{demo.DESCRIPTION}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</dt>
                    <dd className="mt-1"><StatusBadge status={demo.STATUS} /></dd>
                  </div>
                  {demo.DEMODATE && (
                    <div>
                      <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest">Demo Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">{demo.DEMODATE}</dd>
                    </div>
                  )}
                  {demo.CREATEDAT && (
                    <div>
                      <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest">Created</dt>
                      <dd className="mt-1 text-sm text-gray-500">{new Date(demo.CREATEDAT).toLocaleString('es-ES')}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {activeTab === 'Tenants' && (
              <AssociationTable
                items={demo.tenants || []}
                columns={[
                  { label: 'Name', key: 'NAME' },
                  { label: 'Type', key: 'TYPE' },
                  { label: 'URL', key: 'URL', render: v => v ? <a href={v} target="_blank" rel="noreferrer" className="text-sap-blue hover:underline text-xs font-mono">{v}</a> : '—' },
                  { label: 'Notes', key: 'NOTES' },
                ]}
                emptyMsg="No tenants associated with this demo."
              />
            )}

            {activeTab === 'Solutions' && (
              <AssociationTable
                items={demo.solutions || []}
                columns={[
                  { label: 'Name', key: 'NAME' },
                  { label: 'Area', key: 'AREA' },
                  { label: 'Notes', key: 'NOTES' },
                ]}
                emptyMsg="No solutions associated with this demo."
              />
            )}

            {activeTab === 'Objects' && (
              <AssociationTable
                items={demo.objects || []}
                columns={[
                  { label: 'Name', key: 'NAME' },
                  { label: 'Type', key: 'OBJECTTYPE' },
                  { label: 'Tenant', key: 'TENANT_NAME' },
                  { label: 'Solution', key: 'SOLUTION_NAME' },
                  { label: 'Notes', key: 'NOTES' },
                ]}
                emptyMsg="No objects associated with this demo."
              />
            )}

            {activeTab === 'Clients' && (
              <AssociationTable
                items={demo.clients || []}
                columns={[
                  { label: 'Client', key: 'NAME' },
                  { label: 'Industry', key: 'INDUSTRY' },
                  { label: 'Date', key: 'PRESENTATIONDATE' },
                  { label: 'Result', key: 'RESULT' },
                  { label: 'Feedback', key: 'FEEDBACK' },
                ]}
                emptyMsg="No client presentations recorded for this demo."
              />
            )}

            {activeTab === 'Attachments' && <AttachmentsTab demoId={id} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function AssociationTable({ items, columns, emptyMsg }) {
  return items.length === 0 ? (
    <div className="text-center py-10 text-sm text-gray-400">{emptyMsg}</div>
  ) : (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-blue-50/30 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
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
