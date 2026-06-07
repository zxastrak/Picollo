import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api'

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const defaultEmail = location.state?.email || '';

    const [form, setForm] = useState({ email: defaultEmail, otp_code: '', password: '', password_confirmation: '' });
    const [show, setShow] = useState({ password: false, confirm: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleOtpChange = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length <= 6) {
            setForm({ ...form, otp_code: val });
        }
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.password_confirmation) {
            setError('Password dan konfirmasi password tidak sama.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/reset-password', form);
            setSuccess('Password berhasil direset! Silakan login dengan password baru.');
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            if (err.response?.data?.errors) {
                const firstError = Object.values(err.response.data.errors)[0][0];
                setError(firstError);
            } else {
                setError(err.response?.data?.message || 'Kode OTP tidak valid atau kadaluarsa.');
            }
        } finally {
            setLoading(false);
        }
    };

    const EyeIcon = ({ show }) => show ? (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
        </svg>
    ) : (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; background: #FADA5E; }

                .page { min-height: 100vh; display: flex; flex-direction: column; background: #FADA5E; }
                .top-bar { padding: 1.5rem 2.5rem; display: flex; align-items: center; }
                .top-bar img { height: 40px; cursor: pointer; }
                .center { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem; }
                .card {
                    background: #fff; border-radius: 28px;
                    padding: 3rem 2.8rem; width: 100%; max-width: 440px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
                }
                .card-title { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; color: #111; }
                .card-sub { font-size: 0.88rem; color: #888; margin-top: 0.5rem; }
                .field { margin-top: 1.75rem; }
                .field-label { font-size: 0.88rem; font-weight: 500; color: #333; margin-bottom: 0.5rem; display: block; }
                .field-wrap { position: relative; }
                .field-input {
                    width: 100%; border: none; border-bottom: 2px solid #ddd;
                    padding: 0.6rem 2.2rem 0.6rem 0;
                    font-family: 'DM Sans', sans-serif; font-size: 0.95rem;
                    color: #111; outline: none; background: transparent;
                    transition: border-color 0.2s;
                }
                .field-input:focus { border-color: #111; }
                .otp-input {
                    width: 100%; border: none; border-bottom: 2px solid #111;
                    padding: 0.6rem 0; font-family: 'DM Sans', sans-serif;
                    font-size: 1.5rem; font-weight: bold; color: #111; outline: none;
                    background: transparent; transition: border-color 0.2s;
                    text-align: center; letter-spacing: 1rem;
                }
                .eye-btn {
                    position: absolute; right: 0; top: 50%; transform: translateY(-50%);
                    background: none; border: none; cursor: pointer; color: #aaa;
                    display: flex; padding: 0; transition: color 0.2s;
                }
                .eye-btn:hover { color: #111; }
                .alert-error {
                    margin-top: 1.25rem; padding: 0.8rem 1rem;
                    background: #fef2f2; border: 1px solid #fecaca;
                    border-radius: 10px; font-size: 0.83rem; color: #e74c3c;
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .alert-success {
                    margin-top: 1.25rem; padding: 0.8rem 1rem;
                    background: #f0fdf4; border: 1px solid #bbf7d0;
                    border-radius: 10px; font-size: 0.83rem; color: #16a34a;
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .btn-submit {
                    width: 100%; margin-top: 2rem;
                    background: #111; color: #FADA5E;
                    border: none; padding: 1rem;
                    border-radius: 999px; font-family: 'DM Sans', sans-serif;
                    font-size: 0.95rem; font-weight: 600; cursor: pointer;
                    transition: all 0.25s;
                }
                .btn-submit:hover:not(:disabled) { background: #333; transform: translateY(-1px); }
                .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
                .footer-copy { text-align: center; padding: 1.5rem; font-size: 0.78rem; color: #888; }
            `}</style>

            <div className="page">
                <div className="top-bar">
                    <img src="/logo.png" alt="Picollo" onClick={() => navigate('/')} />
                </div>
                <div className="center">
                    <div className="card">
                        <div className="card-title">Reset Password</div>
                        <div className="card-sub">Silahkan masukkan OTP dan Password Baru.</div>

                        {error && <div className="alert-error"><span>⚠️</span> {error}</div>}
                        {success && <div className="alert-success"><span>✅</span> {success}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="field">
                                <label className="field-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="field-input"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    disabled={!!defaultEmail}
                                />
                            </div>

                            <div className="field">
                                <label className="field-label">Kode OTP</label>
                                <input
                                    type="text"
                                    name="otp_code"
                                    className="otp-input"
                                    value={form.otp_code}
                                    onChange={handleOtpChange}
                                    placeholder="••••••"
                                    required
                                />
                            </div>

                            <div className="field">
                                <label className="field-label">Password Baru</label>
                                <div className="field-wrap">
                                    <input
                                        type={show.password ? 'text' : 'password'}
                                        name="password"
                                        className="field-input"
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button type="button" className="eye-btn" onClick={() => setShow(s => ({ ...s, password: !s.password }))}>
                                        <EyeIcon show={show.password} />
                                    </button>
                                </div>
                            </div>

                            <div className="field">
                                <label className="field-label">Konfirmasi Password</label>
                                <div className="field-wrap">
                                    <input
                                        type={show.confirm ? 'text' : 'password'}
                                        name="password_confirmation"
                                        className="field-input"
                                        value={form.password_confirmation}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button type="button" className="eye-btn" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}>
                                        <EyeIcon show={show.confirm} />
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? 'Menyimpan...' : 'Simpan Password'}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="footer-copy">© Picollo</div>
            </div>
        </>
    );
};

export default ResetPasswordPage;
