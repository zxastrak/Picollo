import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../services/api'
import { outletService } from '../../services/outletService'

const formatRupiah = (num) => {
  const val = Number(num)
  if (isNaN(val) || (!val && val !== 0)) return 'Rp 0'
  if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`
  if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}rb`
  return `Rp ${val.toLocaleString('id-ID')}`
}

function StatusBadge({ status }) {
  const map = {
    aktif: { label: 'Aktif', cls: 'bg-green-100 text-green-700' },
    warning: { label: 'Warning', cls: 'bg-orange-100 text-orange-700' },
    nonaktif: { label: 'Nonaktif', cls: 'bg-zinc-100 text-zinc-500' },
  }
  const s = map[status] || map.nonaktif
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
}

function SkeletonCard() {
  return <div className="bg-zinc-200 rounded-2xl h-44 animate-pulse" />
}

function EmptyState() {
  return (
    <div className="col-span-full bg-white rounded-2xl border border-zinc-200 p-16 text-center">
      <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <p className="text-zinc-900 font-semibold mb-1">Belum ada outlet</p>
      <p className="text-zinc-400 text-sm">Klik "Tambah Outlet" untuk membuat outlet pertama</p>
    </div>
  )
}

function ModalTambah({ onClose, onSave }) {
  const [form, setForm] = useState({ nama: '', alamat: '', kota: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const setField = (f, v) => {
    setForm(p => ({ ...p, [f]: v }))
    setErrors(p => ({ ...p, [f]: null }))
  }

  const handleSave = async () => {
    const e = {}
    if (!form.nama) e.nama = 'Nama outlet tidak boleh kosong'
    if (Object.keys(e).length) { setErrors(e); return }

    setLoading(true)
    try {
      // FIX: Sekarang hit API yang sesungguhnya
      const res = await api.post('/outlets', {
        nama: form.nama,
        alamat: form.alamat || null,
        kota: form.kota || null,
      })
      onSave(res.data.data)
    } catch (err) {
      setErrors({ global: err.response?.data?.message || 'Gagal membuat outlet' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <h3 className="font-bold text-zinc-900">Tambah Outlet Baru</h3>
            <p className="text-zinc-400 text-xs mt-0.5">Kasir diassign melalui menu Manajemen Kasir</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {errors.global && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {errors.global}
            </div>
          )}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Nama Outlet *</label>
            <input type="text" value={form.nama} onChange={e => setField('nama', e.target.value)}
              placeholder="Contoh: Outlet Surabaya"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors
                ${errors.nama ? 'border-red-400 bg-red-50' : 'border-zinc-300 focus:border-red-800'}`} />
            {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
          </div>
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Alamat</label>
            <textarea value={form.alamat} onChange={e => setField('alamat', e.target.value)}
              placeholder="Jl. Contoh No. 1" rows={3}
              className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:border-yellow-400 transition-colors resize-none" />
          </div>
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Kota</label>
            <input type="text" value={form.kota} onChange={e => setField('kota', e.target.value)}
              placeholder="Contoh: Surabaya"
              className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:border-yellow-400 transition-colors" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 flex gap-2">
          <button onClick={onClose}
            className="flex-1 border border-zinc-300 text-zinc-700 font-semibold py-2.5
                       rounded-xl text-sm hover:bg-zinc-50 transition-colors">
            Batal
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-400/50 text-zinc-900
                       font-semibold py-2.5 rounded-xl text-sm transition-colors">
            {loading ? 'Menyimpan...' : 'Simpan Outlet'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalEdit({ outlet, onClose, onUpdate }) {
  const [form, setForm] = useState({ nama: outlet.nama || '', alamat: outlet.alamat || '', kota: outlet.kota || '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const setField = (f, v) => {
    setForm(p => ({ ...p, [f]: v }))
    setErrors(p => ({ ...p, [f]: null }))
  }

  const handleSave = async () => {
    const e = {}
    if (!form.nama) e.nama = 'Nama outlet tidak boleh kosong'
    if (Object.keys(e).length) { setErrors(e); return }

    setLoading(true)
    try {
      const res = await api.put(`/outlets/${outlet.id}`, {
        nama: form.nama,
        alamat: form.alamat || null,
        kota: form.kota || null,
      })
      onUpdate(res.data.data)
    } catch (err) {
      setErrors({ global: err.response?.data?.message || 'Gagal mengubah outlet' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <h3 className="font-bold text-zinc-900">Edit Outlet</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {errors.global && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {errors.global}
            </div>
          )}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Nama Outlet *</label>
            <input type="text" value={form.nama} onChange={e => setField('nama', e.target.value)}
              placeholder="Contoh: Outlet Surabaya"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors
                ${errors.nama ? 'border-red-400 bg-red-50' : 'border-zinc-300 focus:border-red-800'}`} />
            {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
          </div>
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Alamat</label>
            <textarea value={form.alamat} onChange={e => setField('alamat', e.target.value)}
              placeholder="Jl. Contoh No. 1" rows={3}
              className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:border-yellow-400 transition-colors resize-none" />
          </div>
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Kota</label>
            <input type="text" value={form.kota} onChange={e => setField('kota', e.target.value)}
              placeholder="Contoh: Surabaya"
              className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:border-yellow-400 transition-colors" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 flex gap-2">
          <button onClick={onClose}
            className="flex-1 border border-zinc-300 text-zinc-700 font-semibold py-2.5
                       rounded-xl text-sm hover:bg-zinc-50 transition-colors">
            Batal
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-400/50 text-zinc-900
                       font-semibold py-2.5 rounded-xl text-sm transition-colors">
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalDetail({ outlet, onClose, onToggleStatus }) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      // FIX: Hit API yang sesungguhnya untuk toggle status
      const newStatus = outlet.status === 'nonaktif' ? 'aktif' : 'nonaktif'
      await api.put(`/outlets/${outlet.id}`, { status: newStatus })
      onToggleStatus(outlet.id, newStatus)
    } catch (err) {
      console.error('Gagal toggle status:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <h3 className="font-bold text-zinc-900">Detail Outlet</h3>
          <div className="flex gap-2">
            <button onClick={() => window.dispatchEvent(new CustomEvent('open-edit-outlet', { detail: outlet }))} className="text-zinc-400 hover:text-zinc-700 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="bg-zinc-50 rounded-xl p-4 space-y-2.5">
            {[
              { label: 'Kode Outlet', val: outlet.kode_outlet || '-' },
              { label: 'Nama', val: outlet.nama },
              { label: 'Alamat', val: outlet.alamat || '-' },
              { label: 'Kota', val: outlet.kota || '-' },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-zinc-500">{r.label}</span>
                <span className="text-zinc-900 font-medium">{r.val}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm items-center">
              <span className="text-zinc-500">Status</span>
              <StatusBadge status={outlet.status} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-zinc-100 flex gap-2">
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-atur-produk', { detail: outlet }))}
            className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold
                       py-2.5 rounded-xl text-sm transition-colors border border-zinc-200">
            Atur Menu & Stok
          </button>
          <button onClick={handleToggle} disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors border
              ${outlet.status === 'nonaktif'
                ? 'border-green-300 text-green-700 hover:bg-green-50'
                : 'border-red-300 text-red-700 hover:bg-yellow-50'}`}>
            {loading ? '...' : outlet.status === 'nonaktif' ? 'Aktifkan' : 'Nonaktifkan'}
          </button>
          <button onClick={onClose}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold
                       py-2.5 rounded-xl text-sm transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalAturProduk({ outlet, onClose }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [masterProducts, setMasterProducts] = useState([])
  const [selection, setSelection] = useState({}) // { [id]: { selected: boolean, stok: number } }

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        // Fetch Master Katalog
        const resMaster = await api.get('/products')
        const allProds = resMaster.data.data || []
        setMasterProducts(allProds)

        // Fetch Outlet's assigned products
        const resOutlet = await api.get(`/outlets/${outlet.id}/products`)
        const assigned = resOutlet.data.data || []

        // Build selection map
        const initialMap = {}
        allProds.forEach(p => {
          const matched = assigned.find(a => a.id === p.id)
          initialMap[p.id] = {
            selected: !!matched,
            stok: matched ? (matched.pivot?.stok || 0) : 0,
            harga: matched ? (matched.pivot?.harga || '') : '',
            modal: matched ? (matched.pivot?.modal || '') : ''
          }
        })
        setSelection(initialMap)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [outlet.id])

  const toggleSelect = (id) => {
    setSelection(prev => ({
      ...prev,
      [id]: { ...prev[id], selected: !prev[id].selected }
    }))
  }

  const changeStok = (id, val) => {
    setSelection(prev => ({
      ...prev,
      [id]: { ...prev[id], stok: val === '' ? '' : parseInt(val) }
    }))
  }

  const changeHarga = (id, val) => {
    setSelection(prev => ({
      ...prev,
      [id]: { ...prev[id], harga: val }
    }))
  }

  const changeModal = (id, val) => {
    setSelection(prev => ({
      ...prev,
      [id]: { ...prev[id], modal: val }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payloadProducts = Object.keys(selection)
        .filter(id => selection[id].selected)
        .map(id => ({
          id: parseInt(id),
          stok: selection[id].stok === '' ? 0 : selection[id].stok,
          harga: selection[id].harga === '' ? null : parseFloat(selection[id].harga),
          modal: selection[id].modal === '' ? null : parseFloat(selection[id].modal),
        }))

      await api.post(`/outlets/${outlet.id}/products`, { products: payloadProducts })
      onClose()
    } catch (err) {
      alert('Gagal menyimpan menu dan stok.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <h3 className="font-bold text-zinc-900">Atur Menu & Stok</h3>
            <p className="text-zinc-400 text-xs mt-0.5">Outlet: {outlet.nama}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <p className="text-zinc-500 animate-pulse">Memuat katalog...</p>
            </div>
          ) : masterProducts.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">
              Belum ada produk di Master Katalog.
            </div>
          ) : (
            <div className="space-y-3">
              {masterProducts.map(p => {
                const sel = selection[p.id] || { selected: false, stok: 0 }
                return (
                  <div key={p.id} className={`border rounded-xl p-3 flex items-center gap-4 transition-colors ${sel.selected ? 'border-yellow-300 bg-yellow-50/20' : 'border-zinc-200 bg-white'}`}>
                    {/* Toggle Button */}
                    <button onClick={() => toggleSelect(p.id)} className="shrink-0 outline-none">
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${sel.selected ? 'bg-yellow-400' : 'bg-zinc-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${sel.selected ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </button>

                    {/* Photo */}
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 shrink-0 overflow-hidden">
                      {p.gambar_url ? (
                        <img src={p.gambar_url} alt={p.nama} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <p className="font-semibold text-zinc-900 text-sm">{p.nama}</p>
                      <p className="text-zinc-500 text-xs">{p.kategori || 'Tanpa kategori'} • Rp {Number(p.harga).toLocaleString('id-ID')}</p>
                    </div>

                    {/* Stock, Harga, HPP Inputs */}
                    {sel.selected && (
                      <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end max-w-sm">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Stok</label>
                          <input type="number" min="0"
                            value={sel.stok === 0 ? '' : sel.stok}
                            placeholder="0"
                            onChange={e => changeStok(p.id, e.target.value)}
                            className="w-16 border border-zinc-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-yellow-400 text-center"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Harga (Rp)</label>
                          <input type="number" min="0"
                            value={sel.harga}
                            placeholder={p.harga}
                            onChange={e => changeHarga(p.id, e.target.value)}
                            className="w-20 border border-zinc-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-yellow-400 text-right"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">HPP (Rp)</label>
                          <input type="number" min="0"
                            value={sel.modal}
                            placeholder={p.modal || '-'}
                            onChange={e => changeModal(p.id, e.target.value)}
                            className="w-20 border border-zinc-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-yellow-400 text-right"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 flex gap-2 shrink-0">
          <button onClick={onClose}
            className="flex-1 border border-zinc-300 text-zinc-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-zinc-50 transition-colors">
            Batal
          </button>
          <button onClick={handleSave} disabled={loading || saving}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-400/50 text-zinc-900 font-semibold py-2.5 rounded-xl text-sm transition-colors">
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminOutlet() {
  const [outlets, setOutlets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilter] = useState('semua')
  const [showTambah, setShowTambah] = useState(false)
  const [detailOutlet, setDetail] = useState(null)
  const [aturOutlet, setAturOutlet] = useState(null)
  const [editOutlet, setEditOutlet] = useState(null)

  useEffect(() => { fetchOutlets() }, [])

  useEffect(() => {
    const handleOpenAtur = (e) => setAturOutlet(e.detail)
    const handleOpenEdit = (e) => setEditOutlet(e.detail)
    window.addEventListener('open-atur-produk', handleOpenAtur)
    window.addEventListener('open-edit-outlet', handleOpenEdit)
    return () => {
      window.removeEventListener('open-atur-produk', handleOpenAtur)
      window.removeEventListener('open-edit-outlet', handleOpenEdit)
    }
  }, [])

  const fetchOutlets = async () => {
    setLoading(true)
    try {
      // FIX: Hit API yang sesungguhnya
      const res = await outletService.getAll()
      setOutlets(res.data.data?.data || res.data.data || [])
    } catch (err) {
      console.error('Gagal fetch outlets:', err)
      setOutlets([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = (outlet) => {
    setOutlets(prev => [outlet, ...prev])
    setShowTambah(false)
  }

  const handleUpdate = (updatedOutlet) => {
    setOutlets(prev => prev.map(o => o.id === updatedOutlet.id ? { ...o, ...updatedOutlet } : o))
    if (detailOutlet && detailOutlet.id === updatedOutlet.id) {
      setDetail(prev => ({ ...prev, ...updatedOutlet }))
    }
    setEditOutlet(null)
  }

  // FIX: handleToggleStatus sekarang terima newStatus dari ModalDetail
  const handleToggleStatus = (id, newStatus) => {
    setOutlets(prev => prev.map(o =>
      o.id === id ? { ...o, status: newStatus } : o
    ))
    setDetail(prev => prev ? { ...prev, status: newStatus } : null)
  }

  const filtered = outlets.filter(o => {
    const matchSearch = o.nama?.toLowerCase().includes(search.toLowerCase()) ||
      o.alamat?.toLowerCase().includes(search.toLowerCase()) ||
      o.kota?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'semua' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total: outlets.length,
    aktif: outlets.filter(o => o.status === 'aktif').length,
    warning: outlets.filter(o => o.status === 'warning').length,
    nonaktif: outlets.filter(o => o.status === 'nonaktif').length,
  }

  return (
    <Layout>
      {showTambah && (
        <ModalTambah onClose={() => setShowTambah(false)} onSave={handleSave} />
      )}
      {detailOutlet && (
        <ModalDetail
          outlet={detailOutlet}
          onClose={() => setDetail(null)}
          onToggleStatus={handleToggleStatus}
        />
      )}
      {aturOutlet && (
        <ModalAturProduk
          outlet={aturOutlet}
          onClose={() => setAturOutlet(null)}
        />
      )}
      {editOutlet && (
        <ModalEdit
          outlet={editOutlet}
          onClose={() => setEditOutlet(null)}
          onUpdate={handleUpdate}
        />
      )}

      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Multi Outlet</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Kelola semua outlet bisnis Anda</p>
          </div>
          <button onClick={() => setShowTambah(true)}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-zinc-900
                       font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors
                       self-start sm:self-auto shadow-lg shadow-yellow-500/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Outlet
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Outlet', val: stats.total, color: 'bg-zinc-900' },
            { label: 'Aktif', val: stats.aktif, color: 'bg-green-600' },
            { label: 'Warning', val: stats.warning, color: 'bg-orange-500' },
            { label: 'Nonaktif', val: stats.nonaktif, color: 'bg-zinc-400' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl px-5 py-4 text-white`}>
              <p className="text-white/70 text-xs font-medium">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama atau alamat outlet..."
                className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm
                           focus:outline-none focus:border-yellow-400 transition-colors" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['semua', 'aktif', 'warning', 'nonaktif'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all border
                    ${filterStatus === f
                      ? 'bg-yellow-400 text-zinc-900 border-yellow-400'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-yellow-300'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading
            ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
              ? <EmptyState />
              : filtered.map(outlet => (
                <div key={outlet.id}
                  className="bg-white rounded-2xl border border-zinc-200 p-5
                             hover:border-yellow-200 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setDetail(outlet)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-400/20 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-zinc-900 font-bold text-sm">{outlet.nama}</p>
                        <p className="text-zinc-400 text-xs">{outlet.kode_outlet}</p>
                      </div>
                    </div>
                    <StatusBadge status={outlet.status} />
                  </div>

                  <p className="text-zinc-500 text-xs mb-4 line-clamp-2">
                    {outlet.alamat || outlet.kota || 'Alamat belum diisi'}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Kasir', val: outlet.total_kasir || 0 },
                      { label: 'Transaksi', val: outlet.total_transaksi || 0 },
                      { label: 'Omzet', val: formatRupiah(outlet.total_omzet || 0) },
                    ].map(s => (
                      <div key={s.label} className="bg-zinc-50 rounded-xl px-3 py-2.5 text-center">
                        <p className="text-zinc-900 font-bold text-xs">{s.val}</p>
                        <p className="text-zinc-400 text-xs">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </Layout>
  )
}