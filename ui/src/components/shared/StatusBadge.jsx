const config = {
  READY:    { label: 'Ready',    classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  DRAFT:    { label: 'Draft',    classes: 'bg-zinc-100 text-zinc-600 border border-zinc-200' },
  ARCHIVED: { label: 'Archived', classes: 'bg-amber-50 text-amber-700 border border-amber-200' },
}

export default function StatusBadge({ status }) {
  const c = config[status] || config.DRAFT
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.classes}`}>
      {c.label}
    </span>
  )
}
