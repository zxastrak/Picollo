import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { rekapService } from '../../services/rekapService'
import { transaksiService } from '../../services/transaksiService'
import { logKoreksiService } from '../../services/logKoreksiService'
import { laporanService } from '../../services/laporanService'
import useAuthStore from '../../store/authStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { productService } from '../../services/produkService'

const formatRupiah = (num) => {
  if (!num && num !== 0) return '-'
  return `Rp ${Number(num).toLocaleString('id-ID')}`
}

// ── Modal Koreksi ──
function ModalKoreksi({ transaksi, onClose, onSuccess, showToast }) {
  const [alasan, setAlasan] = useState('')
  const [metode, setMetode] = useState(transaksi.raw_metode || 'qris')
  const [type, setType] = useState('edit_items') // 'edit_items' = Ganti Harga, 'void' = Pembatalan
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState(
    (transaksi.raw_items || []).map(item => ({
      product_id: item.product_id,
      nama_produk: item.nama_produk,
      harga_satuan: Number(item.harga_satuan),
      qty: item.qty,
    }))
  )

  const handleIncrement = (productId) => {
    setItems(prev => prev.map(item => item.product_id === productId ? { ...item, qty: item.qty + 1 } : item))
  }

  const handleDecrement = (productId) => {
    setItems(prev => prev.map(item => {
      if (item.product_id === productId) {
        return { ...item, qty: item.qty - 1 }
      }
      return item
    }).filter(item => item.qty > 0))
  }

  const estimatedTotal = items.reduce((sum, item) => sum + (item.harga_satuan * item.qty), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!alasan) {
      showToast('Alasan koreksi harus diisi', 'error')
      return
    }
    if (type === 'edit_items' && items.length === 0) {
      showToast('Transaksi harus memiliki minimal 1 item, atau pilih Pembatalan', 'error')
      return
    }
    setLoading(true)
    try {
      const payload = {
        transaction_id: transaksi.db_id,
        alasan,
        correction_type: type,
      }
      if (type === 'edit_items') {
        payload.metode_pembayaran = metode
        payload.items = items.map(i => ({
          product_id: i.product_id,
          qty: i.qty
        }))
      }
      await logKoreksiService.create(payload)
      showToast('Permohonan koreksi berhasil diajukan.', 'success')
      onSuccess()
    } catch (err) {
      showToast('Gagal mengajukan koreksi: ' + (err.response?.data?.message || err.message), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
          <div>
            <h3 className="font-bold text-zinc-900 text-lg">Koreksi Data Transaksi</h3>
            <p className="text-zinc-500 text-xs mt-0.5 font-mono">No. TRX: {transaksi.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200/50 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
          <div className="space-y-4">
            <div>
              <label className="block text-zinc-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Pilihan Koreksi</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full border border-zinc-200 bg-zinc-50/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 focus:bg-white transition-all appearance-none cursor-pointer">
                <option value="edit_items">Ganti Harga (Ubah Metode/Item)</option>
                <option value="void">Pembatalan (Void)</option>
              </select>
            </div>
            
            {type === 'edit_items' && (
              <>
                <div>
                  <label className="block text-zinc-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Metode Pembayaran</label>
                  <select value={metode} onChange={e => setMetode(e.target.value)}
                    className="w-full border border-zinc-200 bg-zinc-50/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 focus:bg-white transition-all appearance-none cursor-pointer">
                    <option value="qris">QRIS</option>
                    <option value="tunai">Tunai</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-zinc-700 text-xs font-bold uppercase tracking-wide">Daftar Item Transaksi</label>
                  
                  {items.length === 0 ? (
                    <p className="text-xs text-red-500 italic py-2 text-center">Semua item telah dihapus. Silakan pilih opsi Pembatalan (Void).</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 border border-zinc-100 p-2 rounded-xl bg-zinc-50/50">
                      {items.map((item) => (
                        <div key={item.product_id} className="flex items-center justify-between text-sm py-1.5 border-b border-zinc-100 last:border-b-0">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-zinc-800 truncate">{item.nama_produk}</p>
                            <p className="text-xs text-zinc-400">{formatRupiah(item.harga_satuan)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button type="button" onClick={() => handleDecrement(item.product_id)}
                              className="w-6 h-6 bg-zinc-200 hover:bg-zinc-300 rounded-full flex items-center justify-center text-zinc-800 font-bold transition-colors">
                              −
                            </button>
                            <span className="font-bold text-zinc-900 w-5 text-center">{item.qty}</span>
                            <button type="button" onClick={() => handleIncrement(item.product_id)}
                              className="w-6 h-6 bg-zinc-200 hover:bg-zinc-300 rounded-full flex items-center justify-center text-zinc-800 font-bold transition-colors">
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs font-bold bg-yellow-50 text-yellow-800 p-3 rounded-xl border border-yellow-100 mt-2">
                    <span>Estimasi Total Baru:</span>
                    <span className="text-sm font-extrabold">{formatRupiah(estimatedTotal)}</span>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-zinc-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Alasan Koreksi <span className="text-red-500">*</span></label>
              <textarea value={alasan} onChange={e => setAlasan(e.target.value)}
                className="w-full border border-zinc-200 bg-zinc-50/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 focus:bg-white transition-all min-h-[80px] resize-none"
                placeholder="Jelaskan secara detail alasan melakukan koreksi..." required />
            </div>
          </div>

          <div className="flex gap-3 pt-2 shrink-0">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 bg-zinc-100 text-zinc-700 font-bold py-3.5 rounded-xl text-sm hover:bg-zinc-200 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-300 disabled:text-zinc-500 text-zinc-900 font-bold py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-yellow-500/20">
              {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal Konfirmasi Kirim ──
function ModalKonfirmasiKirim({ onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="font-bold text-zinc-900 text-lg">Konfirmasi Kirim Rekap</h3>
          </div>
          <button onClick={onClose} disabled={loading} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200/50 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-zinc-600">
            Apakah Anda yakin ingin mengirim rekap harian ini ke admin? Data yang sudah dikirim tidak dapat diubah kembali.
          </p>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 bg-zinc-100 text-zinc-700 font-bold py-3.5 rounded-xl text-sm hover:bg-zinc-200 transition-colors">
              Batal
            </button>
            <button type="button" onClick={onConfirm} disabled={loading}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-300 disabled:text-zinc-500 text-zinc-900 font-bold py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-yellow-500/20">
              {loading ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function KasirRekapHarian() {
  const [data, setData] = useState(null)
  const [aktivitasPerJam, setAktivitasPerJam] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [selectedKoreksi, setSelectedKoreksi] = useState(null)
  const [showConfirmKirim, setShowConfirmKirim] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const { user, outlets } = useAuthStore()
  async function fetchData() {
    setLoading(true)
    try {
      const todayLocal = new Date().toLocaleDateString('sv-SE')

      // Fetch transaksi hari ini
      const res = await transaksiService.getAll({ all: true })
      const rawTx = res.data.data?.data || res.data.data || []
      
      // Abaikan transaksi yang berstatus voided di sisi kasir (hanya tampil di log pembatalan admin)
      const allTx = rawTx.filter(tx => tx.status !== 'voided')
      
      const todayTx = allTx.filter(tx => {
        if (!tx.created_at) return false
        const txDate = new Date(tx.created_at).toLocaleDateString('sv-SE')
        return txDate === todayLocal
      })
      
      // Fetch rekap untuk cek status
      try {
        const rekapRes = await rekapService.getHarian()
        const allRekap = rekapRes.data.data?.data || rekapRes.data.data || []
        const isSentToday = allRekap.some(r => {
          const rDate = new Date(r.tanggal).toLocaleDateString('sv-SE')
          return rDate === todayLocal
        })
        if (isSentToday) setSent(true)
      } catch (err) {
        console.error('Gagal memuat status rekap', err)
      }

      // Hitung aktivitas per jam (00:00 - 23:59) secara lokal dari todayTx
      const hourlyData = []
      for (let i = 0; i < 24; i++) {
        const hourString = String(i).padStart(2, '0') + ':00'
        hourlyData.push({
          jam: hourString,
          transaksi: 0,
          koreksi: 0
        })
      }

      todayTx.forEach(tx => {
        if (tx.created_at) {
          const localHour = new Date(tx.created_at).getHours()
          if (localHour >= 0 && localHour < 24) {
            hourlyData[localHour].transaksi++
          }
        }
      })
      setAktivitasPerJam(hourlyData)
      
      const todayVoidTx = rawTx.filter(tx => {
        if (!tx.created_at || tx.status !== 'voided') return false
        const txDate = new Date(tx.created_at).toLocaleDateString('sv-SE')
        return txDate === todayLocal
      })

      const totalOmzet = todayTx.reduce((sum, tx) => sum + (Number(tx.total_amount) || 0), 0)
      const totalQris = todayTx.filter(tx => tx.metode_pembayaran === 'qris').reduce((sum, tx) => sum + (Number(tx.total_amount) || 0), 0)
      const totalTunai = todayTx.filter(tx => tx.metode_pembayaran === 'tunai').reduce((sum, tx) => sum + (Number(tx.total_amount) || 0), 0)
      
      setData({
        total_transaksi: todayTx.length,
        total_void: todayVoidTx.length,
        total_omzet: formatRupiah(totalOmzet),
        total_qris: formatRupiah(totalQris),
        total_tunai: formatRupiah(totalTunai),
        transaksi: [...todayTx, ...todayVoidTx].map(tx => ({
          db_id: tx.id,
          id: tx.transaction_code || tx.id,
          produk: tx.items?.map(i => i.nama_produk).join(', ') || '-',
          qty: tx.items?.reduce((s, i) => s + (i.qty || 0), 0) || 0,
          total: formatRupiah(tx.total_amount),
          metode: tx.metode_pembayaran === 'qris' ? 'QRIS' : tx.metode_pembayaran === 'transfer' ? 'Transfer' : 'Tunai',
          waktu: tx.created_at ? new Date(tx.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
          status: tx.hash_verification?.status || (tx.status === 'success' ? 'verified' : tx.status || 'pending'),
          raw_metode: tx.metode_pembayaran,
          raw_catatan: tx.catatan,
          raw_reference: tx.payment_reference,
          raw_items: tx.items || [],
        })),
      })
    } catch (err) {
      console.error('Fetch rekap error:', err)
      setData(null)
    }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleKirim = async () => {
    setSending(true)
    try {
      const outletId = outlets?.[0]?.id || user?.outlets?.[0]?.id
      if (!outletId) {
        showToast('Outlet tidak ditemukan', 'error')
        setSending(false)
        return
      }
      const todayLocal = new Date().toLocaleDateString('sv-SE')
      await rekapService.kirimKeAdmin({
        outlet_id: outletId,
        tanggal: todayLocal,
      })
      setSent(true)
      setShowConfirmKirim(false)
      showToast('Berhasil! Rekap harian telah dikirim ke Admin.', 'success')
    } catch (err) {
      console.error('Kirim rekap error:', err)
      showToast('Gagal kirim rekap: ' + (err.response?.data?.message || err.message), 'error')
    } finally { setSending(false) }
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">Rekap Harian</h2>
            <p className="text-zinc-500 text-sm mt-1">Laporan transaksi hari ini untuk disetorkan ke Admin.</p>
          </div>
          <button onClick={() => setShowConfirmKirim(true)} disabled={sending || sent || !data}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl
              ${sent ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-yellow-400 hover:bg-yellow-500 shadow-yellow-500/20 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none text-zinc-900'}`}>
            {sent ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Terkirim ke Admin
              </>
            ) : sending ? 'Mengirim...' : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                Kirim Laporan
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-zinc-200 rounded-2xl h-32 animate-pulse" />)}
          </div>
        ) : !data ? (
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-16 text-center text-zinc-400">
            <svg className="w-12 h-12 mx-auto mb-4 text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-sm">Belum ada data rekap. Transaksi hari ini akan muncul di sini.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
              {[
                { label: 'Total Transaksi', val: data.total_transaksi, color: 'bg-yellow-400' },
                { label: 'Jumlah Void',     val: data.total_void,      color: 'bg-red-500' },
                { label: 'Total Omzet',     val: data.total_omzet,     color: 'bg-zinc-800' },
                { label: 'QRIS',            val: data.total_qris,      color: 'bg-zinc-700' },
                { label: 'Tunai',           val: data.total_tunai,     color: 'bg-zinc-600' },
              ].map((s, i) => (
                <div key={i} className={`${s.color} rounded-2xl p-4 sm:p-5 text-white`}>
                  <p className="text-white/70 text-xs sm:text-sm font-medium mb-3">{s.label}</p>
                  <p className="text-xl sm:text-2xl font-bold">{s.val}</p>
                </div>
              ))}
            </div>

            {/* Grafik Aktivitas per Jam (Transaksi) */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
              <h3 className="font-bold text-zinc-900 text-sm mb-1">Aktivitas Transaksi per Jam</h3>
              <p className="text-zinc-400 text-xs mb-6">
                Pantau jam sibuk Anda hari ini untuk evaluasi performa.
              </p>
              {aktivitasPerJam.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-zinc-400 text-sm bg-zinc-50 rounded-xl">
                  Belum ada data aktivitas
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={aktivitasPerJam} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                    <XAxis dataKey="jam" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                    <Bar dataKey="transaksi" name="Total Transaksi" fill="#27272a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tabel transaksi hari ini */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  </div>
                  <h3 className="font-bold text-zinc-900">Rincian Transaksi</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-zinc-100">
                      {['ID / Waktu', 'Produk', 'Total', 'Metode', 'Status', 'Aksi'].map(h => (
                        <th key={h} className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50/80">
                    {(data.transaksi || []).length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-16 text-center text-zinc-400 text-sm font-medium">Belum ada transaksi hari ini</td></tr>
                    ) : (data.transaksi || []).map(tx => (
                      <tr key={tx.id} className="hover:bg-zinc-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold font-mono text-zinc-900 group-hover:text-yellow-600 transition-colors">{tx.id}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{tx.waktu}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-zinc-800 line-clamp-1">{tx.produk}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{tx.qty} item</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-extrabold text-zinc-900">{tx.total}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold
                            ${tx.metode === 'QRIS' ? 'bg-blue-50 text-blue-700' : tx.metode === 'Tunai' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'}`}>
                            {tx.metode}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
                            ${tx.status === 'verified' ? 'bg-green-50 text-green-700' : tx.status === 'voided' ? 'bg-zinc-100 text-zinc-500' : 'bg-orange-50 text-orange-700'}`}>
                            {tx.status === 'verified' && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                            {tx.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                            {tx.status === 'voided' && <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />}
                            <span className="capitalize">{tx.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {tx.status !== 'voided' && (
                            <button onClick={() => setSelectedKoreksi(tx)}
                              className="inline-flex items-center gap-1.5 text-xs bg-white border border-zinc-200 hover:border-yellow-300 hover:bg-yellow-50 text-zinc-700 hover:text-yellow-600 font-bold px-4 py-2 rounded-xl transition-all shadow-sm">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              Koreksi
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-2xl">
          {toast.type === 'success' ? (
            <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span className="text-white text-sm font-semibold whitespace-nowrap">{toast.msg}</span>
        </div>
      )}

      {selectedKoreksi && (
        <ModalKoreksi
          transaksi={selectedKoreksi}
          onClose={() => setSelectedKoreksi(null)}
          onSuccess={() => {
            setSelectedKoreksi(null)
            fetchData()
          }}
          showToast={showToast}
        />
      )}

      {showConfirmKirim && (
        <ModalKonfirmasiKirim
          loading={sending}
          onClose={() => setShowConfirmKirim(false)}
          onConfirm={handleKirim}
        />
      )}
    </Layout>
  )
}