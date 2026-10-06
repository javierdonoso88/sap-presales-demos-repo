import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
  res => {
    const body = res.data;
    // Normalize CAP REST { value: [...] } collections to the same { data: [...] } shape
    // that custom Express routes return, so all consumers can use res.data uniformly.
    if (body && typeof body === 'object' && Array.isArray(body.value)) {
      return { data: body.value };
    }
    return body;
  },
  err => Promise.reject(err.response?.data || err)
)

export default api
