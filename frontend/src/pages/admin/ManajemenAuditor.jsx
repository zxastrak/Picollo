import { useState, useEffect, useRef } from 'react'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorState from '../../components/ErrorState'
import { auditorService } from '../../services/auditorService'
import { outletService } from '../../services/outletService'

// ── Modal Buat Akun Auditor ──
// Sama konsepnya dengan buat akun kasir
function ModalBuatAuditor({ outlets, onClose, onSave }) {
  const [form, setForm] = useState({
    nama: '',
    email: '',
    password: '',
    instansi: '', // Nama KAP / perusahaan auditor
    outlet_ids: [],
  })
  const [foto, setFoto]             = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [errors, setErrors]         = useState({})
  const [loading, setLoading]       = useState(false)
  const [showPass, setShowPass]     = useState(false)
  const fileRef                     = useRef(null)

  // set field + hapus error → validasi real-time
  const set = (f, v) => {
    setForm(p => ({ ...p, [f]: v }))
    setErrors(p => ({ ...p, [f]: null }))
  }

  // Handle upload foto
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
    if (!form.nama)    e.nama    = 'Nama tidak boleh kosong'
    else if (!/^[A-Za-z\s]+$/.test(form.nama)) e.nama = 'Nama hanya boleh huruf'
    if (!form.email)   e.email   = 'Email tidak boleh kosong'
    if (!form.instansi) e.instansi = 'Nama instansi tidak boleh kosong'
    if (!form.outlet_ids || form.outlet_ids.length === 0) e.outlet_ids = 'Pilih minimal 1 outlet'
    if (!form.password || form.password.length < 8)
      e.password = 'Password minimal 8 karakter'
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
        outlet_ids: form.outlet_ids.map(id => parseInt(id)),
        instansi: form.instansi,
      }
      const res = await auditorService.create(payload)
      const newAuditorObj = {
        id: res.data.data.id,
        nama: res.data.data.name,
        email: res.data.data.email,
        instansi: res.data.data.instansi,
        outlet: outlets.filter(o => res.data.data.outlet_ids.includes(o.id)).map(o => o.nama).join(', ') || '-',
        bergabung: new Date().toLocaleDateString('id-ID'),
        status: 'aktif',
        password: form.password,
      }
      onSave(newAuditorObj)
    } catch (err) {
      if (err.response?.data?.errors) {
        const apiErrors = err.response.data.errors
        const formErrors = {}
        if (apiErrors.name) formErrors.nama = apiErrors.name[0]
        if (apiErrors.email) formErrors.email = apiErrors.email[0]
        if (apiErrors.password) formErrors.password = apiErrors.password[0]
        if (apiErrors.outlet_ids) formErrors.outlet_ids = apiErrors.outlet_ids[0]
        if (apiErrors.instansi) formErrors.instansi = apiErrors.instansi[0]
        setErrors(formErrors)
      } else {
        setErrors({ global: err.response?.data?.message || 'Gagal membuat akun auditor' })
      }
    } finally { setLoading(false) }
  }

  const inputCls = (f) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors
     ${errors[f] ? 'border-red-400 bg-red-50' : 'border-zinc-300 focus:border-yellow-400'}`

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl
                      max-h-[90vh] overflow-y-auto">

        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100
                        sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h3 className="font-bold text-zinc-900">Buat Akun Auditor</h3>
            <p className="text-zinc-400 text-xs mt-0.5">
              Auditor login di halaman login dengan akun ini
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {errors.global && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl
                            px-4 py-3 text-sm">
              {errors.global}
            </div>
          )}

          {/* Foto Profil */}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-2 block">
              Foto Profil <span className="text-zinc-400 font-normal">(opsional, maks. 2MB)</span>
            </label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-300
                           flex items-center justify-center overflow-hidden cursor-pointer
                           hover:border-yellow-400 transition-colors shrink-0">
                {fotoPreview
                  ? <img src={fotoPreview} alt="preview"
                        className="w-full h-full object-cover"/>
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
                <p className="text-xs text-zinc-400 mt-0.5">JPG, PNG, WebP</p>
                {fotoPreview && (
                  <button type="button"
                    onClick={() => { setFoto(null); setFotoPreview(null) }}
                    className="text-xs text-red-500 hover:text-red-700 mt-0.5 block">
                    Hapus foto
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
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">
              Nama Auditor
            </label>
            <input type="text" value={form.nama} onChange={e => set('nama', e.target.value)}
              placeholder="Contoh: Budi Santoso" className={inputCls('nama')}/>
            {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
          </div>

          {/* Instansi */}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">
              Instansi / Perusahaan
            </label>
            <input type="text" value={form.instansi} onChange={e => set('instansi', e.target.value)}
              placeholder="Contoh: KAP Budi & Rekan" className={inputCls('instansi')}/>
            {errors.instansi && <p className="text-xs text-red-500 mt-1">{errors.instansi}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="auditor@kap.com" className={inputCls('email')}/>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Min. 8 karakter" className={inputCls('password') + ' pr-11'}/>
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400
                           hover:text-zinc-600">
                {showPass
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
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
            <div className={`space-y-2 max-h-40 overflow-y-auto border p-3 rounded-xl ${errors.outlet_ids ? 'border-red-400 bg-red-50' : 'border-zinc-300'}`}>
              {outlets.map(o => (
                <label key={o.id} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 p-1 rounded transition-colors">
                  <input type="checkbox"
                    checked={form.outlet_ids.includes(o.id)}
                    onChange={(e) => {
                      if (e.target.checked) set('outlet_ids', [...form.outlet_ids, o.id])
                      else set('outlet_ids', form.outlet_ids.filter(id => id !== o.id))
                    }}
                    className="w-4 h-4 rounded border-zinc-300 text-yellow-700 focus:ring-yellow-400"
                  />
                  <span className="text-sm text-zinc-700">{o.nama}</span>
                </label>
              ))}
            </div>
            {errors.outlet_ids && <p className="text-xs text-red-500 mt-1">{errors.outlet_ids}</p>}
          </div>
        </div>

        {/* Footer modal */}
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
            {loading ? 'Membuat...' : 'Buat Akun Auditor'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Kredensial ──
// Tampil setelah akun berhasil dibuat
function ModalKredensial({ auditor, onClose }) {
  const [copied, setCopied] = useState(null)

  const copy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
                          justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h3 className="font-bold text-zinc-900 text-lg mb-1">Akun Auditor Dibuat!</h3>
          <p className="text-zinc-500 text-sm mb-6">
            Bagikan kredensial berikut kepada <strong>{auditor.nama}</strong>
          </p>

          <div className="bg-zinc-950 rounded-2xl p-5 mb-4 text-left space-y-3">
            {[
              { label: 'Email',     value: auditor.email,    field: 'email' },
              { label: 'Password',  value: auditor.password, field: 'password' },
              { label: 'Instansi',  value: auditor.instansi, field: null },
            ].map(item => (
              <div key={item.label}
                className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-zinc-500 text-xs">{item.label}</p>
                  <p className="text-white text-sm font-mono font-bold truncate">
                    {item.value}
                  </p>
                </div>
                {item.field && (
                  <button onClick={() => copy(item.value, item.field)}
                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg
                                transition-all
                      ${copied === item.field
                        ? 'bg-green-600 text-white'
                        : 'bg-zinc-700 hover:bg-zinc-600 text-white'}`}>
                    {copied === item.field ? '✓' : 'Salin'}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-left">
            <p className="text-amber-700 text-xs">
              ⚠️ Simpan kredensial ini. Password tidak bisa dilihat lagi setelah window ditutup.
              Kirimkan melalui saluran yang aman.
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

