import { useState, useRef } from 'react'
import { X } from 'lucide-react'

const TAG_COLORS = [
  'bg-blue-400/15 text-blue-300', 'bg-teal-400/15 text-teal-300',
  'bg-violet-400/15 text-violet-300', 'bg-amber-400/15 text-amber-300',
  'bg-emerald-400/15 text-emerald-300', 'bg-pink-400/15 text-pink-300',
  'bg-orange-400/15 text-orange-300', 'bg-indigo-400/15 text-indigo-300',
]

function tagColor(tag) {
  let hash = 0
  for (const ch of tag) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return TAG_COLORS[hash % TAG_COLORS.length]
}

export function TagChip({ tag, onRemove }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tagColor(tag)}`}>
      {tag}
      {onRemove && (
        <button onClick={() => onRemove(tag)} className="hover:opacity-70 transition-opacity ml-0.5">
          <X size={10} />
        </button>
      )}
    </span>
  )
}

export default function TagInput({ value = [], onChange }) {
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const add = (raw) => {
    const tag = raw.trim().replace(/,/g, '')
    if (!tag || value.includes(tag)) { setInput(''); return }
    onChange([...value, tag])
    setInput('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const handleBlur = () => { if (input.trim()) add(input) }

  return (
    <div
      className="flex flex-wrap gap-1.5 min-h-[38px] w-full rounded-lg px-2.5 py-1.5 cursor-text transition-all"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
      onClick={() => inputRef.current?.focus()}
      onFocus={() => {}}
    >
      {value.map(t => (
        <TagChip key={t} tag={t} onRemove={(tag) => onChange(value.filter(v => v !== tag))} />
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? 'Añadir tags… (Enter para confirmar)' : ''}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent text-white"
        style={{ caretColor: '#4da6ff' }}
      />
    </div>
  )
}
