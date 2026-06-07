import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'

const RegisterPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        nama_bisnis: '',
    });
    const [show, setShow] = useState({ password: false, confirm: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const getError = (field) => {
        if (!errors[field]) return null;
        return Array.isArray(errors[field]) ? errors[field][0] : errors[field];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.password_confirmation) {
            setErrors({ password_confirmation: 'Password dan konfirmasi tidak sama.' });
            return;
        }
        setLoading(true);
        setError('');
        setErrors({});
        try {
            await api.post('/auth/register', form);
            navigate('/verify-email', { state: { email: form.email } });
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    };

    const EyeIcon = ({ show }) => show ? (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
        </svg>
    ) : (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; background: #FADA5E; }

                .page { min-height: 100vh; background: #FADA5E; display: flex; flex-direction: column; }

                /* MOBILE: single column */
                .layout {
                    flex: 1; display: flex; flex-direction: column;
                }
                .left-panel {
                    background: #FADA5E;
                    padding: 1.25rem 1.5rem 0;
                    display: flex; align-items: center; gap: 1rem;
                    <span className="left-footer">© Picollo</span>
                }
                .left-panel img { height: 28px; cursor: pointer; }
                .left-tagline { display: none; } /* hidden on mobile */

                .right-panel {
                    flex: 1; background: #fff;
                    border-radius: 28px 0 0 28px;
                    margin-top: 0; padding: 3rem 3.5rem;
                    display: flex; flex-direction: column;
                    justify-content: center;
                    overflow-y: auto;
                    animation: slideInRight 0.5s ease both;
                }

                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(60px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .card-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 2rem; font-weight: 800;
                    color: #111; text-align: center;
                }
                .card-sub {
                    font-size: 0.82rem; color: #888;
                    text-align: center; margin-top: 0.25rem;
                }
                .alert-error {
                    margin-top: 1rem; padding: 0.75rem 1rem;
                    background: #fef2f2; border: 1px solid #fecaca;
                    border-radius: 12px; font-size: 0.82rem; color: #e74c3c;
                    display: flex; align-items: flex-start; gap: 0.5rem;
                }
                .field { margin-top: 1.25rem; }
                .field-label {
                    font-size: 0.88rem; font-weight: 500;
                    color: #333; margin-bottom: 0.35rem; display: block;
                }
                .field-wrap { position: relative; }
                .field-input {
                    width: 100%; border: none;
                    border-bottom: 2px solid #e0e0e0;
                    padding: 0.65rem 2.5rem 0.65rem 0;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 1rem; color: #111;
                    outline: none; background: transparent;
                    transition: border-color 0.2s;
                    -webkit-appearance: none;
                }
                .field-input:focus { border-color: #111; }
                .field-input.err { border-color: #e74c3c; }
                .field-error { font-size: 0.78rem; color: #e74c3c; margin-top: 0.3rem; }
                .eye-btn {
                    position: absolute; right: 0;
                    top: 50%; transform: translateY(-50%);
                    background: none; border: none;
                    cursor: pointer; color: #bbb;
                    display: flex; padding: 8px;
                    -webkit-tap-highlight-color: transparent;
                }
                .eye-btn:hover { color: #111; }

                .btn-daftar {
                    width: 100%; margin-top: 1.75rem;
                    background: #e74c3c; color: #fff;
                    border: none; padding: 1rem;
                    border-radius: 999px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 1rem; font-weight: 600;
                    cursor: pointer; transition: all 0.25s;
                    min-height: 52px;
                    -webkit-tap-highlight-color: transparent;
                }
                .btn-daftar:hover:not(:disabled) { background: #c0392b; }
                .btn-daftar:active:not(:disabled) { transform: scale(0.98); }
                .btn-daftar:disabled { opacity: 0.5; cursor: not-allowed; }

                .login-link {
                    display: block; text-align: center;
                    margin-top: 1rem; font-size: 0.85rem; color: #888;
                    cursor: pointer; -webkit-tap-highlight-color: transparent;
                }
                .login-link:hover { color: #111; }

                .footer-copy {
                    text-align: center; padding: 1.25rem;
                    font-size: 0.78rem; color: #888;
                    background: #fff;
                }

                /* TABLET & DESKTOP: two column */
                @media (min-width: 768px) {
                    .layout { flex-direction: row; min-height: 100vh; }

                    .left-panel {
                        width: 42%; flex-direction: column;
                        align-items: flex-start; justify-content: space-between;
                        padding: 2.5rem 3rem;
                    }
                    .left-panel img { height: 40px; }
                    .left-tagline {
                        display: block;
                    }
                    .left-tagline h2 {
                        font-family: 'Syne', sans-serif;
                        font-size: 2.2rem; font-weight: 800;
                        color: #111; line-height: 1.2;
                    }
                    .left-tagline p {
                        font-size: 0.88rem; color: #666;
                        margin-top: 0.75rem; line-height: 1.7;
                        max-width: 300px;
                    }
                    .left-footer {
                        font-size: 0.78rem; 
                        color: #999;
                        width: 100%;
                        text-align: center;
                    }

                    .right-panel {
                        flex: 1; background: #fff;
                        border-radius: 28px 0 0 28px;
                        margin-top: 0; padding: 3rem 3.5rem;
                        display: flex; flex-direction: column;
                        justify-content: center;
                        overflow-y: auto;
                        animation: slideInRight 0.5s ease both;
                    }

                    .card-title { font-size: 2rem; text-align: left; }
                    .card-sub { text-align: left; }
                    .footer-copy { display: none; }
                    }

                    .field-hint {
                        font-size: 0.75rem; color: #aaa;
                        margin-top: 0.35rem;
                    }

            `}</style>

            <div className="page">
                <div className="layout">
                    {/* LEFT */}
                    <div className="left-panel">
                        <img src="/logo.png" alt="Picollo" onClick={() => navigate('/')} />
                        <div className="left-tagline">
                            <h2>Pantau semua bisnis outlet Anda dari satu platform</h2>
                            <p>Laporan otomatis, deteksi fraud, dan verifikasi blockchain untuk bisnis outlet skala menengah</p>
                        </div>
                        <span className="left-footer">© Picollo</span>
                    </div>

                    {/* RIGHT */}
                    <div className="right-panel">
                        <div className="card-title" style={{ textAlign: 'center' }}>Registrasi Akun</div>
                        <div className="card-sub" style={{ textAlign: 'center' }}>Daftarkan Akun Bisnis Outletmu di Picollo!</div>

                        {error && (
                            <div className="alert-error">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="field">
                                <label className="field-label">Nama Lengkap</label>
                                <input
                                    type="text" name="name"
                                    className={`field-input ${getError('name') ? 'err' : ''}`}
                                    value={form.name} onChange={handleChange}
                                    autoComplete="name" required
                                />
                                {getError('name') && <div className="field-error">{getError('name')}</div>}
                            </div>

                            <div className="field">
                                <label className="field-label">Email</label>
                                <input
                                    type="email" name="email"
                                    className={`field-input ${getError('email') ? 'err' : ''}`}
                                    value={form.email} onChange={handleChange}
                                    placeholder='Email'
                                    autoComplete="email" required
                                />
                                {getError('email') && <div className="field-error">{getError('email')}</div>}
                            </div>

                            <div className="field">
                                <label className="field-label">Password</label>
                                <div className="field-wrap">
                                    <input
                                        type={show.password ? 'text' : 'password'}
                                        name="password"
                                        className={`field-input ${getError('password') ? 'err' : ''}`}
                                        value={form.password} onChange={handleChange}
                                        placeholder='Password'
                                        autoComplete="new-password" required
                                    />
                                    <button type="button" className="eye-btn"
                                        onClick={() => setShow(s => ({ ...s, password: !s.password }))}>
                                        <EyeIcon show={show.password} />
                                    </button>
                                </div>
                                <div className="field-hint">Min. 8 karakter (huruf besar, kecil, angka, simbol)</div>
                                {getError('password') && <div className="field-error">{getError('password')}</div>}
                            </div>

                            <div className="field">
                                <label className="field-label">Konfirmasi Password</label>
                                <div className="field-wrap">
                                    <input
                                        type={show.confirm ? 'text' : 'password'}
                                        name="password_confirmation"
                                        className={`field-input ${getError('password_confirmation') ? 'err' : ''}`}
                                        value={form.password_confirmation} onChange={handleChange}
                                        placeholder='Konfirmasi Password'
                                        autoComplete="new-password" required
                                    />
                                    <button type="button" className="eye-btn"
                                        onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}>
                                        <EyeIcon show={show.confirm} />
                                    </button>
                                </div>
                                {getError('password_confirmation') && <div className="field-error">{getError('password_confirmation')}</div>}
                            </div>

                            <div className="field">
                                <label className="field-label">Nama Outlet Pertamamu!</label>
                                <input
                                    type="text" name="nama_bisnis"
                                    className={`field-input ${getError('nama_bisnis') ? 'err' : ''}`}
                                    value={form.nama_bisnis} onChange={handleChange}
                                    placeholder="Contoh: Warung Ayam Goreng" required
                                />
                                {getError('nama_bisnis') && <div className="field-error">{getError('nama_bisnis')}</div>}
                            </div>

                            <button type="submit" className="btn-daftar" disabled={loading}>
                                {loading ? 'Mendaftarkan...' : 'Daftar'}
                            </button>

                            <span className="login-link" onClick={() => navigate('/login')}>
                                Sudah Punya Akun? Klik Disini!
                            </span>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RegisterPage;