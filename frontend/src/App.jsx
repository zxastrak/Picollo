import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import useAuthStore from './store/authStore';
import LoadingSpinner from './components/LoadingSpinner';

// Public
const LandingPage        = lazy(() => import('./pages/LandingPage'));
const LoginPage          = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage    = lazy(() => import('./pages/auth/VerifyEmailPage'));

// Admin
const AdminDashboard  = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOutlet     = lazy(() => import("./pages/admin/ManajemenOutlet"));
const AdminProduk     = lazy(() => import("./pages/admin/Produk"));
const AdminTransaksi  = lazy(() => import("./pages/admin/Transaksi"));
const AdminLaporan    = lazy(() => import("./pages/admin/Laporan"));
const AdminVerifikasi = lazy(() => import("./pages/admin/Verifikasi"));
const AdminKasir      = lazy(() => import("./pages/admin/ManajemenKasir"));
const AdminAuditor    = lazy(() => import("./pages/admin/ManajemenAuditor"));
const AdminPengawasan = lazy(() => import("./pages/admin/PengawasanKasir"));
const AdminLogKoreksi = lazy(() => import("./pages/admin/LogKoreksi"));
const AdminPengaturan = lazy(() => import("./pages/admin/Pengaturan"));

// Kasir
const KasirDashboard = lazy(() => import("./pages/kasir/KasirDashboard"));
const KasirTransaksi = lazy(() => import("./pages/kasir/Transaksi"));
const KasirRekap     = lazy(() => import("./pages/kasir/RekapHarian"));

// Auditor
const AuditorDashboard  = lazy(() => import("./pages/auditor/AuditorDashboard"));
const AuditorTransaksi  = lazy(() => import("./pages/auditor/Transaksi"));
const AuditorLaporan    = lazy(() => import("./pages/auditor/Laporan"));
const AuditorVerifikasi = lazy(() => import("./pages/auditor/Verifikasi"));
const AuditorPengawasan = lazy(() => import("./pages/auditor/PengawasanKasir"));
const AuditorLogKoreksi = lazy(() => import("./pages/auditor/LogKoreksi"));

// Profil (Global)
const Profil = lazy(() => import("./pages/Profil"));

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
            <Suspense fallback={<div className="h-screen flex items-center justify-center"><LoadingSpinner text="Memuat antarmuka..." /></div>}>
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
            </Suspense>
        </BrowserRouter>
    );
}
