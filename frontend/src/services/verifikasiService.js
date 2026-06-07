import api from './api'
export const verifikasiService = {
  verifyHash: (data)   => api.post('/hash-verifications/verify', data),
  getHistory: (params) => api.get('/hash-verifications', { params }),
  verifyChain:()       => api.post('/hash-verifications/verify-chain'),
  verifyByHash:(hash)  => api.post('/hash-verifications/verify-by-hash', { hash }),
}