import api from './api'

export const outletService = {
  getAll: () => api.get('/outlets'),
  getById: (id) => api.get(`/outlets/${id}`),
  create: (data) => api.post('/outlets', data),
  update: (id, data) => api.put(`/outlets/${id}`, data),
  delete: (id) => api.delete(`/outlets/${id}`)
}