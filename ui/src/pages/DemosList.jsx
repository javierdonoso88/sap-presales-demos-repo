import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Edit2 } from 'lucide-react'
import { useDemos } from '../hooks/useDemos'
import { useSolutions } from '../hooks/useMasterData'
import PageHeader from '../components/shared/PageHeader'
import StatusBadge from '../components/shared/StatusBadge'
import Spinner from '../components/shared/Spinner'

export default function DemosList() {
  const [filters, setFilters] = useState({ status: '', search: '', solution_id: '' })
  const { demos, loading, error } = useDemos(filters)
  const solutions = useSolutions()

  return (
    <div className="p-6">
      <PageHeader
        title="Demos"
        actions={
          <Link to="/demos/new">
            <button className="px-4 py-2 text-sm rounded-md bg-sap-blue hover:bg-sap-blue-dark text-white font-medium">
              + New Demo
            </button>
          </Link>
        }
      />

      {/* Filter bar */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4 flex gap-3 items-center flex-wrap">
        <input
          type="text"
          placeholder="Search..."
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sap-blue min-w-[200px]"
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sap-blue"
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="READY">Ready</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sap-blue"
          onChange={e => setFilters(f => ({ ...f, solution_id: e.target.value }))}
        >
          <option value="">All solutions</option>
          {solutions.items.map(s => (
            <option key={s.ID} value={s.ID}>{s.NAME}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
          Failed to load demos. Please try again.
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Clients</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <div className="flex justify-center"><Spinner /></div>
                </td>
              </tr>
            ) : (
              demos.map(demo => (
                <tr key={demo.ID} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <Link to={`/demos/${demo.ID}`} className="text-sap-blue hover:underline font-medium">
                      {demo.TITLE}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{demo.DEMODATE || '—'}</td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={demo.STATUS} /></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{demo.CREATEDBY || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{demo.CLIENT_COUNT || 0}</td>
                  <td className="px-4 py-3 text-sm">
                    <Link to={`/demos/${demo.ID}/edit`} className="text-gray-400 hover:text-sap-blue">
                      <Edit2 size={16} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {demos.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-400">No demos found</div>
        )}
      </div>
    </div>
  )
}
