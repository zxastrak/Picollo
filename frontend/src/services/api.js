import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
    headers: {
        'Accept': 'application/json',
    },
});

// Auto attach token ke setiap request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle response error global
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Jangan redirect ke /login jika error 401 berasal dari endpoint login itu sendiri
        const isLoginRequest = error.config?.url?.includes('/auth/login');
        if (error.response?.status === 401 && !isLoginRequest) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('outlets');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;