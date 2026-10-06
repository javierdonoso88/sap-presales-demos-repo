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
  { key: 'DRAFT',    label: 'Draft',    border: 'border-t-amber-400',   bg: 'bg-amber-50/40',   header: 'bg-amber-50 text-amber-700 border-b border-amber-100' },
  { key: 'READY',    label: 'Ready',    border: 'border-t-emerald-400', bg: 'bg-emerald-50/20', header: 'bg-emerald-50 text-emerald-700 border-b border-emerald-100' },
  { key: 'ARCHIVED', label: 'Archived', border: 'border-t-zinc-300',    bg: 'bg-zinc-50/50',    header: 'bg-zinc-50 text-zinc-500 border-b border-zinc-100' },
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
      className="bg-white rounded-xl border border-zinc-100 shadow-sm hover:shadow-md hover:border-brand/30 transition-all p-3.5 cursor-grab active:cursor-grabbing group"
    >
      <Link
        to={`/demos/${demo.ID}`}
        onClick={e => e.stopPropagation()}
        className="block text-sm font-medium text-zinc-800 group-hover:text-brand transition-colors line-clamp-2 mb-2"
      >
        {demo.TITLE}
      </Link>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.slice(0, 3).map(t => <TagChip key={t} tag={t} />)}
          {tags.length > 3 && <span className="text-xs text-zinc-400">+{tags.length - 3}</span>}
        </div>
      )}

      <div className="mt-2">
        <CompletenessBar score={demo.completeness || 0} />
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-50">
        <span className="text-xs text-zinc-400">{demo.DEMODATE || '—'}</span>
        {demo.clientCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600">
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
      className={`flex-1 min-w-0 rounded-xl border-t-4 ${col.border} ${col.bg} flex flex-col overflow-hidden border border-zinc-100 transition-all ${dragOver ? 'ring-2 ring-brand ring-offset-2' : ''}`}
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
      <div className={`px-4 py-3 flex items-center gap-2 ${col.header}`}>
        <span className="text-sm font-semibold">{col.label}</span>
        <span className="text-xs font-semibold bg-white/60 px-2 py-0.5 rounded-full">{demos.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[200px] scrollbar-thin">
        {demos.map(demo => (
          <KanbanCard key={demo.ID} demo={demo} onDragStart={() => {}} />
        ))}
        {demos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-zinc-300 text-sm">
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
        <Link to="/demos/new" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
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
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Updating status…
          </div>
        )}
      </div>
    </PageShell>
  )
}
