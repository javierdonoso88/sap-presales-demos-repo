import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle, Edit3, Calendar, Plus, ChevronRight, Users, Activity } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'
import { useDashboard } from '../hooks/useDashboard'
import Spinner from '../components/shared/Spinner'
import StatusBadge from '../components/shared/StatusBadge'
import PageShell from '../components/layout/PageShell'

const STATUS_COLORS = { DRAFT: '#a1a1aa', READY: '#10b981', ARCHIVED: '#f59e0b' }
const STATUS_LABEL  = { DRAFT: 'Draft',   READY: 'Ready',   ARCHIVED: 'Archived' }

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, iconBg, sub }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-zinc-100 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-bold text-zinc-900 mt-2 tracking-tight leading-none">{value ?? 0}</p>
        {sub && <p className="text-xs text-zinc-400 mt-2">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${iconBg}`}>
        <Icon size={18} />
      </div>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-zinc-100 rounded-xl px-3 py-2 shadow-lg text-sm">
      {label && <p className="font-semibold text-zinc-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-zinc-600">
          <span className="font-bold text-zinc-900">{p.value}</span> demos
        </p>
      ))}
    </div>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
function ActivityFeed({ items = [] }) {
  const timeAgo = (dt) => {
    if (!dt) return '—'
    const diff = Date.now() - new Date(dt).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }
  return (
    <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
        <Activity size={14} className="text-zinc-400" />
        <h2 className="text-sm font-semibold text-zinc-900">Recent Activity</h2>
        <span className="text-xs font-semibold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full ml-1">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-zinc-400">No recent activity</div>
      ) : (
        <ul className="divide-y divide-zinc-50">
          {items.map(item => (
            <li key={item.ID} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-brand/40 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Link to={`/demos/${item.ID}`} className="text-sm font-medium text-zinc-800 hover:text-brand transition-colors truncate block">{item.TITLE}</Link>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {item.MODIFIEDBY ? item.MODIFIEDBY.split('@')[0] : item.CREATEDBY?.split('@')[0]}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={item.STATUS} />
                <span className="text-xs text-zinc-400">{timeAgo(item.MODIFIEDAT || item.CREATEDAT)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Recent Demos ─────────────────────────────────────────────────────────────
function RecentDemosTable({ demos = [] }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Recent Demos</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Latest activity in the repository</p>
        </div>
        <Link to="/demos" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
          View all <ChevronRight size={13} />
        </Link>
      </div>
      {demos.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen size={22} className="text-brand" />
          </div>
          <p className="text-sm font-medium text-zinc-600">No demos yet</p>
          <p className="text-xs text-zinc-400 mt-1">Get started by creating your first demo</p>
          <Link to="/demos/new" className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-white bg-brand hover:bg-brand-dark px-4 py-2 rounded-lg transition-colors">
            <Plus size={13} /> New Demo
          </Link>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100">
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Created by</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {demos.map(demo => (
              <tr key={demo.ID} className="group border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4">
                  <Link to={`/demos/${demo.ID}`} className="font-medium text-zinc-800 group-hover:text-brand transition-colors text-sm line-clamp-1">
                    {demo.TITLE}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm text-zinc-500">{demo.DEMODATE || '—'}</td>
                <td className="px-4 py-4"><StatusBadge status={demo.STATUS} /></td>
                <td className="px-4 py-4 text-sm text-zinc-500">{demo.CREATEDBY || '—'}</td>
                <td className="px-4 py-4 text-right">
                  <Link to={`/demos/${demo.ID}`} className="text-zinc-300 group-hover:text-brand transition-colors">
                    <ChevronRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data, loading, error } = useDashboard()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-16">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-sm text-zinc-400 mt-3">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">
          <p className="font-semibold">Failed to load dashboard data.</p>
          <p className="text-sm mt-1 text-red-500 font-mono">{error?.message || error?.error || String(error)}</p>
        </div>
      </div>
    )
  }

  const totals        = data?.totals || {}
  const byStatus      = data?.byStatus || []
  const bySystemType  = data?.bySystemType || []
  const byMonth       = data?.byMonth || []
  const recentDemos   = data?.recentDemos || []
  const activity      = data?.activity || []
  const byUser        = data?.byUser || []

  const byStatusForChart = byStatus.filter(s => s.count > 0)
  const byMonthFormatted = byMonth.map(m => ({
    ...m,
    label: m.month ? new Date(m.month + '-01').toLocaleString('en', { month: 'short', year: '2-digit' }) : m.month
  }))

  return (
    <PageShell
      label="SAP Analytics Presales"
      title="Dashboard"
      subtitle="Demo Repository Overview"
      action={
        <Link to="/demos/new" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <Plus size={15} /> New Demo
        </Link>
      }
    >
      <div className="space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Total Demos"  value={totals.total}     icon={BookOpen}     iconBg="bg-brand-light text-brand"   sub="All time" />
          <KpiCard label="Ready"        value={totals.ready}     icon={CheckCircle}  iconBg="bg-emerald-50 text-emerald-600" sub="Available to present" />
          <KpiCard label="Draft"        value={totals.draft}     icon={Edit3}        iconBg="bg-amber-50 text-amber-600"  sub="In progress" />
          <KpiCard label="This Month"   value={totals.thisMonth} icon={Calendar}     iconBg="bg-violet-50 text-violet-600" sub="Created this month" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-5 gap-5">
          {/* Donut */}
          <div className="col-span-2 bg-white rounded-xl p-5 border border-zinc-100 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Status Distribution</h2>
            {byStatusForChart.length > 0 ? (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={byStatusForChart} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={62} outerRadius={90} paddingAngle={3} strokeWidth={0}>
                        {byStatusForChart.map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.status] || '#ccc'} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-zinc-900 leading-none">{totals.total || 0}</p>
                      <p className="text-xs font-medium text-zinc-400 mt-1">total</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-3 mt-4 flex-wrap">
                  {byStatus.map(s => (
                    <div key={s.status} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] + '18' }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] }} />
                      <span className="text-xs font-semibold" style={{ color: STATUS_COLORS[s.status] }}>{STATUS_LABEL[s.status]}</span>
                      <span className="text-xs font-bold text-zinc-700">{s.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-52 text-center">
                <BookOpen size={24} className="text-zinc-200 mb-3" />
                <p className="text-sm text-zinc-400">No demos yet</p>
              </div>
            )}
          </div>

          {/* By System Type */}
          <div className="col-span-3 bg-white rounded-xl p-5 border border-zinc-100 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Demos by System Type</h2>
            {bySystemType.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bySystemType} margin={{ top: 5, right: 10, left: -25, bottom: 20 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8faff' }} />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-52 text-zinc-400 text-sm">No system data yet</div>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl p-5 border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Monthly Activity</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Demos created in the last 6 months</p>
            </div>
          </div>
          {byMonthFormatted.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={byMonthFormatted} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} fill="url(#areaGrad)" dot={{ fill: '#2563eb', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-zinc-400 text-sm">No demos created in the last 6 months</div>
          )}
        </div>

        {/* Activity + Top Users */}
        <div className="grid grid-cols-2 gap-5">
          <ActivityFeed items={activity} />
          <div className="bg-white rounded-xl p-5 border border-zinc-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users size={14} className="text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-900">Top Contributors</h2>
            </div>
            {byUser.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byUser.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 15, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="user" tick={{ fontSize: 11, fill: '#52525b', fontWeight: 500 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip formatter={(v) => [`${v} demos`, 'Count']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-zinc-400">No data yet</div>
            )}
          </div>
        </div>

        {/* Recent Demos */}
        <RecentDemosTable demos={recentDemos} />
      </div>
    </PageShell>
  )
}
