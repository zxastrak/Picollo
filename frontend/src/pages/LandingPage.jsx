import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Shield, Store, Users, ClipboardCheck, TrendingUp, Mail, Phone } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const heroRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        setMenuOpen(false);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                html { scroll-behavior: smooth; }
                body { font-family: 'DM Sans', sans-serif; background: #FADA5E; color: #111; overflow-x: hidden; }

                /* NAVBAR */
                .nav {
                    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0.5rem 4rem;
                    transition: all 0.3s ease;
                }
                .nav.scrolled {
                    background: rgba(250, 218, 94, 0.92);
                    backdrop-filter: blur(12px);
                    box-shadow: 0 2px 20px rgba(0,0,0,0.08);
                    padding: 0.5rem 4rem;
                }
                .nav-logo img { height: 40px; cursor: pointer; }
                .nav-links { display: flex; align-items: center; gap: 2.5rem; }
                .nav-link {
                    font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 500;
                    color: #111; text-decoration: none; cursor: pointer;
                    transition: opacity 0.2s;
                }
                .nav-link:hover { opacity: 0.6; }
                .nav-btns { display: flex; gap: 0.75rem; }
                .btn-outline {
                    background: transparent; border: 2px solid #111;
                    color: #111; padding: 0.55rem 1.4rem;
                    border-radius: 999px; font-family: 'DM Sans', sans-serif;
                    font-size: 0.88rem; font-weight: 500; cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-outline:hover { background: #111; color: #FADA5E; }
                .btn-solid {
                    background: #111; border: 2px solid #111;
                    color: #FADA5E; padding: 0.55rem 1.4rem;
                    border-radius: 999px; font-family: 'DM Sans', sans-serif;
                    font-size: 0.88rem; font-weight: 500; cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-solid:hover { background: #333; border-color: #333; }

                /* HERO */
                .hero {
                    min-height: 100vh;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    text-align: center;
                    padding: 8rem 2rem 4rem;
                    position: relative; overflow: hidden;
                }
                .hero-badge {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    background: #111; color: #FADA5E;
                    padding: 0.4rem 1rem; border-radius: 999px;
                    font-size: 0.78rem; font-weight: 500; letter-spacing: 0.06em;
                    margin-bottom: 2rem;
                    animation: fadeUp 0.6s ease both;
                }
                .hero-badge-dot {
                    width: 6px; height: 6px; background: #FADA5E;
                    border-radius: 50%; animation: pulse 1.5s ease infinite;
                }
                .hero-title {
                    font-family: 'Syne', sans-serif;
                    font-size: clamp(3rem, 7vw, 6.5rem);
                    font-weight: 800; line-height: 1.05;
                    color: #111; letter-spacing: -0.02em;
                    max-width: 900px;
                    animation: fadeUp 0.6s 0.1s ease both;
                }
                .hero-title .highlight {
                    position: relative; display: inline-block;
                }
                .hero-title .highlight::after {
                    content: '';
                    position: absolute; bottom: 4px; left: 0; right: 0;
                    height: 6px; background: #e74c3c;
                    border-radius: 4px; z-index: -1;
                    transform: scaleX(0); transform-origin: left;
                    animation: underlineIn 0.5s 0.8s ease forwards;
                }
                .hero-sub {
                    font-size: 1.1rem; font-weight: 300; color: #444;
                    max-width: 520px; line-height: 1.7; margin-top: 1.5rem;
                    animation: fadeUp 0.6s 0.2s ease both;
                }
                .hero-cta {
                    display: flex; gap: 1rem; margin-top: 2.5rem;
                    animation: fadeUp 0.6s 0.3s ease both;
                }
                .btn-hero-primary {
                    background: #111; color: #FADA5E;
                    border: none; padding: 1rem 2.2rem;
                    border-radius: 999px; font-family: 'DM Sans', sans-serif;
                    font-size: 1rem; font-weight: 500; cursor: pointer;
                    transition: all 0.25s; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                }
                .btn-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.2); background: #222; }
                .btn-hero-secondary {
                    background: transparent; color: #111;
                    border: 2px solid #111; padding: 1rem 2.2rem;
                    border-radius: 999px; font-family: 'DM Sans', sans-serif;
                    font-size: 1rem; font-weight: 500; cursor: pointer;
                    transition: all 0.25s;
                }
                .btn-hero-secondary:hover { background: #111; color: #FADA5E; }

                .hero-stats {
                    display: flex; gap: 3rem; margin-top: 4rem;
                    animation: fadeUp 0.6s 0.4s ease both;
                }
                .hero-stat { text-align: center; }
                .hero-stat-num {
                    font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; color: #111;
                }
                .hero-stat-label { font-size: 0.8rem; color: #666; font-weight: 400; margin-top: 2px; }

                .hero-scroll {
                    position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
                    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
                    animation: fadeUp 0.6s 0.6s ease both;
                    cursor: pointer;
                }
                .hero-scroll-text { font-size: 0.75rem; color: #888; letter-spacing: 0.1em; }
                .hero-scroll-arrow {
                    width: 24px; height: 24px;
                    border-right: 2px solid #888; border-bottom: 2px solid #888;
                    transform: rotate(45deg);
                    animation: bounce 1.5s ease infinite;
                }

                /* MARQUEE */
                .marquee-wrap {
                    background: #111; color: #FADA5E;
                    padding: 1rem 0; overflow: hidden;
                    border-top: 2px solid #111; border-bottom: 2px solid #111;
                }
                .marquee-track {
                    display: flex; gap: 3rem;
                    animation: marquee 20s linear infinite;
                    white-space: nowrap;
                }
                .marquee-item {
                    font-family: 'Syne', sans-serif; font-size: 0.85rem;
                    font-weight: 700; letter-spacing: 0.1em;
                    display: flex; align-items: center; gap: 1rem;
                }
                .marquee-dot { color: #e74c3c; font-size: 1.2rem; }

                /* FEATURES */
                .section { padding: 6rem 4rem; }
                .section-label {
                    font-size: 0.78rem; font-weight: 500; letter-spacing: 0.12em;
                    color: #888; text-transform: uppercase; margin-bottom: 1rem;
                }
                .section-title {
                    font-family: 'Syne', sans-serif; font-size: clamp(2rem, 4vw, 3rem);
                    font-weight: 800; color: #111; line-height: 1.15;
                    max-width: 600px;
                }

                .features-grid {
                    display: grid; grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem; margin-top: 3rem;
                }
                .feature-card,
                .feature-card.light,
                .feature-card.red {
                    background: #111; color: #FADA5E;
                    border-radius: 20px; padding: 2.5rem;
                    transition: transform 0.3s ease;
                    border: none;
                }
                .feature-card:hover { transform: translateY(-6px); }
                .feature-title {
                    font-family: 'Syne', sans-serif; font-size: 1.3rem;
                    font-weight: 700; margin-bottom: 0.75rem;
                    color: #FADA5E;
                }
                .feature-desc { font-size: 0.9rem; line-height: 1.7; opacity: 0.8; color: #FADA5E; }
                /* ABOUT */
                .about-wrap {
                    display: grid; grid-template-columns: 1fr 1fr;
                    gap: 5rem; align-items: center;
                }
                .about-visual {
                    background: #111; border-radius: 24px;
                    aspect-ratio: 1; display: flex; align-items: center;
                    justify-content: center; position: relative; overflow: hidden;
                }
                .about-visual-inner {
                    font-family: 'Syne', sans-serif; font-size: 5rem;
                    font-weight: 800; color: #FADA5E; text-align: center;
                    line-height: 1;
                }
                .about-visual-sub {
                    font-size: 0.75rem; color: #FADA5E; opacity: 0.5;
                    letter-spacing: 0.2em; text-align: center; margin-top: 0.5rem;
                }
                .about-content { }
                .about-desc {
                    font-size: 1rem; line-height: 1.8; color: #444;
                    margin-top: 1.5rem; margin-bottom: 2rem;
                }
                .about-pills { display: flex; flex-wrap: wrap; gap: 0.75rem; }
                .pill {
                    background: #111; color: #FADA5E;
                    padding: 0.4rem 1.1rem; border-radius: 999px;
                    font-size: 0.82rem; font-weight: 500;
                }

                /* CONTACT */
                .contact-wrap {
                    background: #111; border-radius: 28px;
                    padding: 4rem; display: flex;
                    align-items: center; justify-content: space-between;
                    gap: 3rem;
                }
                .contact-left { }
                .contact-title {
                    font-family: 'Syne', sans-serif; font-size: 2.2rem;
                    font-weight: 800; color: #FADA5E; line-height: 1.2;
                }
                .contact-sub {
                    font-size: 0.95rem; color: #888; margin-top: 0.75rem;
                    line-height: 1.6;
                }
                .contact-info { display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem; }
                .contact-item {
                    display: flex; align-items: center; gap: 0.75rem;
                }
                .contact-icon {
                    width: 40px; height: 40px; background: #FADA5E;
                    border-radius: 10px; display: flex; align-items: center;
                    justify-content: center; font-size: 1.1rem; flex-shrink: 0;
                }
                .contact-text { color: #ccc; font-size: 0.9rem; }
                .contact-right { flex-shrink: 0; }
                .btn-contact {
                    background: #FADA5E; color: #111;
                    border: none; padding: 1.1rem 2.5rem;
                    border-radius: 999px; font-family: 'DM Sans', sans-serif;
                    font-size: 1rem; font-weight: 600; cursor: pointer;
                    transition: all 0.25s; display: block; white-space: nowrap;
                }
                .btn-contact:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(250,218,94,0.3); }

                /* FOOTER */
                .footer {
                    padding: 2rem 4rem;
                    display: flex; align-items: center; justify-content: center;
                    border-top: 1px solid rgba(0,0,0,0.1);
                }
                .footer-copy { font-size: 0.82rem; color: #888; }

                /* ANIMATIONS */
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes underlineIn {
                    to { transform: scaleX(1); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                @keyframes bounce {
                    0%, 100% { transform: rotate(45deg) translateY(0); }
                    50% { transform: rotate(45deg) translateY(6px); }
                }
                @keyframes marquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }

                @media (max-width: 768px) {
                    /* NAVBAR */
                    .nav { padding: 1rem 1.25rem; }
                    .nav.scrolled { padding: 0.75rem 1.25rem; }
                    .nav-links { display: none; }
                    .btn-outline { padding: 0.45rem 1rem; font-size: 0.82rem; }
                    .btn-solid { padding: 0.45rem 1rem; font-size: 0.82rem; }

                    /* HERO */
                    .hero { padding: 7rem 1.25rem 3rem; }
                    .hero-badge { font-size: 0.72rem; padding: 0.35rem 0.85rem; text-align: center; }
                    .hero-sub { font-size: 0.95rem; margin-top: 1rem; }
                    .hero-cta { flex-direction: column; align-items: stretch; }
                    .btn-hero-primary { text-align: center; padding: 0.9rem 1.5rem; }
                    .btn-hero-secondary { text-align: center; padding: 0.9rem 1.5rem; }
                    .hero-stats { gap: 1.25rem; flex-wrap: wrap; justify-content: center; margin-top: 2.5rem; }
                    .hero-stat-num { font-size: 1.5rem; }
                    .hero-scroll { display: none; }

                    /* SECTIONS */
                    .section { padding: 3.5rem 1.25rem; }
                    .section-title { font-size: 1.6rem; }

                    /* FEATURES */
                    .features-grid { grid-template-columns: 1fr; gap: 1rem; margin-top: 2rem; }
                    .feature-card { padding: 1.75rem; }

                    /* ABOUT */
                    .about-wrap { grid-template-columns: 1fr; gap: 2rem; }
                    .about-visual { aspect-ratio: 16/9; border-radius: 16px; }
                    .about-visual-inner { font-size: 3rem; }

                    /* CONTACT */
                    .contact-wrap { flex-direction: column; padding: 2rem 1.5rem; border-radius: 20px; }
                    .contact-title { font-size: 1.6rem; }
                    .contact-right { width: 100%; }
                    .btn-contact { width: 100%; text-align: center; padding: 0.9rem 1.5rem; }

                    /* FOOTER */
                    .footer { flex-direction: column; gap: 0.5rem; text-align: center; padding: 1.5rem; }
                }
            `}</style>

            {/* NAVBAR */}
            <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-logo">
                    <img src="/logo.png" alt="Picollo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
                </div>
                <div className="nav-links">
                    <span className="nav-link" onClick={() => scrollTo('fitur')}>Fitur</span>
                    <span className="nav-link" onClick={() => scrollTo('about')}>Tentang</span>
                    <span className="nav-link" onClick={() => scrollTo('contact')}>Kontak</span>
                </div>
                <div className="nav-btns">
                    <button className="btn-outline" onClick={() => navigate('/login')}>Log in</button>
                    <button className="btn-solid" onClick={() => navigate('/register')}>Registrasi</button>
                </div>
            </nav>

            {/* HERO */}
            <section className="hero" ref={heroRef}>
                <div className="hero-badge">
                    <span className="hero-badge-dot" />
                    Hash Chain SHA-256 · Keamanan Data Transaksi
                </div>
                <h1 className="hero-title">
                    Kelola Outlet<br />
                    Bisnis<span className="highlight">mu</span>,<br />
                    Lebih Mudah
                </h1>
                <p className="hero-sub">
                    Platform POS modern untuk bisnis outlet skala menengah. Laporan otomatis, deteksi anomali, dan integritas data yang terjamin.
                </p>
                <div className="hero-cta">
                    <button className="btn-hero-primary" onClick={() => navigate('/register')}>
                        Mulai Sekarang
                    </button>
                    <button className="btn-hero-secondary" onClick={() => scrollTo('fitur')}>
                        Pelajari Fitur
                    </button>
                </div>
                <div className="hero-stats">
                    <div className="hero-stat">
                        <div className="hero-stat-num">100%</div>
                        <div className="hero-stat-label">Data Terproteksi</div>
                    </div>
                    <div className="hero-stat">
                        <div className="hero-stat-num">SHA-256</div>
                        <div className="hero-stat-label">Enkripsi Hash Chain</div>
                    </div>
                    <div className="hero-stat">
                        <div className="hero-stat-num">Multi</div>
                        <div className="hero-stat-label">Outlet Support</div>
                    </div>
                </div>
            </section>

            {/* MARQUEE */}
            <div className="marquee-wrap">
                <div className="marquee-track">
                    {[...Array(2)].map((_, i) => (
                        ['LAPORAN OTOMATIS', 'HASH CHAIN', 'MULTI OUTLET', 'REAL-TIME', 'ANTI FRAUD', 'AUDIT LOG', 'KASIR DIGITAL', 'REKAP HARIAN'].map((text, j) => (
                            <span className="marquee-item" key={`${i}-${j}`}>
                                {text} <span className="marquee-dot">✦</span>
                            </span>
                        ))
                    ))}
                </div>
            </div>

            {/* FEATURES */}
            <section className="section" id="fitur">
                <div className="section-label">Fitur Unggulan</div>
                <h2 className="section-title">Semua yang kamu butuhkan, dalam satu platform</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon"><BarChart2 size={40} color="#FADA5E" /></div>
                        <div className="feature-title">Laporan Otomatis</div>
                        <div className="feature-desc">Rekap harian, mingguan, dan bulanan dibuat otomatis. Export PDF kapan saja dengan satu klik.</div>
                    </div>
                    <div className="feature-card light">
                        <div className="feature-icon"><Shield size={40} color="#ffffff" /></div>
                        <div className="feature-title">Hash Chain SHA-256</div>
                        <div className="feature-desc">Setiap transaksi terhubung dalam rantai hash yang tidak bisa dimanipulasi. Data kalian aman sepenuhnya.</div>
                    </div>
                    <div className="feature-card red">
                        <div className="feature-icon"><Store size={40} color="#FF6B6B" /></div>
                        <div className="feature-title">Multi Outlet</div>
                        <div className="feature-desc">Kelola banyak outlet dari satu dashboard. Pantau performa tiap cabang secara real-time.</div>
                    </div>
                    <div className="feature-card light">
                        <div className="feature-icon"><Users size={40} color="#C084FC" /></div>
                        <div className="feature-title">Manajemen Role</div>
                        <div className="feature-desc">Admin, Kasir, dan Auditor punya akses berbeda. Atur siapa bisa lihat apa dengan mudah.</div>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><ClipboardCheck size={40} color="#34D399" /></div>
                        <div className="feature-title">Audit & Koreksi</div>
                        <div className="feature-desc">Setiap perubahan tercatat di audit log. Koreksi transaksi butuh approval, tidak bisa sembarangan.</div>
                    </div>
                    <div className="feature-card light">
                        <div className="feature-icon"><TrendingUp size={40} color="#FBBF24" /></div>
                        <div className="feature-title">Estimasi Keuntungan</div>
                        <div className="feature-desc">Masukkan harga modal, sistem otomatis hitung estimasi keuntungan berdasarkan stok yang ada.</div>
                    </div>
                </div>
            </section>

            {/* ABOUT */}
            <section className="section" id="about">
                <div className="about-wrap">
                    <div className="about-visual">
                        <div>
                            <div className="about-visual-inner">
                                Pic<br />ollo
                            </div>
                            <div className="about-visual-sub">HASH · CHAIN · POWERED</div>
                        </div>
                    </div>
                    <div className="about-content">
                        <div className="section-label">Tentang Picollo</div>
                        <h2 className="section-title">Bukan sekadar aplikasi kasir</h2>
                        <p className="about-desc">
                            Picollo dirancang khusus untuk pemilik bisnis outlet yang ingin punya kontrol penuh atas operasional mereka. Dengan sistem hash chain SHA-256, setiap transaksi terjamin integritasnya, tidak ada yang bisa diubah tanpa jejak.
                        </p>
                        <p className="about-desc" style={{ marginTop: '-1rem' }}>
                            Dari kasir yang input transaksi, admin yang approve rekap, hingga auditor yang verifikasi data. Semua terintegrasi dalam satu sistem yang rapi dan aman.
                        </p>
                        <div className="about-pills">
                            <span className="pill">Laravel Backend</span>
                            <span className="pill">React Frontend</span>
                            <span className="pill">JWT Auth</span>
                            <span className="pill">SHA-256</span>
                            <span className="pill">MySQL</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* CONTACT */}
            <section className="section" id="contact">
                <div className="contact-wrap">
                    <div className="contact-left">
                        <div className="contact-title">
                            Tertarik pakai<br />Picollo untuk<br />bisnis kamu?
                        </div>
                        <div className="contact-sub">
                            Hubungi kami dan kami akan bantu setup sistem untuk bisnis outlet kamu.
                        </div>
                        <div className="contact-info">
                            <div className="contact-item">
                                <div className="contact-icon"><Mail size={20} color="#111" /></div>
                                <span className="contact-text">ocamania021@gmail.com</span>
                            </div>
                            <div className="contact-item">
                                <div className="contact-icon"><Phone size={20} color="#111"/></div>
                                <span className="contact-text">+62 813-9801-9501</span>
                            </div>
                        </div>
                    </div>
                    <div className="contact-right">
                        <button className="btn-contact" onClick={() => navigate('/register')}>
                            Daftar Sekarang
                        </button>
                        <button className="btn-contact" style={{ marginTop: '1rem', background: 'transparent', color: '#FADA5E', border: '2px solid #FADA5E' }}
                            onClick={() => navigate('/login')}>
                            Sudah punya akun? Masuk
                        </button>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="footer">
                <span className="footer-copy">© 2026 Picollo. All rights reserved.</span>
            </footer>
        </>
    );
};

export default LandingPage;
