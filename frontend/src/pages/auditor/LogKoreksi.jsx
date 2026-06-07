import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { logKoreksiService } from '../../services/logKoreksiService'
import useAuthStore from '../../store/authStore'
import DateFilter from '../../components/DateFilter'

const formatRupiah = (num) => {
  if (!num && num !== 0) return '-'
  return `Rp ${Number(num).toLocaleString('id-ID')}`
}

// Hitung ringkasan perubahan dari old_data dan new_data
function getPerubahanRingkasan(l) {
  if (l.correction_type === 'void') return 'Transaksi di-void'

  const changes = []
  const oldData = l.old_data || {}
  const newData = l.new_data || {}

  // Cek perubahan total_amount (harga)
  if (oldData.total_amount !== undefined && newData.total_amount !== undefined) {
    const oldAmt = Number(oldData.total_amount)
    const newAmt = Number(newData.total_amount)
    if (oldAmt !== newAmt) {
      changes.push(`Total: ${formatRupiah(oldAmt)} → ${formatRupiah(newAmt)}`)
    }
  }

  // Cek perubahan metode pembayaran
  if (oldData.metode_pembayaran && newData.metode_pembayaran && oldData.metode_pembayaran !== newData.metode_pembayaran) {
    changes.push(`Metode: ${oldData.metode_pembayaran} → ${newData.metode_pembayaran}`)
  }

  // Cek perubahan catatan
  if (oldData.catatan !== newData.catatan && (oldData.catatan || newData.catatan)) {
    changes.push(`Catatan diubah`)
  }

  // Cek perubahan payment_reference
  if (oldData.payment_reference !== newData.payment_reference && (oldData.payment_reference || newData.payment_reference)) {
    changes.push(`Referensi diubah`)
  }

  // Cek perubahan status
  if (oldData.status && newData.status && oldData.status !== newData.status) {
    changes.push(`Status: ${oldData.status} → ${newData.status}`)
  }

  // Cek perubahan items (edit_items)
  if (l.correction_type === 'edit_items') {
    const oldItems = oldData.items || []
    const newItems = newData.items || []
    const removedCount = oldItems.length - newItems.length
    if (removedCount > 0) {
      changes.push(`${removedCount} item dihapus`)
    }
  }

  if (changes.length === 0) {
    if (l.hash_sebelum || l.hash_sesudah) {
      return `Hash diperbarui`
    }
    return 'Data diperbarui'
  }

  return changes.join('; ')
}

// Hitung detail perubahan lengkap
function getPerubahanDetail(l) {
  const details = []
  const oldData = l.old_data || {}
  const newData = l.new_data || {}

  if (l.correction_type === 'void') {
    details.push({ label: 'Aksi', lama: 'Aktif', baru: 'Di-void' })
    if (oldData.total_amount) {
      details.push({ label: 'Total', lama: formatRupiah(oldData.total_amount), baru: 'Rp 0' })
    }
    return details
  }

  if (oldData.total_amount !== undefined && newData.total_amount !== undefined) {
    const oldAmt = Number(oldData.total_amount)
    const newAmt = Number(newData.total_amount)
    if (oldAmt !== newAmt) {
      details.push({ label: 'Total', lama: formatRupiah(oldAmt), baru: formatRupiah(newAmt) })
    }
  }

  if (oldData.metode_pembayaran && newData.metode_pembayaran && oldData.metode_pembayaran !== newData.metode_pembayaran) {
    details.push({ label: 'Metode Pembayaran', lama: oldData.metode_pembayaran, baru: newData.metode_pembayaran })
  }

  if (oldData.catatan !== newData.catatan) {
    details.push({ label: 'Catatan', lama: oldData.catatan || '(kosong)', baru: newData.catatan || '(kosong)' })
  }

  if (oldData.payment_reference !== newData.payment_reference) {
    details.push({ label: 'Referensi Pembayaran', lama: oldData.payment_reference || '(kosong)', baru: newData.payment_reference || '(kosong)' })
  }

  if (oldData.status !== newData.status) {
    details.push({ label: 'Status', lama: oldData.status || '-', baru: newData.status || '-' })
  }

  if (l.correction_type === 'edit_items') {
    const oldItems = oldData.items || []
    const newItems = newData.items || []
    const newItemIds = new Set(newItems.map(i => i.id))
    const removed = oldItems.filter(i => !newItemIds.has(i.id))
    removed.forEach(item => {
      details.push({
        label: `Item Dihapus`,
        lama: `${item.nama_produk || 'Produk'} x${item.qty} (${formatRupiah(item.subtotal)})`,
        baru: '(dihapus)'
      })
    })
  }

  return details
}

