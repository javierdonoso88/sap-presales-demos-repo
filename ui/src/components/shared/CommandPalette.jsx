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
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(2,6,23,0.70)' }} onClick={onClose} />
      <div className="relative z-10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 80px rgba(0,0,0,0.60)' }}>
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Search size={16} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={q}
            onChange={handleChange}
            placeholder="Search demos…"
            className="flex-1 text-sm text-white outline-none bg-transparent"
            style={{ caretColor: '#4da6ff' }}
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          <button onClick={onClose} className="p-1 rounded transition-colors flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <X size={15} />
          </button>
        </div>

        {results.length > 0 ? (
          <ul className="py-2 max-h-96 overflow-y-auto scrollbar-thin">
            {results.map(demo => (
              <li key={demo.ID}>
                <button
                  onClick={() => handleSelect(demo.ID)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{demo.TITLE}</p>
                    {demo.DEMODATE && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{demo.DEMODATE}</p>}
                  </div>
                  <StatusBadge status={demo.STATUS} />
                </button>
              </li>
            ))}
          </ul>
        ) : q.trim() ? (
          <div className="py-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No demos found for "{q}"</div>
        ) : (
          <div className="py-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Type to search demos…</div>
        )}

        <div className="px-4 py-2.5 flex items-center gap-4 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.30)' }}>
          <span><kbd className="rounded px-1.5 py-0.5 font-mono" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>↵</kbd> select</span>
          <span><kbd className="rounded px-1.5 py-0.5 font-mono" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>Esc</kbd> close</span>
        </div>
      </div>
    </div>,
    document.body
  )
}
