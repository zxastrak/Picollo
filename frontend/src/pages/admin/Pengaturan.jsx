import { useState, useEffect, useRef } from 'react'
import Layout from '../../components/Layout'
import useAuthStore from '../../store/authStore'

function EyeIcon({ open }) {
  return open
    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
      </svg>
}

export default function AdminPengaturan() {
  const { user, setAuth, role, token } = useAuthStore()
  const fileRef = useRef(null)

  const [tab, setTab]         = useState('profil')
  const [profile, setProfile] = useState({ nama: '', email: '', telepon: '' })
  // fotoPreview → URL string yang ditampilkan di UI (bisa dari store atau file baru)
  const [fotoPreview, setFotoPreview] = useState(null)
  // fotoFile → File object baru yang dipilih user (null = belum ganti foto)
  const [fotoFile, setFotoFile]       = useState(null)
  const [password, setPassword] = useState({ lama: '', baru: '', konfirmasi: '' })
  const [showPass, setShowPass] = useState({ lama: false, baru: false, konfirmasi: false })
  const [errors, setErrors]     = useState({})
  const [loadingProfile, setLoadingProfile]   = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [successProfile, setSuccessProfile]   = useState(false)
  const [successPassword, setSuccessPassword] = useState(false)

  // Isi form dari store saat komponen mount
useEffect(() => {
  if (user) {
    setProfile({
      nama:    user.name    || user.nama    || '',
      email:   user.email   || '',
      telepon: user.phone   || user.telepon || '',
    })
    setFotoPreview(user.foto || user.avatar || null)
  }
}, [user])

  // Handle pilih file foto
  const handleFoto = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors(p => ({ ...p, foto: 'File harus berupa gambar (JPG, PNG, WebP)' }))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors(p => ({ ...p, foto: 'Ukuran foto maksimal 2MB' }))
      return
    }
    setErrors(p => ({ ...p, foto: null }))
    setFotoFile(file)
    // FileReader → baca file sebagai base64 untuk ditampilkan sebagai preview
    const reader = new FileReader()
    reader.onload = (e) => setFotoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleHapusFoto = () => {
    setFotoFile(null)
    setFotoPreview(null)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const err = {}
    if (!profile.nama)
      err.nama = 'Nama tidak boleh kosong'
    else if (!/^[A-Za-z\s]+$/.test(profile.nama))
      err.nama = 'Nama hanya boleh huruf'
    if (!profile.email)
      err.email = 'Email tidak boleh kosong'
    if (Object.keys(err).length) { setErrors(err); return }

    setLoadingProfile(true)
    try {
      // TODO: backend siap → uncomment:
      // const formData = new FormData()
      // formData.append('name',   profile.nama)
      // formData.append('email',  profile.email)
      // formData.append('phone',  profile.telepon)
      // if (fotoFile instanceof File) formData.append('foto', fotoFile)
      // else if (!fotoPreview) formData.append('hapus_foto', '1')
      // const res = await pengaturanService.updateProfile(formData)
      // const updatedUser = res.data.data
      // setAuth(updatedUser, token, role)

      // Dummy: update store lokal dengan data baru termasuk foto
      await new Promise(r => setTimeout(r, 800))
      const updatedUser = {
        ...user,
        nama:    profile.nama,
        email:   profile.email,
        telepon: profile.telepon,
        foto:    fotoPreview, // URL base64 atau null
      }
      setAuth(updatedUser, token)
      setFotoFile(null) // reset file setelah disimpan
      setSuccessProfile(true)
      setTimeout(() => setSuccessProfile(false), 3000)
    } catch {
      setErrors({ global: 'Gagal menyimpan profil' })
    } finally { setLoadingProfile(false) }
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    const err = {}
    if (!password.lama) err.lama = 'Password lama wajib diisi'
    if (!password.baru || password.baru.length < 8) err.baru = 'Minimal 8 karakter'
    if (password.baru !== password.konfirmasi) err.konfirmasi = 'Password tidak cocok'
    if (Object.keys(err).length) { setErrors(err); return }
    setLoadingPassword(true)
    try {
      // TODO: await pengaturanService.updatePassword(password)
      await new Promise(r => setTimeout(r, 800))
      setPassword({ lama: '', baru: '', konfirmasi: '' })
      setSuccessPassword(true)
      setTimeout(() => setSuccessPassword(false), 3000)
    } catch {
      setErrors({ passwordGlobal: 'Gagal mengubah password' })
    } finally { setLoadingPassword(false) }
  }

  const inputCls = (f) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400
     focus:outline-none transition-colors bg-white
     ${errors[f] ? 'border-red-400 bg-red-50' : 'border-zinc-200 focus:border-yellow-400'}`

  const inisial = profile.nama?.[0]?.toUpperCase()
    || user?.email?.[0]?.toUpperCase()
    || 'A'

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Pengaturan Akun</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Kelola profil dan keamanan akun Anda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Kartu Profil Kiri ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center">

              {/* Avatar dengan overlay kamera saat hover */}
              <div className="relative inline-block mb-4">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-24 h-24 rounded-full mx-auto cursor-pointer
                             ring-4 ring-red-100 hover:ring-red-300 transition-all
                             overflow-hidden relative group">
                  {fotoPreview
                    ? <img src={fotoPreview} alt="profil"
                          className="w-full h-full object-cover"/>
                    : <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-500
                                      flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">{inisial}</span>
                      </div>
                  }
                  {/* Overlay ikon kamera saat hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                                  transition-opacity flex items-center justify-center rounded-full">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                </div>

                {/* Dot status aktif */}
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full
                                border-2 border-white"/>

                {/* Input file tersembunyi */}
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleFoto(e.target.files[0])}/>
              </div>

              {/* Tombol upload & hapus */}
              <div className="flex items-center justify-center gap-3 mb-2">
                <button onClick={() => fileRef.current?.click()}
                  className="text-xs font-semibold text-yellow-700 hover:text-yellow-700
                             transition-colors flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                  {fotoPreview ? 'Ganti Foto' : 'Upload Foto'}
                </button>
                {fotoPreview && (
                  <>
                    <span className="text-zinc-300 text-xs">|</span>
                    <button onClick={handleHapusFoto}
                      className="text-xs font-semibold text-zinc-400 hover:text-yellow-600 transition-colors">
                      Hapus
                    </button>
                  </>
                )}
              </div>

              {errors.foto && <p className="text-xs text-red-500 mb-2">{errors.foto}</p>}
              <p className="text-xs text-zinc-400 mb-4">JPG, PNG, WebP — Maks. 2MB</p>

              {/* Info nama & badge */}
              <p className="font-bold text-zinc-900 text-base">
                {profile.nama || 'Nama belum diisi'}
              </p>
              <p className="text-zinc-400 text-sm mt-0.5 truncate">
                {profile.email || user?.email || '-'}
              </p>
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mt-2
                               bg-red-100 text-yellow-700">
                Administrator
              </span>
            </div>

            {/* Info Akun */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <h4 className="font-semibold text-zinc-900 text-sm mb-3">Info Akun</h4>
              <div className="space-y-3">
                {[
                  { label: 'Role', val: 'Admin', color: '', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                  { label: 'Status', val: 'Aktif', color: 'text-green-600', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={r.icon}/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">{r.label}</p>
                      <p className={`text-sm font-semibold ${r.color || 'text-zinc-900'}`}>{r.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips Keamanan */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none"
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-1">Tips Keamanan</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Gunakan password yang kuat dan jangan bagikan akun Anda kepada siapapun.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Form Kanan ── */}
          <div className="lg:col-span-2">

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl mb-5">
              {[
                { key: 'profil',   label: 'Profil',   icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                { key: 'keamanan', label: 'Keamanan', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
              ].map(t => (
                <button key={t.key} onClick={() => { setTab(t.key); setErrors({}) }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg
                              text-sm font-semibold transition-all
                    ${tab === t.key
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon}/>
                  </svg>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Profil */}
            {tab === 'profil' && (
              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100">
                  <h3 className="font-bold text-zinc-900">Informasi Profil</h3>
                  <p className="text-zinc-400 text-xs mt-0.5">Perbarui data diri Anda</p>
                </div>
                <div className="p-6">
                  {errors.global && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl
                                    px-4 py-3 mb-4 text-sm">{errors.global}</div>
                  )}
                  {successProfile && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl
                                    px-4 py-3 mb-4 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                      </svg>
                      Profil berhasil diperbarui!
                    </div>
                  )}
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">
                          Nama Lengkap
                        </label>
                        <input type="text" value={profile.nama}
                          onChange={e => {
                            setProfile(p => ({ ...p, nama: e.target.value }))
                            setErrors(p => ({ ...p, nama: null }))
                          }}
                          placeholder="John Doe" className={inputCls('nama')}/>
                        <p className={`text-xs mt-1 ${errors.nama ? 'text-red-500' : 'text-zinc-400'}`}>
                          {errors.nama || 'Hanya boleh mengandung huruf'}
                        </p>
                      </div>
                      <div>
                        <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Email</label>
                        <input type="email" value={profile.email}
                          onChange={e => {
                            setProfile(p => ({ ...p, email: e.target.value }))
                            setErrors(p => ({ ...p, email: null }))
                          }}
                          placeholder="contoh@email.com" className={inputCls('email')}/>
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">
                          Nomor Telepon
                        </label>
                        <input type="tel" value={profile.telepon}
                          onChange={e => setProfile(p => ({ ...p, telepon: e.target.value }))}
                          placeholder="08xxxxxxxxxx" className={inputCls('telepon')}/>
                      </div>
                    </div>
                    <button type="submit" disabled={loadingProfile}
                      className="bg-zinc-900 hover:bg-yellow-500 disabled:bg-zinc-400
                                 text-white font-semibold px-6 py-2.5 rounded-xl text-sm
                                 transition-colors">
                      {loadingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Tab Keamanan */}
            {tab === 'keamanan' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-zinc-100">
                    <h3 className="font-bold text-zinc-900">Ubah Password</h3>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      Gunakan kombinasi huruf, angka, dan simbol
                    </p>
                  </div>
                  <div className="p-6">
                    {errors.passwordGlobal && (
                      <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl
                                      px-4 py-3 mb-4 text-sm">{errors.passwordGlobal}</div>
                    )}
                    {successPassword && (
                      <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl
                                      px-4 py-3 mb-4 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                        </svg>
                        Password berhasil diperbarui!
                      </div>
                    )}
                    <form onSubmit={handleSavePassword} className="space-y-4">
                      {[
                        { field: 'lama',       label: 'Password Lama',            ph: 'Password saat ini' },
                        { field: 'baru',       label: 'Password Baru',            ph: 'Min. 8 karakter' },
                        { field: 'konfirmasi', label: 'Konfirmasi Password Baru', ph: 'Ulangi password baru' },
                      ].map(({ field, label, ph }) => (
                        <div key={field}>
                          <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">
                            {label}
                          </label>
                          <div className="relative">
                            <input
                              type={showPass[field] ? 'text' : 'password'}
                              value={password[field]}
                              onChange={e => {
                                setPassword(p => ({ ...p, [field]: e.target.value }))
                                setErrors(p => ({ ...p, [field]: null }))
                              }}
                              placeholder={ph}
                              className={inputCls(field) + ' pr-11'}/>
                            <button type="button"
                              onClick={() => setShowPass(p => ({ ...p, [field]: !p[field] }))}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2
                                         text-zinc-400 hover:text-zinc-600">
                              <EyeIcon open={showPass[field]}/>
                            </button>
                          </div>
                          {errors[field] &&
                            <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
                        </div>
                      ))}
                      <button type="submit" disabled={loadingPassword}
                        className="bg-zinc-900 hover:bg-yellow-500 disabled:bg-zinc-400
                                   text-white font-semibold px-6 py-2.5 rounded-xl text-sm
                                   transition-colors">
                        {loadingPassword ? 'Menyimpan...' : 'Ubah Password'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Sesi aktif */}
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-zinc-100">
                    <h3 className="font-bold text-zinc-900">Sesi Aktif</h3>
                    <p className="text-zinc-400 text-xs mt-0.5">Perangkat yang sedang login</p>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                      <div className="w-10 h-10 bg-zinc-200 rounded-xl flex items-center
                                      justify-center shrink-0">
                        <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900">Sesi Saat Ini</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Browser · Aktif sekarang</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 font-semibold
                                       px-2.5 py-1 rounded-full shrink-0">
                        Aktif
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}