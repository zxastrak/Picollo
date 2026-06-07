import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import { authService } from '../services/authService'
import useAuthStore from '../store/authStore'

export default function Profil() {
  const { user, setUser } = useAuthStore()
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    no_telepon: user?.no_telepon || '',
    instansi: user?.instansi || '',
  })
  
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null)
  const [avatarFile, setAvatarFile] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        no_telepon: user.no_telepon || '',
        instansi: user.instansi || '',
      })
      setAvatarPreview(user.avatar_url || null)
    }
  }, [user])

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Ukuran file tidak boleh lebih dari 2MB')
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const payload = new FormData()
      payload.append('name', formData.name)
      payload.append('no_telepon', formData.no_telepon)
      payload.append('instansi', formData.instansi)
      if (avatarFile) {
        payload.append('avatar', avatarFile)
      }

      const res = await authService.updateProfile(payload)
      
      // Update global store
      if (res.data?.data) {
        // the response returns fresh user data, but without outlets probably. 
        // We can just fetch /me again to be safe
        const meRes = await authService.me()
        setUser(meRes.data.data)
        setSuccessMsg('Profil berhasil diperbarui!')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal memperbarui profil.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Pengaturan Profil</h2>
          <p className="text-zinc-500 text-sm mt-1">Kelola informasi pribadi dan foto profil Anda.</p>
        </div>

        {successMsg && (
          <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-semibold border border-green-100 flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-semibold border border-red-100 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Kiri: Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-zinc-100 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-zinc-300 font-bold uppercase">{user?.name?.charAt(0)}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-red-800 hover:bg-red-900 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors border-2 border-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              </div>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
                ref={fileInputRef}
                onChange={handleAvatarChange}
              />
              <p className="text-xs text-zinc-400 text-center max-w-[150px]">
                Format JPG/PNG. Maks 2MB.
              </p>
            </div>

            {/* Kanan: Form */}
            <div className="flex-1 space-y-5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-zinc-200 bg-zinc-50/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-800 focus:bg-white transition-all"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-1.5">Nomor Telepon</label>
                <input
                  type="text"
                  name="no_telepon"
                  value={formData.no_telepon}
                  onChange={handleChange}
                  className="w-full border border-zinc-200 bg-zinc-50/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-800 focus:bg-white transition-all"
                  placeholder="Contoh: 08123456789"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-1.5">Instansi <span className="text-zinc-400 font-normal">(Opsional)</span></label>
                <input
                  type="text"
                  name="instansi"
                  value={formData.instansi}
                  onChange={handleChange}
                  className="w-full border border-zinc-200 bg-zinc-50/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-800 focus:bg-white transition-all"
                  placeholder="Nama perusahaan atau instansi"
                />
              </div>
              
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-800 hover:bg-red-900 disabled:bg-zinc-300 text-white font-bold py-3 px-8 rounded-xl text-sm transition-colors shadow-lg shadow-red-900/20"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}
