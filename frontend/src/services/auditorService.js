import api from './api'
export const auditorService = {
  getAll:       (params)    => api.get('/auditors', { params }),
  getById:      (id)        => api.get(`/auditors/${id}`),
  create:       (data)      => api.post('/auditors', data),
  update: (id, data) => {
    if (data instanceof FormData) {
      data.append('_method', 'PUT')
      return api.post(`/auditors/${id}`, data)
    }
    return api.put(`/auditors/${id}`, data)
  },
  toggleStatus: (id, status)=> api.put(`/auditors/${id}`, { is_active: status === 'aktif' }),
}