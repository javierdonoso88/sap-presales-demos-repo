export default function CompletenessBar({ score }) {
  const pct = Math.round(score || 0)
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'
  const textColor = pct >= 80 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums ${textColor}`}>{pct}%</span>
    </div>
  )
}
