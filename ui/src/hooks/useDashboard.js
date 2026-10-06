import { useState, useEffect } from 'react'
import api from '../api/client'

export function useDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setData(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
