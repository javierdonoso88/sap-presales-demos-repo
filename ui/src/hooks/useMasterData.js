import { useState, useEffect } from 'react'
import api from '../api/client'

function useResource(path) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(path)
      .then(res => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [path])

  return { items, loading }
}

export const useSystems = () => useResource('/systems')
export const useClients = () => useResource('/clients')
