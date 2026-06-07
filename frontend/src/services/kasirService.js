import api from './api'

export const kasirService = {
  getAll: () => api.get('/kasir'),
  getById: (id) => api.get(`/kasir/${id}`),
  create: (data) => api.post('/kasir', data),
  update: (id, data) => {
    if (data instanceof FormData) {
      data.append('_method', 'PUT')
      return api.post(`/kasir/${id}`, data)
    }
    return api.put(`/kasir/${id}`, data)
  },
  delete: (id) => api.delete(`/kasir/${id}`)
}