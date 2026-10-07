import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layers, ChevronRight, Users, Tag, Plus, ArrowRight } from 'lucide-react'
import { useDemos } from '../hooks/useDemos'
import api from '../api/client'
import StatusBadge from '../components/shared/StatusBadge'
import Spinner from '../components/shared/Spinner'
import CompletenessBar from '../components/shared/CompletenessBar'
import PageShell from '../components/layout/PageShell'
import { TagChip } from '../components/shared/TagInput'

const STATUS_COLS = [
  { key: 'DRAFT',    label: 'Draft',    topColor: '#fbbf24', glowColor: 'rgba(251,191,36,0.15)' },
  { key: 'READY',    label: 'Ready',    topColor: '#34d399', glowColor: 'rgba(52,211,153,0.15)' },
  { key: 'ARCHIVED', label: 'Archived', topColor: '#94a3b8', glowColor: 'rgba(148,163,184,0.10)' },
]

function KanbanCard({ demo, onDragStart }) {
  const tags = demo.TAGS ? demo.TAGS.split(',').filter(Boolean) : []
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('demoId', demo.ID)
        e.dataTransfer.setData('fromStatus', demo.STATUS)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      className="glass rounded-xl p-3.5 cursor-grab active:cursor-grabbing group transition-all"
      style={{ '--hover-bg': 'rgba(255,255,255,0.08)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
    >
      <Link
        to={`/demos/${demo.ID}`}
        onClick={e => e.stopPropagation()}
        className="block text-sm font-medium text-white group-hover:text-brand transition-colors line-clamp-2 mb-2"
      >
        {demo.TITLE}
      </Link>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.slice(0, 3).map(t => <TagChip key={t} tag={t} />)}
          {tags.length > 3 && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>+{tags.length - 3}</span>}
        </div>
      )}

      <div className="mt-2">
        <CompletenessBar score={demo.completeness || 0} />
      </div>

      <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{demo.DEMODATE || '—'}</span>
        {demo.clientCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#c4b5fd' }}>
            <Users size={10} /> {demo.clientCount}
          </span>
        )}
      </div>
    </div>
  )
}

function KanbanColumn({ col, demos, onDrop, saving }) {
  const [dragOver, setDragOver] = useState(false)

  return (
    <div
      className={`flex-1 min-w-0 rounded-xl flex flex-col overflow-hidden transition-all`}
      style={{
        background: dragOver ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: dragOver ? `1px solid rgba(77,166,255,0.40)` : '1px solid rgba(255,255,255,0.08)',
        borderTop: `3px solid ${col.topColor}`,
        boxShadow: dragOver ? '0 0 0 2px rgba(77,166,255,0.20)' : 'none',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false) }}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const demoId = e.dataTransfer.getData('demoId')
        const fromStatus = e.dataTransfer.getData('fromStatus')
        if (fromStatus !== col.key) onDrop(demoId, col.key)
      }}
    >
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
        <span className="text-sm font-semibold text-white">{col.label}</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}>{demos.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[200px] scrollbar-thin">
        {demos.map(demo => (
          <KanbanCard key={demo.ID} demo={demo} onDragStart={() => {}} />
        ))}
        {demos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-sm" style={{ color: 'rgba(255,255,255,0.22)' }}>
            <Layers size={22} className="mb-2" />
            Drop demos here
          </div>
        )}
      </div>
    </div>
  )
}

export default function Kanban() {
  const { demos, loading, reload } = useDemos({})
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const grouped = STATUS_COLS.reduce((acc, col) => {
    acc[col.key] = demos.filter(d => d.STATUS === col.key)
    return acc
  }, {})

  const handleDrop = async (demoId, newStatus) => {
    setSaving(true)
    try {
      await api.patch(`/demos/${demoId}/status`, { status: newStatus })
      await reload()
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell
      label="Board"
      title="Kanban"
      subtitle="Drag demos between columns to change status"
      action={
        <Link to="/demos/new" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          style={{ boxShadow: '0 4px 16px rgba(77,166,255,0.30)' }}>
          <Plus size={15} /> New Demo
        </Link>
      }
      className="flex flex-col !p-0"
    >
      <div className="flex-1 px-6 pb-6 pt-0">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <div className="flex gap-4 h-full" style={{ minHeight: '500px' }}>
            {STATUS_COLS.map(col => (
              <KanbanColumn
                key={col.key}
                col={col}
                demos={grouped[col.key] || []}
                onDrop={handleDrop}
                saving={saving}
              />
            ))}
          </div>
        )}
        {saving && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.40)' }}>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Updating status…
          </div>
        )}
      </div>
    </PageShell>
  )
}
