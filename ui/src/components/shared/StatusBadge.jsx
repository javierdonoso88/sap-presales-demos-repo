export default function StatusBadge({ status }) {
  const cls = status === 'READY'    ? 'badge-ready'
            : status === 'ARCHIVED' ? 'badge-archived'
            :                         'badge-draft'
  const label = status === 'READY' ? 'Ready' : status === 'ARCHIVED' ? 'Archived' : 'Draft'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
}
