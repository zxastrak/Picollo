import api from './api'
export const logKoreksiService = {
  getAll:   (params) => api.get('/correction-logs', { params }),
  getById:  (id)     => api.get(`/correction-logs/${id}`),
  create:   (data)   => api.post('/correction-logs', data),
  approve:  (id)     => api.patch(`/correction-logs/${id}/approve`),
}