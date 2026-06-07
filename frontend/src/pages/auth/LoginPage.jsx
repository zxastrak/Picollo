import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api'
import useAuthStore from '../../store/authStore';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setAuth } = useAuthStore();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const justRegistered = location.state?.registered === true;

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', form);
            let { user, token } = res.data.data;

            // FIX: Set Auth di store dulu supaya interceptor api pakai token baru
            setAuth(user, token, []);

            let outlets = [];
            try {
                // Sekarang api.get akan otomatis pakai token baru karena sudah di setAuth
                const meRes = await api.get('/auth/me');
                const fullUser = meRes.data.data;
                user = { ...user, ...fullUser };
                outlets = fullUser?.outlets || [];
                setAuth(user, token, outlets); // Update dengan data lengkap
            } catch { /* biarkan default kalau gagal */ }

            const dest =
                user.role === 'admin'   ? '/admin/dashboard'   :
                user.role === 'kasir'   ? '/kasir/dashboard'   :
                user.role === 'auditor' ? '/auditor/dashboard' : '/login';

            setTimeout(() => navigate(dest, { replace: true }), 0);
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.requires_verification) {
                navigate('/verify-email', { state: { email: form.email, message: err.response.data.message } });
            } else {
                setError(err.response?.data?.message || 'Email atau password salah.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; background: #FADA5E; min-height: 100vh; }

                .page {
                    min-height: 100vh;
                    background: #FADA5E;
                    display: flex; flex-direction: column;
                }
                .top-bar {
                    padding: 1.25rem 1.5rem;
                    display: flex; align-items: center;
                }
                .top-bar img { height: 40px; cursor: pointer; }

                .center {
                    flex: 1; display: flex;
                    align-items: center; justify-content: center;
                    padding: 1rem 1.25rem 2rem;
                }
                .card {
                    background: #fff;
                    border-radius: 28px;
                    padding: 2.25rem 1.75rem;
                    width: 100%; max-width: 420px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
                }
                .card-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 2rem; font-weight: 700;
                    color: #111; line-height: 1.3;
                    text-align: center;
                }
                .card-sub {
                    font-size: 0.85rem; color: #888;
                    margin-top: 0.35rem; line-height: 1.5;
                    text-align: center;
                }
                .alert-error {
                    margin-top: 1.25rem;
                    padding: 0.75rem 1rem;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 12px;
                    font-size: 0.82rem; color: #e74c3c;
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .field { margin-top: 1.5rem; }
                .field-label {
                    font-size: 0.88rem; font-weight: 500;
                    color: #333; margin-bottom: 0.4rem; display: block;
                }
                .field-wrap { position: relative; }
                .field-input {
                    width: 100%; border: none;
                    border-bottom: 2px solid #e0e0e0;
                    padding: 0.65rem 2.5rem 0.65rem 0;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 1rem; /* min 16px supaya HP tidak zoom */
                    color: #111; outline: none;
                    background: transparent;
                    transition: border-color 0.2s;
                    -webkit-appearance: none;
                }
                .field-input:focus { border-color: #111; }
                .eye-btn {
                    position: absolute; right: 0;
                    top: 50%; transform: translateY(-50%);
                    background: none; border: none;
                    cursor: pointer; color: #bbb;
                    display: flex; padding: 8px;
                    transition: color 0.2s;
                    -webkit-tap-highlight-color: transparent;
                }
                .eye-btn:hover { color: #111; }

                .forgot-link {
                    display: block; text-align: right;
                    margin-top: 0.5rem;
                    font-size: 0.82rem; color: #888;
                    cursor: pointer; text-decoration: none;
                    -webkit-tap-highlight-color: transparent;
                }
                .forgot-link:hover { color: #e74c3c; }

                .btn-masuk {
                    width: 100%; margin-top: 1.75rem;
                    background: #111; color: #ffffff;
                    border: none; padding: 1rem;
                    border-radius: 999px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 1rem; font-weight: 600;
                    cursor: pointer; transition: all 0.25s;
                    min-height: 52px;
                    -webkit-tap-highlight-color: transparent;
                }
                .btn-masuk:hover:not(:disabled) { background: #333; }
                .btn-masuk:active:not(:disabled) { transform: scale(0.98); }
                .btn-masuk:disabled { opacity: 0.5; cursor: not-allowed; }

                .btn-daftar {
                    width: 100%; margin-top: 0.75rem;
                    background: #e74c3c; color: #fff;
                    border: none; padding: 1rem;
                    border-radius: 999px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 1rem; font-weight: 600;
                    cursor: pointer; transition: all 0.25s;
                    min-height: 52px;
                    -webkit-tap-highlight-color: transparent;
                }
                .btn-daftar:hover { background: #c0392b; }
                .btn-daftar:active { transform: scale(0.98); }

                .footer-copy {
                    text-align: center; padding: 1.25rem;
                    font-size: 0.78rem; color: #888;
                }

                /* Tablet ke atas */
                @media (min-width: 640px) {
                    .top-bar { padding: 1.5rem 2.5rem; }
                    .card { padding: 3rem 2.8rem; }
                    .card-title { font-size: 2rem; }
                }
                input[type="password"]::-ms-reveal,
                    input[type="password"]::-ms-clear,
                    input[type="password"]::-webkit-credentials-auto-fill-button { 
                        display: none; 
                    }
            `}</style>

            <div className="page">
                <div className="top-bar">
                    <img src="/logo.png" alt="Picollo" onClick={() => navigate('/')} />
                </div>

                <div className="center">
                    <div className="card">
                        <div className="card-title">Selamat Datang!</div>
                        <div className="card-sub">Masuk Untuk Melanjutkan</div>

                        {justRegistered && (
                            <div className="alert-error" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>
                                <span>✅</span> Registrasi berhasil! Silakan masuk dengan akun Anda.
                            </div>
                        )}

                        {error && (
                            <div className="alert-error">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="field">
                                <label className="field-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="field-input"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Email"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="field">
                                <label className="field-label">Password</label>
                                <div className="field-wrap">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        className="field-input"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Password"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="eye-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <span className="forgot-link" onClick={() => navigate('/forgot-password')}>
                                    Lupa Password?
                                </span>
                            </div>

                            <button type="submit" className="btn-masuk" disabled={loading}>
                                {loading ? 'Masuk...' : 'Masuk'}
                            </button>
                            <button type="button" className="btn-daftar" onClick={() => navigate('/register')}>
                                Daftar Akunmu
                            </button>
                        </form>
                    </div>
                </div>

                <div className="footer-copy">© Picollo</div>
            </div>
        </>
    );
};

export default LoginPage;