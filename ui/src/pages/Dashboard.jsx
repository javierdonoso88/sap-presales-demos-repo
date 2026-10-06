import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle, Edit3, Calendar, Plus, ChevronRight, Users } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'
import { useDashboard } from '../hooks/useDashboard'
import Spinner from '../components/shared/Spinner'

const STATUS_COLORS = { DRAFT: '#94a3b8', READY: '#10b981', ARCHIVED: '#f59e0b' }
const STATUS_LABEL = { DRAFT: 'Draft', READY: 'Ready', ARCHIVED: 'Archived' }

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, iconClass, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-200/60 border border-gray-50 flex items-start justify-between">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-4xl font-black text-gray-900 mt-2 tracking-tight leading-none">{value ?? 0}</p>
        {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl ${iconClass}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-sm">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-gray-600">
          <span className="font-bold text-gray-900">{p.value}</span> demos
        </p>
      ))}
    </div>
  )
}

// ─── Recent Demos ─────────────────────────────────────────────────────────────
function RecentDemosTable({ demos = [] }) {
  const pill = {
    READY: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    DRAFT: 'bg-slate-100 text-slate-600 border border-slate-200',
    ARCHIVED: 'bg-amber-50 text-amber-700 border border-amber-200',
  }
  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-gray-50 overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
        <div>
          <h2 className="text-base font-bold text-gray-900">Recent Demos</h2>
          <p className="text-xs text-gray-400 mt-0.5">Latest activity in the repository</p>
        </div>
        <Link to="/demos" className="flex items-center gap-1 text-xs font-semibold text-sap-blue hover:underline">
          View all <ChevronRight size={13} />
        </Link>
      </div>
      {demos.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen size={22} className="text-sap-blue" />
          </div>
          <p className="text-sm font-medium text-gray-600">No demos yet</p>
          <p className="text-xs text-gray-400 mt-1">Get started by creating your first demo</p>
          <Link to="/demos/new" className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-white bg-sap-blue hover:bg-sap-blue-dark px-4 py-2 rounded-lg transition-colors">
            <Plus size={13} /> New Demo
          </Link>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Title</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Created by</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {demos.map(demo => (
              <tr key={demo.ID} className="group border-b border-gray-50 last:border-0 hover:bg-blue-50/40 transition-colors">
                <td className="px-6 py-4">
                  <Link to={`/demos/${demo.ID}`} className="font-semibold text-gray-800 group-hover:text-sap-blue transition-colors text-sm line-clamp-1">
                    {demo.TITLE}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">{demo.DEMODATE || '—'}</td>
                <td className="px-4 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pill[demo.STATUS] || pill.DRAFT}`}>
                    {STATUS_LABEL[demo.STATUS] || demo.STATUS}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">{demo.CREATEDBY || '—'}</td>
                <td className="px-4 py-4 text-right">
                  <Link to={`/demos/${demo.ID}`} className="text-gray-300 group-hover:text-sap-blue transition-colors">
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
          <p className="text-sm text-gray-400 mt-3">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700">
          <p className="font-bold">Failed to load dashboard data.</p>
          <p className="text-sm mt-1 text-red-500 font-mono">{error?.message || error?.error || String(error)}</p>
        </div>
      </div>
    )
  }

  const totals = data?.totals || {}
  const byStatus = data?.byStatus || []
  const bySystemType = data?.bySystemType || []
  const byMonth = data?.byMonth || []
  const recentDemos = data?.recentDemos || []

  const byStatusForChart = byStatus.filter(s => s.count > 0)

  // Format month labels: '2024-01' → 'Jan'
  const byMonthFormatted = byMonth.map(m => ({
    ...m,
    label: m.month ? new Date(m.month + '-01').toLocaleString('en', { month: 'short', year: '2-digit' }) : m.month
  }))

  return (
    <div className="min-h-full">
      {/* ── Dark Hero Header ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 px-6 pt-8 pb-20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">SAP Analytics Presales</p>
            <h1 className="text-white text-3xl font-black tracking-tight">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Demo Repository Overview</p>
          </div>
          <Link
            to="/demos/new"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors border border-white/15 backdrop-blur-sm"
          >
            <Plus size={15} /> New Demo
          </Link>
        </div>
      </div>

      {/* ── KPI Cards (floating over header) ── */}
      <div className="px-6 -mt-12 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            label="Total Demos"
            value={totals.total}
            icon={BookOpen}
            iconClass="bg-gradient-to-br from-blue-500 to-blue-700"
            sub="All time"
          />
          <KpiCard
            label="Ready"
            value={totals.ready}
            icon={CheckCircle}
            iconClass="bg-gradient-to-br from-emerald-400 to-emerald-600"
            sub="Available to present"
          />
          <KpiCard
            label="Draft"
            value={totals.draft}
            icon={Edit3}
            iconClass="bg-gradient-to-br from-amber-400 to-amber-600"
            sub="In progress"
          />
          <KpiCard
            label="This Month"
            value={totals.thisMonth}
            icon={Calendar}
            iconClass="bg-gradient-to-br from-violet-500 to-violet-700"
            sub="Created this month"
          />
        </div>
      </div>

      <div className="px-6 space-y-5">
        {/* ── Charts Row ── */}
        <div className="grid grid-cols-5 gap-5">
          {/* Donut */}
          <div className="col-span-2 bg-white rounded-2xl p-5 shadow-xl shadow-slate-200/60 border border-gray-50">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Status Distribution</h2>
            {byStatusForChart.length > 0 ? (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={byStatusForChart}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={90}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {byStatusForChart.map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.status] || '#ccc'} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-4xl font-black text-gray-900 leading-none">{totals.total || 0}</p>
                      <p className="text-xs font-medium text-gray-400 mt-1">total</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-3 mt-4 flex-wrap">
                  {byStatus.map(s => (
                    <div key={s.status} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] + '18' }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] }} />
                      <span className="text-xs font-semibold" style={{ color: STATUS_COLORS[s.status] }}>{STATUS_LABEL[s.status]}</span>
                      <span className="text-xs font-black text-gray-700">{s.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-52 text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                  <BookOpen size={24} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 font-medium">No demos yet</p>
              </div>
            )}
          </div>

          {/* By System Type */}
          <div className="col-span-3 bg-white rounded-2xl p-5 shadow-xl shadow-slate-200/60 border border-gray-50">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Demos by System Type</h2>
            {bySystemType.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bySystemType} margin={{ top: 5, right: 10, left: -25, bottom: 20 }} barCategoryGap="35%">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0070f2" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0040b0" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8faff' }} />
                  <Bar dataKey="count" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-52 text-center">
                <p className="text-sm text-gray-400">No system data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Monthly Trend ── */}
        <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-200/60 border border-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Monthly Activity</h2>
              <p className="text-xs text-gray-400 mt-0.5">Demos created in the last 6 months</p>
            </div>
          </div>
          {byMonthFormatted.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={byMonthFormatted} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0070f2" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0070f2" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#0070f2" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: '#0070f2', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              No demos created in the last 6 months
            </div>
          )}
        </div>

        {/* ── Recent Demos ── */}
        <div className="pb-6">
          <RecentDemosTable demos={recentDemos} />
        </div>
      </div>
    </div>
  )
}