// ── Modal Lihat & Edit Kredensial ──
function ModalLihatKredensial({ auditor, outlets, onClose, onUpdate }) {
  const [showPass, setShowPass] = useState(false)
  const [copied, setCopied]     = useState(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [nama, setNama]           = useState(auditor.nama || '')
  const [newPassword, setNewPassword] = useState('')
  const [outletIds, setOutletIds] = useState(auditor.outlet_ids || [])
  const [fotoFile, setFotoFile]   = useState(null)
  const [fotoPreview, setFotoPreview] = useState(auditor.foto || null)
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
      outletIds.forEach(id => fd.append('outlet_ids[]', id))
      if (fotoFile) fd.append('avatar', fotoFile)
      
      const res = await auditorService.update(auditor.id, fd)
      const updated = res.data.data
      onUpdate({
        ...auditor,
        nama: updated.name,
        outlet_ids: updated.outlets.map(o => o.id),
        outlet: updated.outlets.map(o => o.nama).join(', ') || '-',
        foto: updated.avatar_url || auditor.foto,
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
            <h3 className="font-bold text-zinc-900">Kredensial Auditor</h3>
            <p className="text-zinc-400 text-xs mt-0.5">{auditor.nama} — {auditor.instansi}</p>
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
                <label className="text-zinc-700 text-xs font-bold mb-1.5 block">Nama Auditor</label>
                <input type="text" value={nama} onChange={e => setNama(e.target.value)} className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-zinc-700 text-xs font-bold mb-1.5 block">Password Baru <span className="text-zinc-400 font-normal">(Kosongkan jika tidak ingin diubah)</span></label>
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 karakter" className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-zinc-700 text-xs font-bold mb-1.5 block">Assign ke Outlet</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-zinc-300 p-3 rounded-xl">
                  {outlets.map(o => (
                    <label key={o.id} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 p-1 rounded transition-colors">
                      <input type="checkbox"
                        checked={outletIds.includes(o.id)}
                        onChange={(e) => {
                          if (e.target.checked) setOutletIds([...outletIds, o.id])
                          else setOutletIds(outletIds.filter(id => id !== o.id))
                        }}
                        className="w-4 h-4 rounded border-zinc-300 text-yellow-700 focus:ring-yellow-400"
                      />
                      <span className="text-sm text-zinc-700">{o.nama}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={handleSave} disabled={loading} className="w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold py-2 rounded-xl text-sm mt-2">
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          ) : null}

          <div className="bg-zinc-950 rounded-2xl p-5 space-y-3">
            {[
              { label: 'Email',    value: auditor.email, field: 'email', isPass: false },
              { label: 'Password', value: auditor.password_plain || '(tidak tersimpan)', field: 'password', isPass: true },
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
                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
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
        </div>
      </div>
    </div>
  )
}

// ── Halaman Utama Manajemen Auditor ──
export default function ManajemenAuditor() {
  // State untuk data auditor
  const [data, setData]         = useState([])
  const [outlets, setOutlets]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]     = useState('')
  const [showBuat, setShowBuat] = useState(false)
  const [newAuditor, setNewAuditor] = useState(null) // untuk modal kredensial
  const [lihatKredensial, setLihatKredensial] = useState(null)

  // useEffect → fetch data saat komponen pertama mount
  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const outletRes = await outletService.getAll()
      setOutlets(outletRes.data.data || [])

      const res = await auditorService.getAll()
      const mappedAuditors = (res.data.data || []).map(a => ({
        id: a.id,
        nama: a.name,
        email: a.email,
        instansi: a.instansi || '-',
        outlet_ids: a.outlets?.map(o => o.id) || [],
        outlet: a.outlets?.map(o => o.nama).join(', ') || '-',
        bergabung: a.created_at ? new Date(a.created_at).toLocaleDateString('id-ID') : '-',
        status: a.is_active ? 'aktif' : 'nonaktif',
        password_plain: '',
        foto: a.avatar_url,
      }))
      setData(mappedAuditors)
    } catch {
      setError('Gagal memuat data auditor')
      setData([])
      setOutlets([])
    } finally {
      setLoading(false)
    }
  }

  // Toggle status aktif/nonaktif
  const handleToggle = async (id) => {
    const auditor = data.find(a => a.id === id)
    if (!auditor) return
    const newStatus = auditor.status === 'aktif' ? 'nonaktif' : 'aktif'
    try {
      await auditorService.toggleStatus(id, newStatus)
      setData(prev => prev.map(a =>
        a.id === id
          ? { ...a, status: newStatus }
          : a
      ))
    } catch (err) {
      alert('Gagal mengubah status auditor')
    }
  }

  // Saat akun baru berhasil dibuat
  const handleSave = (auditor) => {
    setData(prev => [...prev, auditor])
    setShowBuat(false)
    setNewAuditor(auditor) // tampilkan modal kredensial
  }

  // Filter pencarian
  const filtered = data.filter(a =>
    a.nama?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.instansi?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total:    data.length,
    aktif:    data.filter(a => a.status === 'aktif').length,
    nonaktif: data.filter(a => a.status === 'nonaktif').length,
  }
  if (loading) return (
    <Layout>
      <LoadingSpinner/>
    </Layout>
  )

  if (error) return (
    <Layout>
      <ErrorState message={error} onRetry={fetchData}/>
    </Layout>
  )
  return (
    <Layout>
      {/* Modal buat akun */}
      {showBuat && (
        <ModalBuatAuditor
          outlets={outlets}
          onClose={() => setShowBuat(false)}
          onSave={handleSave}
        />
      )}
      {/* Modal kredensial → muncul setelah buat akun */}
      {newAuditor && (
        <ModalKredensial
          auditor={newAuditor}
          onClose={() => setNewAuditor(null)}
        />
      )}
      {lihatKredensial && (
        <ModalLihatKredensial auditor={lihatKredensial} outlets={outlets} onClose={() => setLihatKredensial(null)} 
          onUpdate={(k) => {
            setData(prev => prev.map(old => old.id === k.id ? k : old));
            setLihatKredensial(k);
          }}
        />
      )}

      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Manajemen Auditor</h2>
            <p className="text-zinc-500 text-sm mt-0.5">
              Buat dan kelola akun auditor untuk verifikasi transaksi
            </p>
          </div>
          <button onClick={() => setShowBuat(true)}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-zinc-900
                       font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors
                       self-start sm:self-auto shadow-lg shadow-yellow-500/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Buat Akun Auditor
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Auditor', val: stats.total,    color: 'bg-zinc-900' },
            { label: 'Aktif',         val: stats.aktif,    color: 'bg-green-700' },
            { label: 'Nonaktif',      val: stats.nonaktif, color: 'bg-zinc-500' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl px-5 py-4 text-white`}>
              <p className="text-white/70 text-xs font-medium">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <div className="relative">
            <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, email, atau instansi auditor..."
              className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm
                         focus:outline-none focus:border-yellow-400 transition-colors"/>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  {['Auditor', 'Email', 'Instansi', 'Bergabung', 'Status', 'Aksi'].map(h => (
                    <th key={h}
                      className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500
                                 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  // Skeleton loading
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-5 py-3">
                        <div className="h-8 bg-zinc-100 rounded-lg animate-pulse"/>
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  // Empty state
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center
                                        justify-center">
                          <svg className="w-7 h-7 text-zinc-400" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-zinc-900 font-semibold text-sm">
                            Belum ada auditor
                          </p>
                          <p className="text-zinc-400 text-xs mt-0.5">
                            Klik "Buat Akun Auditor" untuk menambahkan
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Data rows
                  filtered.map(a => (
                    <tr key={a.id} className="hover:bg-zinc-50 transition-colors">
                      {/* Kolom Auditor → foto + nama */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {a.foto
                            ? <img src={a.foto} alt={a.nama}
                                className="w-8 h-8 rounded-full object-cover border border-zinc-200 shrink-0"/>
                            : <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center
                                              justify-center shrink-0">
                                <span className="text-purple-700 text-xs font-bold">
                                  {a.nama?.[0]?.toUpperCase()}
                                </span>
                              </div>
                          }
                          <span className="text-sm font-semibold text-zinc-900">{a.nama}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-zinc-500">{a.email}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-700">{a.instansi}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-500">{a.bergabung || '-'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                          ${a.status === 'aktif'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-zinc-100 text-zinc-500'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleToggle(a.id)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg
                                        transition-colors border whitespace-nowrap
                              ${a.status === 'aktif'
                                ? 'border-red-200 text-red-700 hover:bg-yellow-50'
                                : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
                            {a.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button onClick={() => setLihatKredensial(a)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}