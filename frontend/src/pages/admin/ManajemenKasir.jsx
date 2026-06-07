import { useState, useEffect, useRef } from 'react'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorState from '../../components/ErrorState'
import { kasirService } from '../../services/kasirService'
import { outletService } from '../../services/outletService'

function ModalBuatKasir({ outlets, onClose, onSave }) {
  const [form, setForm] = useState({
    nama: '', email: '', password: '', outlet_id: '',
  })
  const [foto, setFoto]               = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [errors, setErrors]           = useState({})
  const [loading, setLoading]         = useState(false)
  const [showPass, setShowPass]       = useState(false)
  const fileRef                       = useRef(null)

  const set = (f, v) => {
    setForm(p => ({ ...p, [f]: v }))
    setErrors(p => ({ ...p, [f]: null }))
  }

  const handleFoto = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrors(p => ({ ...p, foto: 'File harus berupa gambar' })); return
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors(p => ({ ...p, foto: 'Maks. 2MB' })); return
    }
    setErrors(p => ({ ...p, foto: null }))
    setFoto(file)
    const reader = new FileReader()
    reader.onload = e => setFotoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  // Validasi frontend sebelum kirim ke API
  const validate = () => {
    const e = {}
    if (!form.nama)
      e.nama = 'Nama tidak boleh kosong'
    else if (!/^[A-Za-z\s]+$/.test(form.nama))
      e.nama = 'Nama hanya boleh huruf'
    if (!form.email)
      e.email = 'Email tidak boleh kosong'
    if (!form.password || form.password.length < 8)
      e.password = 'Password minimal 8 karakter'
    if (!form.outlet_id)
      e.outlet_id = 'Pilih outlet untuk kasir ini'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      const payload = {
        name: form.nama,
        email: form.email,
        password: form.password,
        password_confirmation: form.password,
        outlet_id: parseInt(form.outlet_id),
      }
      const res = await kasirService.create(payload)
      const newKasirObj = {
        id: res.data.data.id,
        nama: res.data.data.name,
        email: res.data.data.email,
        outlet: outlets.find(o => o.id == res.data.data.outlet_id)?.nama || '-',
        bergabung: new Date().toLocaleDateString('id-ID'),
        status: 'aktif',
        total_transaksi: 0,
        foto: null,
        password_plain: form.password,
      }
      onSave(newKasirObj)
    } catch (err) {
      if (err.response?.data?.errors) {
        const apiErrors = err.response.data.errors
        const formErrors = {}
        if (apiErrors.name) formErrors.nama = apiErrors.name[0]
        if (apiErrors.email) formErrors.email = apiErrors.email[0]
        if (apiErrors.password) formErrors.password = apiErrors.password[0]
        if (apiErrors.outlet_id) formErrors.outlet_id = apiErrors.outlet_id[0]
        setErrors(formErrors)
      } else {
        setErrors({ global: err.response?.data?.message || 'Gagal membuat akun kasir' })
      }
    } finally { setLoading(false) }
  }

  const inputCls = (f) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors
     ${errors[f] ? 'border-red-400 bg-red-50' : 'border-zinc-300 focus:border-yellow-400'}`

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100
                        sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h3 className="font-bold text-zinc-900">Buat Akun Kasir</h3>
            <p className="text-zinc-400 text-xs mt-0.5">Kasir login dengan email & password ini</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {errors.global && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {errors.global}
            </div>
          )}

          {/* Foto Profil */}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-2 block">
              Foto Profil <span className="text-zinc-400 font-normal">(opsional)</span>
            </label>
            <div className="flex items-center gap-4">
              <div onClick={() => fileRef.current?.click()}
                className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-300
                           flex items-center justify-center overflow-hidden cursor-pointer
                           hover:border-yellow-400 transition-colors shrink-0">
                {fotoPreview
                  ? <img src={fotoPreview} alt="preview" className="w-full h-full object-cover"/>
                  : <svg className="w-7 h-7 text-zinc-400" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                }
              </div>
              <div>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="text-sm font-semibold text-yellow-700 hover:text-yellow-700 transition-colors">
                  {fotoPreview ? 'Ganti Foto' : 'Upload Foto'}
                </button>
                <p className="text-xs text-zinc-400 mt-0.5">JPG, PNG — Maks. 2MB</p>
                {fotoPreview && (
                  <button type="button"
                    onClick={() => { setFoto(null); setFotoPreview(null) }}
                    className="text-xs text-red-500 hover:text-red-700 mt-0.5 block">
                    Hapus
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleFoto(e.target.files[0])}/>
            </div>
            {errors.foto && <p className="text-xs text-red-500 mt-1">{errors.foto}</p>}
          </div>

          {/* Nama */}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Nama Kasir</label>
            <input type="text" value={form.nama} onChange={e => set('nama', e.target.value)}
              placeholder="Contoh: Andi Santoso" className={inputCls('nama')}/>
            {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="kasir@picollo.com" className={inputCls('email')}/>
            <p className={`text-xs mt-1 ${errors.email ? 'text-red-500' : 'text-zinc-400'}`}>
              {errors.email || 'Email dipakai untuk login, tidak harus email asli'}
            </p>
          </div>

          {/* Password — tanpa Generate Otomatis */}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Min. 8 karakter" className={inputCls('password') + ' pr-11'}/>
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                {showPass
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
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {/* Outlet */}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Assign ke Outlet</label>
            <select value={form.outlet_id} onChange={e => set('outlet_id', e.target.value)}
              className={inputCls('outlet_id') + ' bg-white'}>
              <option value="">-- Pilih Outlet --</option>
              {outlets.map(o => (
                <option key={o.id} value={o.id}>{o.nama}</option>
              ))}
            </select>
            {errors.outlet_id && <p className="text-xs text-red-500 mt-1">{errors.outlet_id}</p>}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 flex gap-2
                        sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onClose}
            className="flex-1 border border-zinc-300 text-zinc-700 font-semibold py-2.5
                       rounded-xl text-sm hover:bg-zinc-50 transition-colors">
            Batal
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-400/50 text-zinc-900
                       font-semibold py-2.5 rounded-xl text-sm transition-colors">
            {loading ? 'Membuat...' : 'Buat Akun Kasir'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalKredensial({ kasir, onClose }) {
  const [copied, setCopied] = useState(null)
  const [showPass, setShowPass] = useState(true)

  const copy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h3 className="font-bold text-zinc-900 text-lg mb-1">Akun Kasir Dibuat!</h3>
          <p className="text-zinc-500 text-sm mb-6">
            Bagikan kredensial ini ke <strong>{kasir.nama}</strong>
          </p>

          <div className="bg-zinc-950 rounded-2xl p-5 mb-4 text-left space-y-3">
            {[
              { label: 'Email',    value: kasir.email,         field: 'email',    isPass: false },
              { label: 'Password', value: kasir.password_plain || kasir.password, field: 'password', isPass: true },
              { label: 'Outlet',   value: kasir.outlet,        field: null,       isPass: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-500 text-xs">{item.label}</p>
                  <p className="text-white text-sm font-mono font-bold truncate">
                    {item.isPass && !showPass
                      ? '•'.repeat((item.value || '').length)
                      : item.value}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.isPass && (
                    <button onClick={() => setShowPass(!showPass)}
                      className="text-zinc-400 hover:text-white transition-colors">
                      {showPass
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
                    </button>
                  )}
                  {item.field && (
                    <button onClick={() => copy(item.value, item.field)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all
                        ${copied === item.field ? 'bg-green-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-white'}`}>
                      {copied === item.field ? '✓' : 'Salin'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5 text-left">
            <p className="text-green-700 text-xs">
              ✅ Password bisa dilihat lagi kapan saja via tombol <strong>"Lihat Akun"</strong> di tabel.
            </p>
          </div>

          <button onClick={onClose}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold
                       py-3 rounded-xl text-sm transition-colors">
            Selesai
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalLihatKredensial({ kasir, onClose, onUpdate }) {
  const [showPass, setShowPass] = useState(false)
  const [copied, setCopied]     = useState(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [nama, setNama]           = useState(kasir.nama || '')
  const [newPassword, setNewPassword] = useState('')
  const [fotoFile, setFotoFile]   = useState(null)
  const [fotoPreview, setFotoPreview] = useState(kasir.foto || null)
  const [loading, setLoading]     = useState(false)
  const fileRef = useRef(null)

  const copy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleFoto = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = e => setFotoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('_method', 'PUT')
      fd.append('name', nama)
      if (newPassword) {
        fd.append('password', newPassword)
        fd.append('password_confirmation', newPassword)
      }
      if (fotoFile) fd.append('avatar', fotoFile)
      
      const res = await kasirService.update(kasir.id, fd)
      const updated = res.data.data
      onUpdate({
        ...kasir,
        nama: updated.name,
        foto: updated.avatar_url || kasir.foto,
      })
      setIsEditing(false)
    } catch (err) {
      alert('Gagal update profile: ' + (err.response?.data?.message || err.message))
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <h3 className="font-bold text-zinc-900">Kredensial Kasir</h3>
            <p className="text-zinc-400 text-xs mt-0.5">{kasir.nama} — {kasir.outlet}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsEditing(!isEditing)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${isEditing ? 'bg-yellow-100 text-yellow-700' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}>
              {isEditing ? 'Batal Edit' : 'Edit Profile'}
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="px-6 py-5">
          {isEditing ? (
            <div className="mb-5 space-y-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              <div className="flex items-center gap-4">
                <div onClick={() => fileRef.current?.click()} className="w-14 h-14 rounded-full border-2 border-dashed border-zinc-300 flex items-center justify-center overflow-hidden cursor-pointer shrink-0">
                  {fotoPreview ? <img src={fotoPreview} alt="preview" className="w-full h-full object-cover"/> : <span className="text-xs text-zinc-400">Foto</span>}
                </div>
                <div>
                  <button onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-yellow-700 hover:text-yellow-700">Ganti Foto</button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFoto(e.target.files[0])}/>
                </div>
              </div>
              <div>
                <label className="text-zinc-700 text-xs font-bold mb-1.5 block">Nama Kasir</label>
                <input type="text" value={nama} onChange={e => setNama(e.target.value)} className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-zinc-700 text-xs font-bold mb-1.5 block">Password Baru <span className="text-zinc-400 font-normal">(Kosongkan jika tidak ingin diubah)</span></label>
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 karakter" className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-400" />
              </div>
              <button onClick={handleSave} disabled={loading} className="w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold py-2 rounded-xl text-sm mt-2">
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          ) : null}

          <div className="bg-zinc-950 rounded-2xl p-5 space-y-3">
            {[
              { label: 'Email',    value: kasir.email, field: 'email', isPass: false },
              { label: 'Password', value: kasir.password_plain || '(tidak tersimpan)', field: 'password', isPass: true },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-500 text-xs">{item.label}</p>
                  <p className="text-white text-sm font-mono font-bold">
                    {item.isPass && !showPass
                      ? '•'.repeat(Math.min((item.value || '').length, 12))
                      : item.value}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.isPass && (
                    <button onClick={() => setShowPass(!showPass)}
                      className="text-zinc-400 hover:text-white transition-colors p-1">
                      {showPass
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
                    </button>
                  )}
                  <button onClick={() => copy(item.value, item.field)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all
                      ${copied === item.field ? 'bg-green-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-white'}`}>
                    {copied === item.field ? '✓' : 'Salin'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4">
            <p className="text-amber-700 text-xs">
              ⚠️ Jaga kerahasiaan kredensial ini.
            </p>
          </div>
          <button onClick={onClose}
            className="w-full bg-zinc-900 hover:bg-zinc-700 text-white font-semibold
                       py-2.5 rounded-xl text-sm transition-colors mt-4">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminManajemenKasir() {
  const [data, setData]               = useState([])
  const [outlets, setOutlets]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [showBuat, setShowBuat]       = useState(false)
  const [newKasir, setNewKasir]       = useState(null)
  const [lihatKredensial, setLihatKredensial] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const outletRes = await outletService.getAll()
      setOutlets(outletRes.data.data || [])

      const kasirRes = await kasirService.getAll()
      const mappedKasir = (kasirRes.data.data || []).map(k => ({
        id: k.id,
        nama: k.name,
        email: k.email,
        outlet: k.outlets?.[0]?.nama || '-',
        bergabung: k.created_at ? new Date(k.created_at).toLocaleDateString('id-ID') : '-',
        total_transaksi: k.total_transaksi || 0,
        status: k.is_active ? 'aktif' : 'nonaktif',
        password_plain: '',
      }))
      setData(mappedKasir)
    } catch {
      setData([])
      setOutlets([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id) => {
    const kasir = data.find(k => k.id === id)
    if (!kasir) return
    const newStatus = kasir.status === 'aktif' ? 'nonaktif' : 'aktif'
    const newIsActive = newStatus === 'aktif'
    try {
      await kasirService.update(id, { is_active: newIsActive })
      setData(prev => prev.map(k =>
        k.id === id ? { ...k, status: newStatus } : k
      ))
    } catch (err) {
      alert('Gagal mengubah status kasir')
    }
  }

  const handleSaveKasir = (kasir) => {
    setData(prev => [...prev, kasir])
    setShowBuat(false)
    setNewKasir(kasir)
  }

  const filtered = data.filter(k =>
    k.nama?.toLowerCase().includes(search.toLowerCase()) ||
    k.email?.toLowerCase().includes(search.toLowerCase()) ||
    k.outlet?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total:    data.length,
    aktif:    data.filter(k => k.status === 'aktif').length,
    nonaktif: data.filter(k => k.status === 'nonaktif').length,
  }

  return (
    <Layout>
      {showBuat && (
        <ModalBuatKasir outlets={outlets} onClose={() => setShowBuat(false)} onSave={handleSaveKasir}/>
      )}
      {newKasir && (
        <ModalKredensial kasir={newKasir} onClose={() => setNewKasir(null)}/>
      )}
      {lihatKredensial && (
        <ModalLihatKredensial kasir={lihatKredensial} onClose={() => setLihatKredensial(null)} 
          onUpdate={(k) => {
            setData(prev => prev.map(old => old.id === k.id ? k : old));
            setLihatKredensial(k);
          }}
        />
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Manajemen Kasir</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Buat dan kelola akun kasir di semua outlet</p>
          </div>
          <button onClick={() => setShowBuat(true)}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-zinc-900
                       font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors
                       self-start sm:self-auto shadow-lg shadow-yellow-500/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Buat Akun Kasir
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Kasir', val: stats.total,    color: 'bg-zinc-900' },
            { label: 'Aktif',       val: stats.aktif,    color: 'bg-green-700' },
            { label: 'Nonaktif',    val: stats.nonaktif, color: 'bg-zinc-500' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl px-5 py-4 text-white`}>
              <p className="text-white/70 text-xs font-medium">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.val}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <div className="relative">
            <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, email, atau outlet kasir..."
              className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm
                         focus:outline-none focus:border-yellow-400 transition-colors"/>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  {['Kasir', 'Email', 'Outlet', 'Bergabung', 'Transaksi', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold
                                           text-zinc-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-5 py-3">
                        <div className="h-8 bg-zinc-100 rounded-lg animate-pulse"/>
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <p className="text-zinc-500 text-sm font-medium">Belum ada kasir</p>
                      <p className="text-zinc-400 text-xs mt-1">Klik "Buat Akun Kasir" untuk menambahkan</p>
                    </td>
                  </tr>
                ) : filtered.map(k => (
                  <tr key={k.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {k.foto
                          ? <img src={k.foto} alt={k.nama}
                              className="w-8 h-8 rounded-full object-cover border border-zinc-200 shrink-0"/>
                          : <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center
                                            justify-center shrink-0">
                              <span className="text-yellow-700 text-xs font-bold">
                                {k.nama?.[0]?.toUpperCase()}
                              </span>
                            </div>
                        }
                        <span className="text-sm font-semibold text-zinc-900">{k.nama}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{k.email}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-700">{k.outlet}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{k.bergabung || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-700">{k.total_transaksi ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                        ${k.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                        {k.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleToggle(k.id)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg
                                      transition-colors border whitespace-nowrap
                            ${k.status === 'aktif'
                              ? 'border-red-200 text-red-700 hover:bg-yellow-50'
                              : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
                          {k.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button onClick={() => setLihatKredensial(k)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border
                                     border-zinc-200 text-zinc-600 hover:bg-zinc-50
                                     transition-colors whitespace-nowrap flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                          Lihat Akun
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}