export default function AuditorLogKoreksi() {
  const { activeOutletId } = useAuthStore()
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterTipe, setFilterTipe] = useState('semua')
  const [filterDateRange, setFilterDateRange] = useState({ start_date: '', end_date: '', date: '' })
  const [detail, setDetail] = useState(null)

  useEffect(() => { fetchData() }, [filterDateRange, activeOutletId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = { all: true, outlet_id: activeOutletId }
      if (filterDateRange.start_date && filterDateRange.end_date) {
        params.start_date = filterDateRange.start_date
        params.end_date = filterDateRange.end_date
      } else if (filterDateRange.date) {
        params.date = filterDateRange.date
      }
      const res = await logKoreksiService.getAll(params)
      const raw = res.data.data?.data || res.data.data || []
      const mapped = raw.map(l => ({
        id: l.id,
        waktu: l.created_at ? new Date(l.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-',
        kasir: l.corrected_by?.name || l.correctedBy?.name || '-',
        outlet: l.outlet?.nama || '-',
        tipe: l.correction_type === 'void' ? 'hapus' : l.correction_type || '-',
        transaksiId: l.transaction?.transaction_code || '-',
        perubahan: getPerubahanRingkasan(l),
        perubahan_detail: getPerubahanDetail(l),
        hash_sebelum_full: l.hash_sebelum || '-',
        hash_sesudah_full: l.hash_sesudah || '-',
        alasan: l.alasan || '-',
        disetujui: l.status === 'approved',
        status: l.status,
        isSuspicious: l.is_suspicious,
        fraudIndicators: l.fraud_indicators || [],
      }))
      setData(mapped)
    } catch (err) {
      console.error('Fetch log koreksi error:', err)
      setData([])
    }
    finally { setLoading(false) }
  }

  const tipeColor = {
    edit:       'bg-blue-100 text-blue-700',
    edit_items: 'bg-purple-100 text-purple-700',
    hapus:      'bg-red-100 text-red-700',
    tambah:     'bg-green-100 text-green-700',
  }

  const filtered = data.filter(d => {
    const matchSearch = d.kasir?.toLowerCase().includes(search.toLowerCase()) ||
                        d.transaksiId?.toLowerCase().includes(search.toLowerCase()) ||
                        d.perubahan?.toLowerCase().includes(search.toLowerCase())
    const matchTipe   = filterTipe === 'semua' || d.tipe === filterTipe
    return matchSearch && matchTipe
  })

  return (
    <Layout>
      <div className="space-y-6">

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Log Koreksi</h2>
            <p className="text-zinc-500 text-sm mt-0.5">
              Riwayat semua perubahan data transaksi
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200
                          text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Read Only
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-blue-700 text-xs">
            🔍 <strong>Audit Trail</strong> — Setiap perubahan transaksi tercatat di sini lengkap
            dengan waktu, pelaku, dan alasannya. Data ini digunakan untuk mendeteksi potensi
            manipulasi data.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Log',     val: data.length,                             color: 'bg-zinc-900' },
            { label: 'Edit',          val: data.filter(d => d.tipe === 'edit' || d.tipe === 'edit_items').length,  color: 'bg-blue-700' },
            { label: 'Hapus',         val: data.filter(d => d.tipe === 'hapus').length, color: 'bg-red-700' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl px-5 py-4 text-white`}>
              <p className="text-white/70 text-xs font-medium">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Filter & Search */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari kasir atau ID transaksi..."
                className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm
                           focus:outline-none focus:border-yellow-400 transition-colors"/>
            </div>
            <DateFilter onChange={setFilterDateRange} />
          </div>
          <div className="flex gap-2">
            {['semua', 'edit', 'edit_items', 'hapus'].map(t => (
              <button key={t} onClick={() => setFilterTipe(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize
                            transition-all border
                  ${filterTipe === t
                    ? 'bg-yellow-400 text-zinc-900 border-yellow-400'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-yellow-300'}`}>
                {t === 'edit_items' ? 'Edit Item' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  {['Waktu', 'Kasir', 'Outlet', 'Tipe', 'ID Transaksi', 'Perubahan', 'Alasan', 'Status', 'Aksi'].map(h => (
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
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={9} className="px-5 py-3">
                        <div className="h-8 bg-zinc-100 rounded-lg animate-pulse"/>
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <p className="text-zinc-500 text-sm">Belum ada log koreksi</p>
                    </td>
                  </tr>
                ) : filtered.map(d => (
                  <tr key={d.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-zinc-500 whitespace-nowrap">
                      {d.waktu}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900">
                      {d.kasir}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{d.outlet}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize
                        ${tipeColor[d.tipe] || 'bg-zinc-100 text-zinc-600'}`}>
                        {d.tipe === 'edit_items' ? 'Edit Item' : d.tipe}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-700">
                      {d.transaksiId}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-700 max-w-[250px]">
                      <p className="truncate">{d.perubahan}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500 max-w-xs">
                      <p>{d.alasan}</p>
                      {d.isSuspicious && d.fraudIndicators && d.fraudIndicators.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {d.fraudIndicators.map((ind, i) => (
                            <p key={i} className="text-red-600 font-medium text-[10px] bg-red-50 p-1.5 rounded">
                              🚨 {ind}
                            </p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                          ${d.disetujui
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'}`}>
                          {d.disetujui ? 'Disetujui' : 'Pending'}
                        </span>
                        {d.isSuspicious && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 uppercase tracking-wide border border-red-200">
                            ⚠️ Anomali
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <button onClick={() => setDetail(d)}
                        className="text-yellow-600 text-xs font-semibold hover:underline">Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Detail Koreksi */}
      {detail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900">Detail Koreksi</h3>
              <button onClick={() => setDetail(null)} className="text-zinc-400 hover:text-zinc-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              {/* Info Umum */}
              <div className="space-y-2">
                {Object.entries({
                  'ID Transaksi': detail.transaksiId,
                  'Kasir': detail.kasir,
                  'Outlet': detail.outlet,
                  'Tipe Koreksi': detail.tipe === 'edit_items' ? 'Edit Item' : detail.tipe,
                  'Waktu': detail.waktu,
                  'Alasan': detail.alasan,
                  'Status': detail.disetujui ? 'Disetujui' : 'Pending',
                }).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-zinc-500">{k}</span>
                    <span className="text-zinc-900 font-medium text-right max-w-[60%]">{v}</span>
                  </div>
                ))}
              </div>

              {/* Fraud Indicators */}
              {detail.isSuspicious && detail.fraudIndicators.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-700 mb-2">⚠️ Indikator Anomali</p>
                  {detail.fraudIndicators.map((ind, i) => (
                    <p key={i} className="text-xs text-red-600 mb-1">🚨 {ind}</p>
                  ))}
                </div>
              )}

              {/* Perubahan Data */}
              {detail.perubahan_detail.length > 0 && (
                <div className="pt-3 border-t border-zinc-100">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Perubahan Data</p>
                  <div className="space-y-2">
                    {detail.perubahan_detail.map((d, i) => (
                      <div key={i} className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                        <p className="text-xs font-semibold text-zinc-500 mb-1.5">{d.label}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-red-600 line-through font-medium">{d.lama}</span>
                          <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <span className="text-green-600 font-semibold">{d.baru}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hash Signature */}
              <div className="pt-3 border-t border-zinc-100">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Hash Signature</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-zinc-400 mb-0.5">Hash Sebelum</p>
                    <p className="text-[11px] font-mono text-zinc-600 break-all bg-red-50 p-2 rounded-lg border border-red-100">{detail.hash_sebelum_full}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 mb-0.5">Hash Sesudah</p>
                    <p className="text-[11px] font-mono text-zinc-600 break-all bg-green-50 p-2 rounded-lg border border-green-100">{detail.hash_sesudah_full}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-100">
              <button onClick={() => setDetail(null)}
                className="w-full bg-zinc-900 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-zinc-800 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}