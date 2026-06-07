import { useState, useEffect, useRef } from 'react'
import Layout from '../../components/Layout'
import { productService } from '../../services/produkService'
import { outletService } from '../../services/outletService'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorState from '../../components/ErrorState'

// ── Modal Produk dengan Upload Foto ──
function ModalProduk({ data, outlets, onClose, onSave }) {
  const [form, setForm] = useState({
    nama: data?.nama || '',
    kategori: data?.kategori || '',
    harga: data?.harga || '',
    modal: data?.modal || '',
    deskripsi: data?.deskripsi || '',
    status: data?.status || 'aktif',
  })
  const [foto, setFoto] = useState(data?.foto || null)
  const [fotoPreview, setFotoPreview] = useState(data?.foto || null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  const set = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(p => ({ ...p, [f]: null })) }

  const handleFile = (file) => {
    if (!file) return
    // Validasi
    if (!file.type.startsWith('image/')) {
      setErrors(p => ({ ...p, foto: 'File harus berupa gambar (JPG, PNG, WebP)' }))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors(p => ({ ...p, foto: 'Ukuran foto maksimal 2MB' }))
      return
    }
    setErrors(p => ({ ...p, foto: null }))
    setFoto(file)
    const reader = new FileReader()
    reader.onload = (e) => setFotoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleSave = async () => {
    const e = {}
    if (!form.nama) e.nama = 'Nama produk tidak boleh kosong'
    if (!form.harga) e.harga = 'Harga tidak boleh kosong'
    else if (isNaN(form.harga)) e.harga = 'Harga harus berupa angka'
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      await onSave({
        nama: form.nama,
        kategori: form.kategori,
        harga: parseFloat(form.harga),
        modal: form.modal ? parseFloat(form.modal) : null,
        is_active: form.status === 'aktif',
        deskripsi: form.deskripsi,
        foto: fotoPreview,
      })
    } catch (err) {
      setErrors({ global: err.response?.data?.message || 'Gagal menyimpan produk' })
    } finally { setLoading(false) }
  }

  const inputCls = (f) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400
     focus:outline-none transition-colors
     ${errors[f] ? 'border-red-400 bg-red-50' : 'border-zinc-300 focus:border-red-800'}`

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h3 className="font-bold text-zinc-900">{data ? 'Edit Produk' : 'Tambah Produk'}</h3>
            <p className="text-zinc-400 text-xs mt-0.5">Produk tersedia di semua outlet</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {errors.global && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {errors.global}
            </div>
          )}

          {/* ── Upload Foto ── */}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-2 block">
              Foto Produk <span className="text-zinc-400 font-normal">(opsional, maks. 2MB)</span>
            </label>

            {fotoPreview ? (
              /* Preview foto */
              <div className="relative group rounded-2xl overflow-hidden border-2 border-zinc-200">
                <img src={fotoPreview} alt="preview"
                  className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                                transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 bg-white text-zinc-900 font-semibold
                               px-4 py-2 rounded-xl text-sm hover:bg-zinc-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Ganti Foto
                  </button>
                  <button
                    onClick={() => { setFoto(null); setFotoPreview(null) }}
                    className="flex items-center gap-2 bg-red-600 text-white font-semibold
                               px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              /* Drag & drop area */
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
                            transition-all duration-200
                            ${dragging
                    ? 'border-red-400 bg-red-50 scale-[1.01]'
                    : errors.foto
                      ? 'border-red-300 bg-red-50'
                      : 'border-zinc-300 hover:border-red-300 hover:bg-red-50/50'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3
                  ${dragging ? 'bg-red-100' : 'bg-zinc-100'}`}>
                  <svg className={`w-6 h-6 ${dragging ? 'text-red-500' : 'text-zinc-400'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {dragging ? (
                  <p className="text-red-600 font-semibold text-sm">Lepaskan untuk upload</p>
                ) : (
                  <>
                    <p className="text-zinc-700 font-semibold text-sm mb-1">
                      Drag & drop atau klik untuk pilih foto
                    </p>
                    <p className="text-zinc-400 text-xs">JPG, PNG, WebP — Maks. 2MB</p>
                  </>
                )}
              </div>
            )}

            {/* Hidden file input */}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => handleFile(e.target.files[0])} />
            {errors.foto && <p className="text-xs text-red-500 mt-1">{errors.foto}</p>}
          </div>

          {/* ── Nama Produk ── */}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Nama Produk</label>
            <input type="text" value={form.nama} onChange={e => set('nama', e.target.value)}
              placeholder="Contoh: Kopi Hitam" className={inputCls('nama')} />
            {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
          </div>

          {/* ── Kategori, Harga & HPP ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Kategori</label>
              <input type="text" value={form.kategori} onChange={e => set('kategori', e.target.value)}
                placeholder="Minuman / Makanan" className={inputCls('kategori')} />
            </div>
            <div>
              <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Harga Jual (Rp)</label>
              <input type="number" value={form.harga} onChange={e => set('harga', e.target.value)}
                placeholder="15000" className={inputCls('harga')} />
              {errors.harga && <p className="text-xs text-red-500 mt-1">{errors.harga}</p>}
            </div>
            <div>
              <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">HPP / Modal (Rp)</label>
              <input type="number" value={form.modal} onChange={e => set('modal', e.target.value)}
                placeholder="10000" className={inputCls('modal')} />
            </div>
          </div>

          {/* ── Deskripsi ── */}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">
              Deskripsi <span className="text-zinc-400 font-normal">(opsional)</span>
            </label>
            <textarea value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)}
              placeholder="Deskripsi singkat produk..." rows={2}
              className={inputCls('deskripsi') + ' resize-none'} />
          </div>

          {/* ── Status ── */}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-2 block">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'aktif', label: 'Aktif', icon: '✓' },
                { val: 'nonaktif', label: 'Nonaktif', icon: '✕' },
              ].map(s => (
                <button key={s.val} type="button" onClick={() => set('status', s.val)}
                  className={`py-2.5 rounded-xl text-sm font-semibold capitalize transition-all border
                    ${form.status === s.val
                      ? s.val === 'aktif'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-zinc-700 text-white border-zinc-700'
                      : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400'}`}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 flex gap-2 sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onClose}
            className="flex-1 border border-zinc-300 text-zinc-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-zinc-50 transition-colors">
            Batal
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 bg-red-800 hover:bg-red-900 disabled:bg-red-900/50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
            {loading
              ? <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Menyimpan...
              </span>
              : data ? 'Simpan Perubahan' : 'Tambah Produk'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminProduk() {
  const [produk, setProduk] = useState([])
  const [outlets, setOutlets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('semua')
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const outletRes = await outletService.getAll()
      setOutlets(outletRes.data.data || [])

      const res = await productService.getAll()
      const mapped = (res.data.data || []).map(p => ({
        id: p.id,
        nama: p.nama,
        kategori: p.kategori,
        harga: p.harga,
        modal: p.modal,
        deskripsi: p.deskripsi || '',
        status: p.is_active ? 'aktif' : 'nonaktif',
        foto: p.gambar_url || null,
      }))
      setProduk(mapped)
    } catch {
      setProduk([])
      setOutlets([])
    } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    try {
      await productService.delete(id)
      setProduk(prev => prev.filter(p => p.id !== id))
      setDeleteConfirm(null)
    } catch {
      alert('Gagal menghapus produk')
    }
  }

  const kategoriList = ['semua', ...new Set(produk.map(p => p.kategori).filter(Boolean))]

  const filtered = produk.filter(p => {
    const matchSearch = p.nama?.toLowerCase().includes(search.toLowerCase())
    const matchKategori = filterKategori === 'semua' || p.kategori === filterKategori
    return matchSearch && matchKategori
  })

  return (
    <Layout>
      {/* Modal Tambah/Edit */}
      {showModal && (
        <ModalProduk
          data={editData}
          outlets={outlets}
          onClose={() => { setShowModal(false); setEditData(null) }}
          onSave={async (item) => {
            const payload = {
              nama: item.nama,
              kategori: item.kategori,
              harga: item.harga,
              modal: item.modal,
              is_active: item.is_active,
              deskripsi: item.deskripsi,
              gambar_url: item.foto, // save the foto preview/url
            }
            if (editData) {
              const res = await productService.update(editData.id, payload)
              const updated = {
                id: res.data.data.id,
                nama: res.data.data.nama,
                kategori: res.data.data.kategori,
                harga: res.data.data.harga,
                modal: res.data.data.modal,
                deskripsi: res.data.data.deskripsi || '',
                status: res.data.data.is_active ? 'aktif' : 'nonaktif',
                outlets: res.data.data.outlets || [],
                foto: res.data.data.gambar_url || null,
              }
              setProduk(prev => prev.map(p => p.id === editData.id ? updated : p))
            } else {
              const res = await productService.create(payload)
              const created = {
                id: res.data.data.id,
                nama: res.data.data.nama,
                kategori: res.data.data.kategori,
                harga: res.data.data.harga,
                modal: res.data.data.modal,
                deskripsi: res.data.data.deskripsi || '',
                status: res.data.data.is_active ? 'aktif' : 'nonaktif',
                outlets: res.data.data.outlets || [],
                foto: res.data.data.gambar_url || null,
              }
              setProduk(prev => [...prev, created])
            }
            setShowModal(false)
            setEditData(null)
          }}
        />
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-bold text-zinc-900 mb-1">Hapus Produk?</h3>
            <p className="text-zinc-500 text-sm mb-6">
              <strong>{deleteConfirm.nama}</strong> akan dihapus permanen dan tidak dapat dikembalikan.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-zinc-300 text-zinc-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-zinc-50 transition-colors">
                Batal
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Produk</h2>
            <p className="text-zinc-500 text-sm mt-0.5">
              Kelola daftar semua produk. Untuk mengaktifkan dan mengatur stok, pergi ke menu Manajemen Outlet.
            </p>
          </div>
          <button onClick={() => { setEditData(null); setShowModal(true) }}
            className="flex items-center gap-2 bg-red-800 hover:bg-red-900 text-white
                       font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors self-start sm:self-auto shadow-lg shadow-red-900/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Produk
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Produk', val: produk.length, color: 'bg-zinc-900' },
            { label: 'Aktif', val: produk.filter(p => p.status !== 'nonaktif').length, color: 'bg-green-700' },
            { label: 'Nonaktif', val: produk.filter(p => p.status === 'nonaktif').length, color: 'bg-zinc-500' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl px-5 py-4 text-white`}>
              <p className="text-white/70 text-xs font-medium">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter Kategori */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3">
          <div className="relative">
            <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama produk..."
              className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm
                         focus:outline-none focus:border-red-800 transition-colors" />
          </div>
          {kategoriList.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {kategoriList.map(k => (
                <button key={k} onClick={() => setFilterKategori(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border
                    ${filterKategori === k
                      ? 'bg-red-800 text-white border-red-800'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-red-300'}`}>
                  {k}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid Produk */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-zinc-200 rounded-2xl h-56 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-16 text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-zinc-900 font-semibold mb-1">Belum ada produk</p>
            <p className="text-zinc-400 text-sm">Klik "Tambah Produk" untuk menambahkan produk pertama</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(p => (
              <div key={p.id}
                className="bg-white rounded-2xl border border-zinc-200 overflow-hidden
                           hover:border-red-200 hover:shadow-md transition-all group">

                {/* Foto Produk */}
                <div className="relative h-36 bg-zinc-100 overflow-hidden">
                  {p.foto ? (
                    <img src={p.foto} alt={p.nama}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <svg className="w-10 h-10 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-zinc-400 text-xs">Belum ada foto</p>
                    </div>
                  )}
                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                      ${p.status === 'nonaktif'
                        ? 'bg-zinc-800/80 text-zinc-300'
                        : 'bg-green-600/90 text-white'}`}>
                      {p.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3.5">
                  <p className="font-bold text-zinc-900 text-sm truncate">{p.nama}</p>
                  <p className="text-zinc-400 text-xs mb-1.5">{p.kategori || 'Tanpa kategori'}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-red-800 font-bold text-base">
                      Rp {Number(p.harga).toLocaleString('id-ID')}
                    </p>
                    {p.modal && (
                      <p className="text-zinc-400 text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                        HPP: Rp {Number(p.modal).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                  {p.deskripsi && (
                    <p className="text-zinc-500 text-xs mb-3 line-clamp-2">{p.deskripsi}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <button onClick={() => { setEditData(p); setShowModal(true) }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg
                                 border border-zinc-200 text-zinc-600 text-xs font-semibold
                                 hover:border-zinc-400 hover:bg-zinc-50 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button onClick={() => setDeleteConfirm(p)}
                      className="flex items-center justify-center p-1.5 rounded-lg
                                 border border-zinc-200 text-zinc-400
                                 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}