import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/auth/forgot-password', { email });
            navigate('/reset-password', { state: { email } });
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; background: #FADA5E; }

                .page {
                    min-height: 100vh;
                    display: flex; flex-direction: column;
                    background: #FADA5E;
                }
                .top-bar {
                    padding: 1.5rem 2.5rem;
                    display: flex; align-items: center;
                }
                .top-bar img { height: 40px; cursor: pointer; }
                .center {
                    flex: 1; display: flex;
                    align-items: center; justify-content: center;
                    padding: 2rem;
                }
                .card {
                    background: #fff; border-radius: 28px;
                    padding: 3rem 2.8rem; width: 100%; max-width: 440px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
                }
                .card-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 2rem; font-weight: 700; color: #111;
                    line-height: 1.1;
                    text-align: center;
                }
                .card-sub {
                    font-size: 0.88rem; color: #888;
                    margin-top: 0.5rem; line-height: 1.6;
                    text-align: center;
                }
                .field { margin-top: 2rem; }
                .field-label {
                    font-size: 0.88rem; font-weight: 500; color: #333;
                    margin-bottom: 0.5rem; display: block;
                }
                .field-input {
                    width: 100%; border: none; border-bottom: 2px solid #ddd;
                    padding: 0.6rem 0; font-family: 'DM Sans', sans-serif;
                    font-size: 0.95rem; color: #111; outline: none;
                    background: transparent; transition: border-color 0.2s;
                }
                .field-input:focus { border-color: #111; }
                .alert-error {
                    margin-top: 1.25rem; padding: 0.8rem 1rem;
                    background: #fef2f2; border: 1px solid #fecaca;
                    border-radius: 10px;
                    font-size: 0.83rem; color: #e74c3c;
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .alert-success {
                    margin-top: 1.25rem; padding: 0.8rem 1rem;
                    background: #f0fdf4; border: 1px solid #bbf7d0;
                    border-radius: 10px;
                    font-size: 0.83rem; color: #16a34a;
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .btn-submit {
                    width: 100%; margin-top: 2rem;
                    background: #111; color: #ffffff;
                    border: none; padding: 1rem;
                    border-radius: 999px; font-family: 'DM Sans', sans-serif;
                    font-size: 0.95rem; font-weight: 600; cursor: pointer;
                    transition: all 0.25s;
                }
                .btn-submit:hover:not(:disabled) { background: #333; transform: translateY(-1px); }
                .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
                .back-link {
                    display: block; text-align: center; margin-top: 1.25rem;
                    font-size: 0.85rem; color: #888; cursor: pointer;
                    transition: color 0.2s; text-decoration: none;
                }
                .back-link:hover { color: #111; }
                .footer-copy {
                    text-align: center; padding: 1.5rem;
                    font-size: 0.78rem; color: #888;
                }
            `}</style>

            <div className="page">
                <div className="top-bar">
                    <img src="/logo.png" alt="Picollo" onClick={() => navigate('/')} />
                </div>
                <div className="center">
                    <div className="card">
                        <div className="card-title">Lupa Password Ya?</div>
                        <div className="card-sub">Silahkan Ketik Emailmu!</div>

                        {error && (
                            <div className="alert-error">
                                <span>⚠️</span> {error}
                            </div>
                        )}
                        {success && (
                            <div className="alert-success">
                                <span>✅</span> {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="field">
                                <label className="field-label">Email</label>
                                <input
                                    type="email"
                                    className="field-input"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setError(''); }}
                                    placeholder="Email"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? 'Mengirim...' : 'Kirim'}
                            </button>
                        </form>

                        <span className="back-link" onClick={() => navigate('/login')}>
                            Sudah Ingat Password Akunmu? Klik Disini!
                        </span>
                    </div>
                </div>
                <div className="footer-copy">© Picollo</div>
            </div>
        </>
    );
};

export default ForgotPasswordPage;
