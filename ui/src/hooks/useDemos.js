import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'

export function useDemos(filters = {}) {
  const [demos, setDemos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.search) params.search = filters.search
    if (filters.systemType) params.system_type = filters.systemType
    if (filters.landscape) params.landscape = filters.landscape
    api.get('/demos', { params })
      .then(res => setDemos(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [filters.status, filters.search, filters.systemType, filters.landscape])

  useEffect(() => { load() }, [load])

  return { demos, loading, error, reload: load }
}

export function useDemo(id) {
  const [demo, setDemo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    api.get(`/demos/${id}`)
      .then(res => setDemo(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [id])

  return { demo, loading, error }
}
