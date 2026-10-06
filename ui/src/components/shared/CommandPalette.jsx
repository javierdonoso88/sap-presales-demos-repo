import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import StatusBadge from './StatusBadge'

export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const timerRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setResults([])
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const search = useCallback((val) => {
    if (!val.trim()) { setResults([]); return }
    setLoading(true)
    api.get('/demos', { params: { search: val } })
      .then(res => setResults((res.data || []).slice(0, 8)))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setQ(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(val), 250)
  }

  const handleSelect = (id) => {
    navigate(`/demos/${id}`)
    onClose()
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={handleChange}
            placeholder="Search demos…"
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-sap-blue border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X size={15} />
          </button>
        </div>

        {results.length > 0 ? (
          <ul className="py-2 max-h-96 overflow-y-auto">
            {results.map(demo => (
              <li key={demo.ID}>
                <button
                  onClick={() => handleSelect(demo.ID)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{demo.TITLE}</p>
                    {demo.DEMODATE && <p className="text-xs text-gray-400 mt-0.5">{demo.DEMODATE}</p>}
                  </div>
                  <StatusBadge status={demo.STATUS} />
                </button>
              </li>
            ))}
          </ul>
        ) : q.trim() ? (
          <div className="py-10 text-center text-sm text-gray-400">No demos found for "{q}"</div>
        ) : (
          <div className="py-10 text-center text-sm text-gray-400">Type to search demos…</div>
        )}

        <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50 flex items-center gap-4 text-xs text-gray-400">
          <span><kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono">↵</kbd> select</span>
          <span><kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>,
    document.body
  )
}
