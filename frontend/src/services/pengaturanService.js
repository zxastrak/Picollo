import api from './api'
export const pengaturanService = {
  getProfile:     () => api.get('/auth/me'),
  updateProfile:  (data) => api.post('/auth/profile', data), 
  updatePassword: (data) => api.post('/auth/password', data),
}