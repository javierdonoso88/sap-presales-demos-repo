export default function PageShell({ label, title, subtitle, action, children, className = '' }) {
  return (
    <div className="min-h-full flex flex-col">
      <div className="glass-header px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            {label && (
              <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-0.5">{label}</p>
            )}
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      </div>
      <div className={`flex-1 p-6 ${className}`}>{children}</div>
    </div>
  )
}
