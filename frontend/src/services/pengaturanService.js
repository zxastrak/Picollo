import api from './api'
export const pengaturanService = {
  getProfile:     () => api.get('/auth/me'),
  updateProfile:  (data) => api.put('/user/profile', data),   // belum ada di backend
  updatePassword: (data) => api.put('/user/password', data),  // belum ada di backend
}