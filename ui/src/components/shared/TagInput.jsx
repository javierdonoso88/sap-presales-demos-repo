import { useState, useRef, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

const TAG_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-teal-100 text-teal-700',
  'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700', 'bg-pink-100 text-pink-700',
  'bg-orange-100 text-orange-700', 'bg-indigo-100 text-indigo-700',
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
      className="flex flex-wrap gap-1.5 min-h-[38px] w-full border border-gray-200 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-sap-blue focus-within:border-transparent cursor-text bg-white"
      onClick={() => inputRef.current?.focus()}
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
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder-gray-400"
      />
    </div>
  )
}
