import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import StatusBadge from '../components/shared/StatusBadge'
import Spinner from '../components/shared/Spinner'
import { TagChip } from '../components/shared/TagInput'
import { ExternalLink, Users, Calendar } from 'lucide-react'

const TYPE_COLORS = {
  SAC: 'bg-teal-100 text-teal-700', DATASPHERE: 'bg-blue-100 text-blue-700',
  BDC: 'bg-indigo-100 text-indigo-700', S4HANA: 'bg-emerald-100 text-emerald-700',
  BW4HANA: 'bg-orange-100 text-orange-700', OTHER: 'bg-gray-100 text-gray-600',
}
const LANDSCAPE_COLORS = {
  BDC_GA: 'bg-blue-100 text-blue-700', GLA26Q2: 'bg-violet-100 text-violet-700',
  SANDBOX: 'bg-amber-100 text-amber-700', EXTERNAL: 'bg-gray-100 text-gray-600',
}
const LANDSCAPE_LABELS = { BDC_GA: 'BDC GA', GLA26Q2: 'GLA26Q2', SANDBOX: 'Sandbox', EXTERNAL: 'External' }
const RESULT_LABELS = {
  VERY_INTERESTED: 'Muy interesado', INTERESTED: 'Interesado',
  NEUTRAL: 'Neutral', NOT_INTERESTED: 'Sin interés',
}

export default function ShareView() {
  const { token } = useParams()
  const [demo, setDemo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/share/${token}`)
      .then(res => setDemo(res.data))
      .catch(err => setError(err.error || 'Link not found or expired'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <p className="text-4xl mb-4">🔗</p>
        <h1 className="text-lg font-bold text-gray-800 mb-2">Link inválido o expirado</h1>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <Link to="/" className="text-sap-blue text-sm hover:underline">Ir al repositorio →</Link>
      </div>
    </div>
  )

  const tags = demo.TAGS ? demo.TAGS.split(',').filter(Boolean) : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 px-6 pt-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">SAP Presales · Demo compartida</span>
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight">{demo.TITLE}</h1>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <StatusBadge status={demo.STATUS} />
            {demo.DEMODATE && (
              <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                <Calendar size={11} /> {demo.DEMODATE}
              </span>
            )}
            {demo.CREATEDBY && (
              <span className="text-slate-400 text-xs">by {demo.CREATEDBY.split('@')[0]}</span>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map(t => <TagChip key={t} tag={t} />)}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-6 pb-10 space-y-4">
        {/* Description */}
        {demo.DESCRIPTION && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-50 p-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descripción</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{demo.DESCRIPTION}</p>
          </div>
        )}

        {/* Systems */}
        {demo.systems?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-800">Sistemas utilizados</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Sistema</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Landscape</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Notas</th>
                </tr>
              </thead>
              <tbody>
                {demo.systems.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{s.NAME}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[s.TYPE] || TYPE_COLORS.OTHER}`}>{s.TYPE}</span>
                    </td>
                    <td className="px-5 py-3">
                      {s.LANDSCAPE && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LANDSCAPE_COLORS[s.LANDSCAPE] || LANDSCAPE_COLORS.EXTERNAL}`}>
                          {LANDSCAPE_LABELS[s.LANDSCAPE] || s.LANDSCAPE}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{s.NOTES || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Clients */}
        {demo.clients?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-800">Presentaciones a clientes</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {demo.clients.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{c.NAME}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{c.PRESENTATIONDATE || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{RESULT_LABELS[c.RESULT] || c.RESULT || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-center pt-4">
          <Link to="/" className="text-xs text-gray-400 hover:text-sap-blue transition-colors">
            Ir al repositorio completo →
          </Link>
        </div>
      </div>
    </div>
  )
}
