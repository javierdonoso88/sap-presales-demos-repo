import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useDemo } from '../hooks/useDemos'
import api from '../api/client'
import StatusBadge from '../components/shared/StatusBadge'
import Spinner from '../components/shared/Spinner'

const TABS = ['General', 'Tenants', 'Solutions', 'Objects', 'Clients']

export default function DemoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { demo, loading, error } = useDemo(id)
  const [activeTab, setActiveTab] = useState('General')

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this demo? This action cannot be undone.')) return
    try {
      await api.delete(`/demos/${id}`)
      navigate('/demos')
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !demo) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load demo. <Link to="/demos" className="underline">Go back to demos</Link>.
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/demos" className="text-sap-blue hover:underline text-sm">← Back to Demos</Link>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">{demo.TITLE}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={demo.STATUS} />
              {demo.DEMODATE && (
                <span className="text-sm text-gray-500">📅 {demo.DEMODATE}</span>
              )}
              {demo.CREATEDBY && (
                <span className="text-sm text-gray-500">by {demo.CREATEDBY}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/demos/${id}/edit`}>
              <button className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">
                Edit
              </button>
            </Link>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-0 border-t">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? 'border-sap-blue text-sap-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'General' && (
          <div className="bg-white rounded-lg p-6 shadow-sm max-w-2xl">
            <h2 className="text-base font-semibold text-gray-800 mb-4">General Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</dt>
                <dd className="mt-1 text-sm text-gray-900">{demo.TITLE}</dd>
              </div>
              {demo.DESCRIPTION && (
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{demo.DESCRIPTION}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</dt>
                <dd className="mt-1"><StatusBadge status={demo.STATUS} /></dd>
              </div>
              {demo.DEMODATE && (
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Demo Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{demo.DEMODATE}</dd>
                </div>
              )}
              {demo.CREATEDAT && (
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900">{demo.CREATEDAT}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {activeTab === 'Tenants' && (
          <AssociationTable
            title="Tenants"
            items={demo.tenants || []}
            columns={[
              { label: 'Name', key: 'NAME' },
              { label: 'Type', key: 'TYPE' },
              { label: 'URL', key: 'URL' },
              { label: 'Notes', key: 'NOTES' },
            ]}
            emptyMsg="No tenants associated with this demo."
          />
        )}

        {activeTab === 'Solutions' && (
          <AssociationTable
            title="Solutions"
            items={demo.solutions || []}
            columns={[
              { label: 'Name', key: 'NAME' },
              { label: 'Area', key: 'AREA' },
              { label: 'Notes', key: 'NOTES' },
            ]}
            emptyMsg="No solutions associated with this demo."
          />
        )}

        {activeTab === 'Objects' && (
          <AssociationTable
            title="Objects"
            items={demo.objects || []}
            columns={[
              { label: 'Name', key: 'NAME' },
              { label: 'Type', key: 'OBJECTTYPE' },
              { label: 'Tenant', key: 'TENANT_NAME' },
              { label: 'Solution', key: 'SOLUTION_NAME' },
              { label: 'Notes', key: 'NOTES' },
            ]}
            emptyMsg="No objects associated with this demo."
          />
        )}

        {activeTab === 'Clients' && (
          <AssociationTable
            title="Client Presentations"
            items={demo.clients || []}
            columns={[
              { label: 'Client', key: 'NAME' },
              { label: 'Industry', key: 'INDUSTRY' },
              { label: 'Date', key: 'PRESENTATIONDATE' },
              { label: 'Result', key: 'RESULT' },
              { label: 'Feedback', key: 'FEEDBACK' },
            ]}
            emptyMsg="No client presentations recorded for this demo."
          />
        )}
      </div>
    </div>
  )
}

function AssociationTable({ title, items, columns, emptyMsg }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">{title} ({items.length})</h2>
      </div>
      {items.length === 0 ? (
        <div className="p-8 text-center text-gray-400">{emptyMsg}</div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                    {item[col.key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
