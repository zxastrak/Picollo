import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Public
import LandingPage        from './pages/LandingPage';
import LoginPage          from './pages/auth/LoginPage';
import RegisterPage       from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from './pages/auth/ResetPasswordPage';
import VerifyEmailPage    from './pages/auth/VerifyEmailPage';

// Admin
import AdminDashboard  from "./pages/admin/AdminDashboard";
import AdminOutlet     from "./pages/admin/ManajemenOutlet";
import AdminProduk     from "./pages/admin/Produk";
import AdminTransaksi  from "./pages/admin/Transaksi";
import AdminLaporan    from "./pages/admin/Laporan";
import AdminVerifikasi from "./pages/admin/Verifikasi";
import AdminKasir      from "./pages/admin/ManajemenKasir";
import AdminAuditor    from "./pages/admin/ManajemenAuditor";
import AdminPengawasan from "./pages/admin/PengawasanKasir";
import AdminLogKoreksi from "./pages/admin/LogKoreksi";
import AdminPengaturan from "./pages/admin/Pengaturan";

// Kasir
import KasirDashboard from "./pages/kasir/KasirDashboard";
import KasirTransaksi from "./pages/kasir/Transaksi";
import KasirRekap     from "./pages/kasir/RekapHarian";

// Auditor
import AuditorDashboard  from "./pages/auditor/AuditorDashboard";
import AuditorTransaksi  from "./pages/auditor/Transaksi";
import AuditorLaporan    from "./pages/auditor/Laporan";
import AuditorVerifikasi from "./pages/auditor/Verifikasi";
import AuditorPengawasan from "./pages/auditor/PengawasanKasir";
import AuditorLogKoreksi from "./pages/auditor/LogKoreksi";

// Profil (Global)
import Profil from "./pages/Profil";

// Guard
function ProtectedRoute({ children, allowedRoles }) {
    const { user, token } = useAuthStore();
    if (!token || !user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

const AdminRoute   = ({ children }) => (
    <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
);
const KasirRoute   = ({ children }) => (
    <ProtectedRoute allowedRoles={['kasir']}>{children}</ProtectedRoute>
);
const AuditorRoute = ({ children }) => (
    <ProtectedRoute allowedRoles={['auditor']}>{children}</ProtectedRoute>
);

export default function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* ── Public ── */}
                <Route path="/"                element={<LandingPage />} />
                <Route path="/login"           element={<LoginPage />} />
                <Route path="/register"        element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password"  element={<ResetPasswordPage />} />
                <Route path="/verify-email"    element={<VerifyEmailPage />} />

                {/* ── Admin ── */}
                <Route path="/admin/dashboard"   element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/outlet"      element={<AdminRoute><AdminOutlet /></AdminRoute>} />
                <Route path="/admin/produk"      element={<AdminRoute><AdminProduk /></AdminRoute>} />
                <Route path="/admin/transaksi"   element={<AdminRoute><AdminTransaksi /></AdminRoute>} />
                <Route path="/admin/laporan"     element={<AdminRoute><AdminLaporan /></AdminRoute>} />
                <Route path="/admin/verifikasi"  element={<AdminRoute><AdminVerifikasi /></AdminRoute>} />
                <Route path="/admin/kasir"       element={<AdminRoute><AdminKasir /></AdminRoute>} />
                <Route path="/admin/auditor"     element={<AdminRoute><AdminAuditor /></AdminRoute>} />
                <Route path="/admin/pengawasan"  element={<AdminRoute><AdminPengawasan /></AdminRoute>} />
                <Route path="/admin/log-koreksi" element={<AdminRoute><AdminLogKoreksi /></AdminRoute>} />
                <Route path="/admin/pengaturan"  element={<AdminRoute><AdminPengaturan /></AdminRoute>} />

                {/* ── Kasir ── */}
                <Route path="/kasir/dashboard" element={<KasirRoute><KasirDashboard /></KasirRoute>} />
                <Route path="/kasir/transaksi" element={<KasirRoute><KasirTransaksi /></KasirRoute>} />
                <Route path="/kasir/rekap"     element={<KasirRoute><KasirRekap /></KasirRoute>} />

                {/* ── Auditor ── */}
                <Route path="/auditor/dashboard"   element={<AuditorRoute><AuditorDashboard /></AuditorRoute>} />
                <Route path="/auditor/transaksi"   element={<AuditorRoute><AuditorTransaksi /></AuditorRoute>} />
                <Route path="/auditor/laporan"     element={<AuditorRoute><AuditorLaporan /></AuditorRoute>} />
                <Route path="/auditor/verifikasi"  element={<AuditorRoute><AuditorVerifikasi /></AuditorRoute>} />
                <Route path="/auditor/pengawasan"  element={<AuditorRoute><AuditorPengawasan /></AuditorRoute>} />
                <Route path="/auditor/log-koreksi" element={<AuditorRoute><AuditorLogKoreksi /></AuditorRoute>} />

                {/* ── Admin Profil ── */}
                <Route path="/profil" element={<AdminRoute><Profil /></AdminRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </BrowserRouter>
    );
}
