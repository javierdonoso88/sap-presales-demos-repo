import { Link } from 'react-router-dom'
import {
  BookOpen, CheckCircle, Edit3, Calendar
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Legend,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { useDashboard } from '../hooks/useDashboard'
import PageHeader from '../components/shared/PageHeader'
import Spinner from '../components/shared/Spinner'
import StatusBadge from '../components/shared/StatusBadge'

const STATUS_COLORS = {
  DRAFT: '#6a6d70',
  READY: '#107e3e',
  ARCHIVED: '#f0ab00',
}

function KpiCard({ label, value, icon: Icon, color }) {
  const colors = {
    blue: { bg: 'bg-sap-blue-light', icon: 'text-sap-blue', value: 'text-sap-blue' },
    green: { bg: 'bg-green-50', icon: 'text-green-700', value: 'text-green-700' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', value: 'text-orange-600' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-700', value: 'text-purple-700' },
  }
  const c = colors[color]
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-sap-gray-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${c.value}`}>{value ?? 0}</p>
        </div>
        <div className={`${c.bg} p-3 rounded-full`}>
          <Icon size={22} className={c.icon} />
        </div>
      </div>
    </div>
  )
}

function RecentDemosTable({ demos = [] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Recent Demos</h2>
        <Link to="/demos" className="text-xs text-sap-blue hover:underline">View all →</Link>
      </div>
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
          </tr>
        </thead>
        <tbody>
          {demos.map(demo => (
            <tr key={demo.ID} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">
                <Link to={`/demos/${demo.ID}`} className="text-sap-blue hover:underline font-medium">
                  {demo.TITLE}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{demo.DEMODATE || '—'}</td>
              <td className="px-4 py-3 text-sm"><StatusBadge status={demo.STATUS} /></td>
              <td className="px-4 py-3 text-sm text-gray-600">{demo.CREATEDBY || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {demos.length === 0 && (
        <div className="p-8 text-center text-gray-400">No demos yet. <Link to="/demos/new" className="text-sap-blue hover:underline">Create one →</Link></div>
      )}
    </div>
  )
}

const CustomPieLegend = ({ byStatus }) => (
  <div className="flex justify-center gap-5 mt-2">
    {byStatus.map(entry => (
      <div key={entry.status} className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[entry.status] || '#ccc' }} />
        <span className="text-xs text-gray-600">{entry.status}</span>
        <span className="text-xs font-semibold text-gray-900">{entry.count}</span>
      </div>
    ))}
  </div>
)

export default function Dashboard() {
  const { data, loading, error } = useDashboard()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Failed to load dashboard data.</p>
          <p className="text-sm mt-1 text-red-600">{error?.message || error?.error || String(error)}</p>
        </div>
      </div>
    )
  }

  const totals = data?.totals || {}
  const byStatus = data?.byStatus || []
  const bySolution = data?.bySolution || []
  const byMonth = data?.byMonth || []
  const recentDemos = data?.recentDemos || []

  // Only include non-zero statuses in the donut chart
  const byStatusForChart = byStatus.filter(s => s.count > 0)

  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        subtitle="SAP Analytics Presales – Demo Overview"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Demos" value={totals.total} icon={BookOpen} color="blue" />
        <KpiCard label="Ready" value={totals.ready} icon={CheckCircle} color="green" />
        <KpiCard label="Draft" value={totals.draft} icon={Edit3} color="orange" />
        <KpiCard label="This Month" value={totals.thisMonth} icon={Calendar} color="purple" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Status Donut */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Demos by Status</h2>
          {byStatusForChart.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={byStatusForChart}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {byStatusForChart.map((entry, index) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.status] || '#ccc'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [`${val} demos`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <CustomPieLegend byStatus={byStatus} />
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No demos yet
            </div>
          )}
        </div>

        {/* By Solution Bar */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Demos by Solution</h2>
          {bySolution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bySolution} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0070f2" radius={[3, 3, 0, 0]} name="Demos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No solution data yet
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Monthly Trend (last 6 months)</h2>
        {byMonth.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byMonth} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0070f2" radius={[3, 3, 0, 0]} name="Demos" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No demos created in the last 6 months
          </div>
        )}
      </div>

      {/* Recent Demos */}
      <RecentDemosTable demos={recentDemos} />
    </div>
  )
}
