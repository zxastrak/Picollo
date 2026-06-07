import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { rekapService } from '../../services/rekapService'
import { transaksiService } from '../../services/transaksiService'
import { logKoreksiService } from '../../services/logKoreksiService'
import { laporanService } from '../../services/laporanService'
import useAuthStore from '../../store/authStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const formatRupiah = (num) => {
  if (!num && num !== 0) return '-'
  return `Rp ${Number(num).toLocaleString('id-ID')}`
}

// ── Modal Koreksi ──
function ModalKoreksi({ transaksi, onClose, onSuccess }) {
  const [alasan, setAlasan] = useState('')
  const [metode, setMetode] = useState(transaksi.raw_metode || 'qris')
  const [catatan, setCatatan] = useState(transaksi.raw_catatan || '')
  const [ref, setRef] = useState(transaksi.raw_reference || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!alasan) {
      alert('Alasan koreksi harus diisi')
      return
    }
    setLoading(true)
    try {
      const payload = {
        transaction_id: transaksi.db_id,
        alasan,
        correction_type: 'edit',
        new_data: {
          metode_pembayaran: metode,
          catatan,
          payment_reference: ref,
        }
      }
      await logKoreksiService.create(payload)
      alert('Permohonan koreksi berhasil diajukan.')
      onSuccess()
    } catch (err) {
      alert('Gagal mengajukan koreksi: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="font-bold text-zinc-900 text-lg">Koreksi Data Transaksi</h3>
            <p className="text-zinc-500 text-xs mt-0.5 font-mono">No. TRX: {transaksi.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200/50 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-zinc-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Metode Pembayaran</label>
              <select value={metode} onChange={e => setMetode(e.target.value)}
                className="w-full border border-zinc-200 bg-zinc-50/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 focus:bg-white transition-all appearance-none cursor-pointer">
                <option value="qris">QRIS</option>
                <option value="tunai">Tunai</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Ref Pembayaran <span className="text-zinc-400 font-normal">(Opsional)</span></label>
              <input type="text" value={ref} onChange={e => setRef(e.target.value)}
                className="w-full border border-zinc-200 bg-zinc-50/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 focus:bg-white transition-all"
                placeholder="Contoh: REF-12345" />
            </div>
            <div>
              <label className="block text-zinc-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Catatan <span className="text-zinc-400 font-normal">(Opsional)</span></label>
              <input type="text" value={catatan} onChange={e => setCatatan(e.target.value)}
                className="w-full border border-zinc-200 bg-zinc-50/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 focus:bg-white transition-all"
                placeholder="Contoh: Salah pilih metode" />
            </div>
            <div>
              <label className="block text-zinc-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Alasan Koreksi <span className="text-red-500">*</span></label>
              <textarea value={alasan} onChange={e => setAlasan(e.target.value)}
                className="w-full border border-zinc-200 bg-zinc-50/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 focus:bg-white transition-all min-h-[100px] resize-none"
                placeholder="Jelaskan secara detail alasan melakukan koreksi..." required />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
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
  const { user, outlets } = useAuthStore()
  async function fetchData() {
    setLoading(true)
    try {
      const todayLocal = new Date().toLocaleDateString('sv-SE')

      // Fetch transaksi hari ini
      const res = await transaksiService.getAll({ all: true })
      const allTx = res.data.data?.data || res.data.data || []
      
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

      // Fetch aktivitas per jam
      try {
        const reportRes = await laporanService.getKeuangan({
          start_date: todayLocal,
          end_date: todayLocal,
          outlet_id: user?.outlet_id || outlets?.[0]?.id
        })
        setAktivitasPerJam(reportRes.data.data?.aktivitas_per_jam || [])
      } catch (err) {
        console.error('Gagal memuat aktivitas per jam', err)
      }
      
      const totalOmzet = todayTx.reduce((sum, tx) => sum + (Number(tx.total_amount) || 0), 0)
      const totalQris = todayTx.filter(tx => tx.metode_pembayaran === 'qris').reduce((sum, tx) => sum + (Number(tx.total_amount) || 0), 0)
      const totalTunai = todayTx.filter(tx => tx.metode_pembayaran === 'tunai').reduce((sum, tx) => sum + (Number(tx.total_amount) || 0), 0)
      
      setData({
        total_transaksi: todayTx.length,
        total_omzet: formatRupiah(totalOmzet),
        total_qris: formatRupiah(totalQris),
        total_tunai: formatRupiah(totalTunai),
        transaksi: todayTx.map(tx => ({
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
      if (!outletId) { alert('Outlet tidak ditemukan'); setSending(false); return }
      const todayLocal = new Date().toLocaleDateString('sv-SE')
      await rekapService.kirimKeAdmin({
        outlet_id: outletId,
        tanggal: todayLocal,
      })
      setSent(true)
      setShowConfirmKirim(false)
      alert('Berhasil! Rekap harian telah dikirim ke Admin.')
    } catch (err) {
      console.error('Kirim rekap error:', err)
      alert('Gagal kirim rekap: ' + (err.response?.data?.message || err.message))
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
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Total Transaksi', val: data.total_transaksi, color: 'bg-yellow-400' },
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

      {selectedKoreksi && (
        <ModalKoreksi
          transaksi={selectedKoreksi}
          onClose={() => setSelectedKoreksi(null)}
          onSuccess={() => {
            setSelectedKoreksi(null)
            fetchData()
          }}
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