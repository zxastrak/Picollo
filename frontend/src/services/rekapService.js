import api from './api'
export const rekapService = {
  getHarian:    (params) => api.get('/daily-recaps', { params }),
  kirimKeAdmin: (data) => api.post('/daily-recaps', data),
  approve:      (id)   => api.patch(`/daily-recaps/${id}/approve`),
}