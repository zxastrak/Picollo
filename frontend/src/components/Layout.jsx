import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import PicolloLogo from './PicolloLogo'
import api from '../services/api'

const navConfig = {
  admin: {
    label: 'Admin Panel',
    isReadOnly: false,
    groups: [
      {
        group: 'Utama', items: [
          { to: '/admin/dashboard',  label: 'Dashboard',    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { to: '/admin/outlet',     label: 'Multi Outlet', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
          { to: '/admin/produk',     label: 'Produk',       icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
          { to: '/admin/transaksi',  label: 'Transaksi',    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { to: '/admin/laporan',    label: 'Laporan',      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { to: '/admin/verifikasi', label: 'Verifikasi',   icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
        ]
      },
      {
        group: 'Manajemen', items: [
          { to: '/admin/kasir',       label: 'Manajemen Kasir',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { to: '/admin/auditor',     label: 'Manajemen Auditor', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
          { to: '/admin/pengawasan',  label: 'Pengawasan Kasir',  icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
          { to: '/admin/log-koreksi', label: 'Log Koreksi',       icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        ]
      },
      {
        group: 'Akun', items: [
          { to: '/admin/pengaturan', label: 'Pengaturan', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
        ]
      },
    ],
  },
  kasir: {
    label: 'Kasir Panel',
    isReadOnly: false,
    groups: [
      {
        group: 'Menu', items: [
          { to: '/kasir/dashboard', label: 'Dashboard',       icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { to: '/kasir/transaksi', label: 'Input Transaksi', icon: 'M12 4v16m8-8H4' },
          { to: '/kasir/rekap',     label: 'Rekap Harian',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        ]
      },
    ],
  },
  auditor: {
    label: 'Auditor Panel',
    isReadOnly: true,
    groups: [
      {
        group: 'Menu', items: [
          { to: '/auditor/dashboard',  label: 'Dashboard',        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { to: '/auditor/transaksi',  label: 'Data Transaksi',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { to: '/auditor/verifikasi', label: 'Verifikasi Hash',  icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
          { to: '/auditor/laporan',    label: 'Laporan',          icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { to: '/auditor/pengawasan', label: 'Pengawasan Kasir', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
          { to: '/auditor/log-koreksi',label: 'Log Koreksi',      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        ]
      },
    ],
  },
}

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

function getUserName(user) {
  return user?.name || user?.nama || '-'
}

function Avatar({ foto, user, size = 'sm' }) {
  const dim   = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  const label = getUserName(user)[0]?.toUpperCase() || 'U'
  return foto
    ? <img src={foto || user?.avatar_url} alt="profil"
        className={`${dim} rounded-full object-cover border-2 border-yellow-400`}/>
    : <div className={`${dim} bg-yellow-400 rounded-full flex items-center justify-center shrink-0`}>
        <span className="text-zinc-900 font-bold">{label}</span>
      </div>
}

function SidebarContent({ nav, collapsed, onClose }) {
  const navigate             = useNavigate()
  const { user, logout, outlets, activeOutletId, setActiveOutletId } = useAuthStore()
  const role                 = user?.role
  const handleLogout         = () => { logout(); navigate('/login') }
  const displayName          = getUserName(user)

  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className={`flex items-center border-b border-zinc-800 shrink-0
        ${collapsed ? 'justify-center px-3 py-5' : 'justify-between px-5 py-5'}`}>
        {collapsed ? (
          <Link to={`/${role === 'kasir' ? 'kasir' : role === 'auditor' ? 'auditor' : 'admin'}/dashboard`} className="block cursor-pointer hover:opacity-80 transition-opacity">
            <img src="/PicolloLogo.png" alt="P"
              className="w-8 h-8 rounded-xl object-cover bg-white"
              onError={e => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}/>
            <div className="w-8 h-8 rounded-xl bg-white items-center justify-center"
              style={{ display: 'none' }}>
              <span className="text-yellow-500 font-black text-sm">P</span>
            </div>
          </Link>
        ) : (
          <>
            <Link to={`/${role === 'kasir' ? 'kasir' : role === 'auditor' ? 'auditor' : 'admin'}/dashboard`} className="block cursor-pointer hover:opacity-80 transition-opacity">
              <PicolloLogo size="sm"/>
            </Link>
            {onClose && (
              <button onClick={onClose} className="text-zinc-500 hover:text-white lg:hidden ml-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Read Only Banner */}
      {nav.isReadOnly && !collapsed && (
        <div className="mx-3 mt-3 bg-amber-900/30 border border-amber-700/50 rounded-xl px-3 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <p className="text-amber-400 text-xs font-semibold">Akses Read Only</p>
          </div>
          <p className="text-amber-600 text-xs mt-0.5">Tidak dapat mengubah data</p>
        </div>
      )}

      {/* Outlet Switcher untuk Auditor */}
      {!collapsed && role === 'auditor' && outlets?.length > 0 && (
        <div className="px-3 mt-3 shrink-0">
          <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5 block px-1">Outlet Aktif</label>
          <div className="relative">
            <select 
              value={activeOutletId}
              onChange={(e) => setActiveOutletId(e.target.value)}
              className="w-full bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl pl-3 pr-8 py-2.5 border border-zinc-700/50 focus:outline-none focus:border-yellow-400/50 appearance-none cursor-pointer hover:bg-zinc-700/50 transition-colors"
            >
              <option value="">Semua Outlet ({outlets.length})</option>
              {outlets.map(o => (
                <option key={o.id} value={o.id}>{o.nama}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-zinc-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {nav.groups.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <p className="text-zinc-600 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
                {group.group}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl text-sm font-medium transition-all
                    ${collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'}
                    ${isActive
                      ? 'bg-yellow-400 text-zinc-900 shadow-lg shadow-yellow-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon}/>
                  </svg>
                  {!collapsed && item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-zinc-800 space-y-1 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800/50">
            <Avatar foto={user?.avatar_url || user?.foto} user={user} size="sm"/>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{displayName}</p>
              <p className="text-zinc-500 text-xs capitalize">{role}</p>
            </div>
          </div>
        )}
        <button onClick={handleLogout} title={collapsed ? 'Keluar' : undefined}
          className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium
                     text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800 transition-all
                     ${collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          {!collapsed && 'Keluar'}
        </button>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed]     = useState(false)
  const [notifOpen, setNotifOpen]     = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const { user, logout, outlets, activeOutletId }  = useAuthStore()
  const role               = user?.role
  const displayName        = getUserName(user)
  const navigate           = useNavigate()
  const nav                = navConfig[role] || navConfig.admin

  const getActiveOutletName = () => {
    if (role === 'admin') return ''
    if (role === 'auditor') {
      if (!activeOutletId) return ' (Semua Outlet)'
      const activeOutlet = outlets.find(o => String(o.id) === String(activeOutletId))
      return activeOutlet ? ` (${activeOutlet.nama})` : ''
    }
    return outlets?.[0]?.nama ? ` (${outlets[0].nama})` : ''
  }

  const [notifications, setNotifications] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)

  const fetchNotifications = async () => {
    if (role !== 'admin') return
    setNotifLoading(true)
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data.data || [])
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setNotifLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [role])

  const notifRef   = useRef(null)
  const profileRef = useRef(null)
  useClickOutside(notifRef,   () => setNotifOpen(false))
  useClickOutside(profileRef, () => setProfileOpen(false))

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}/>
      )}

      {/* Sidebar desktop */}
      <aside className={`hidden lg:flex bg-zinc-900 flex-col shrink-0 h-full
                         transition-all duration-300 ease-in-out
                         ${collapsed ? 'w-16' : 'w-60 xl:w-64'}`}>
        <SidebarContent nav={nav} collapsed={collapsed}/>
      </aside>

      {/* Sidebar mobile */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-zinc-900 flex flex-col z-30
                         transform transition-transform duration-300 ease-in-out lg:hidden
                         ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent nav={nav} collapsed={false} onClose={() => setSidebarOpen(false)}/>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Navbar */}
        <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-3
                           flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-zinc-500 hover:text-zinc-900 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>

            <button onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg
                         text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}>
              {collapsed
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
                  </svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
                  </svg>
              }
            </button>

            <h1 className="text-sm sm:text-base font-bold text-zinc-900">
              Picollo{' '}
              <span className="text-zinc-400 font-normal hidden sm:inline">
                — {nav.label}
                {getActiveOutletName()}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {nav.isReadOnly ? (
              <>
                <div className="hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-200
                                text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  Read Only
                </div>
                <button onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                             text-zinc-500 hover:text-yellow-600 hover:bg-yellow-50 transition-colors
                             border border-zinc-200 hover:border-yellow-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </>
            ) : (
              <>
                {role === 'admin' && (
                  <div className="relative" ref={notifRef}>
                    <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
                      className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors relative">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                      </svg>
                      {notifications.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                      )}
                    </button>
                    {notifOpen && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl
                                      shadow-xl border border-zinc-200 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                          <h3 className="font-bold text-zinc-900 text-sm">Notifikasi Peringatan</h3>
                          {notifications.length > 0 && (
                            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                              {notifications.length} Warning
                            </span>
                          )}
                        </div>
                        <div className="max-h-96 overflow-y-auto divide-y divide-zinc-50">
                          {notifLoading ? (
                            <div className="px-4 py-8 text-center text-zinc-400 text-xs animate-pulse">
                              Memuat...
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <p className="text-zinc-500 text-sm">Tidak ada notifikasi baru</p>
                              <p className="text-zinc-400 text-xs mt-1">Semua sistem blockchain aman</p>
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div key={notif.id} className="p-4 hover:bg-zinc-50 transition-colors text-left">
                                <div className="flex items-start gap-2.5">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.type === 'danger' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-zinc-900 leading-tight">
                                      {notif.title}
                                    </p>
                                    <p className="text-[11px] text-zinc-600 mt-1 leading-normal">
                                      {notif.message}
                                    </p>
                                    <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-400 font-medium">
                                      <span>{notif.outlet}</span>
                                      <span>{new Date(notif.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="relative" ref={profileRef}>
                  <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
                    className="flex items-center gap-2 p-1.5 hover:bg-zinc-100 rounded-xl transition-colors">
                    <Avatar foto={user?.avatar_url || user?.foto} user={user} size="sm"/>
                    <svg className="w-4 h-4 text-zinc-400 hidden sm:block" fill="none"
                      stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl
                                    shadow-xl border border-zinc-200 z-50 overflow-hidden">
                      <div className="px-4 py-4 border-b border-zinc-100">
                        <div className="flex items-center gap-3">
                          <Avatar foto={user?.avatar_url || user?.foto} user={user} size="md"/>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-zinc-900 truncate">
                              {displayName}
                            </p>
                            {role && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 font-semibold
                                               px-2 py-0.5 rounded-full capitalize">
                                {role}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {role === 'admin' ? (
                        <div className="p-2">
                          <NavLink to="/profil" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                                       text-zinc-700 font-medium hover:bg-zinc-50 transition-colors">
                            <svg className="w-4 h-4 text-zinc-400" fill="none"
                              stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                            Profil Saya
                          </NavLink>
                        </div>
                      ) : (
                        <div className="px-4 py-3 border-b border-zinc-100">
                          <p className="text-xs text-zinc-400 text-center">
                            Hubungi Admin untuk mengubah profil
                          </p>
                        </div>
                      )}

                      <div className="p-2 border-t border-zinc-100">
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                     text-sm font-medium text-yellow-600 hover:bg-yellow-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                          </svg>
                          Keluar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}