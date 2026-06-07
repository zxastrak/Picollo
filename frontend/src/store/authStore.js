import { create } from 'zustand';

const useAuthStore = create((set) => ({
    user:    JSON.parse(localStorage.getItem('user'))    || null,
    token:   localStorage.getItem('token')               || null,
    outlets: JSON.parse(localStorage.getItem('outlets')) || [],
    activeOutletId: localStorage.getItem('activeOutletId') || '',

    setAuth: (user, token, outlets = []) => {
        localStorage.setItem('user',    JSON.stringify(user));
        localStorage.setItem('token',   token);
        localStorage.setItem('outlets', JSON.stringify(outlets));
        localStorage.setItem('activeOutletId', ''); // default kosong = Semua Outlet
        set({ user, token, outlets, activeOutletId: '' });
    },

    setActiveOutletId: (outletId) => {
        localStorage.setItem('activeOutletId', outletId);
        set({ activeOutletId: outletId });
    },

    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
    },

    // Kalau perlu update outlets saja (misal setelah tambah outlet baru)
    setOutlets: (outlets) => {
        localStorage.setItem('outlets', JSON.stringify(outlets));
        set({ outlets });
    },

    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('outlets');
        localStorage.removeItem('activeOutletId');
        set({ user: null, token: null, outlets: [], activeOutletId: '' });
    },

    clearAuth: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('outlets');
        localStorage.removeItem('activeOutletId');
        set({ user: null, token: null, outlets: [], activeOutletId: '' });
    },
}));

export default useAuthStore;