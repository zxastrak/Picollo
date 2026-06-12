import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { logKoreksiService } from '../../services/logKoreksiService'
import useAuthStore from '../../store/authStore'
import DateFilter from '../../components/DateFilter'

const formatRupiah = (num) => {
  if (!num && num !== 0) return '-'
  return `Rp ${Number(num).toLocaleString('id-ID')}`
}

// Hitung ringkasan perubahan dari old_data dan new_data dalam bentuk array lencana (badge)
function getPerubahanRingkasanArray(l) {
  if (l.correction_type === 'void') {
    return [{ type: 'void', text: 'Pembatalan (Void)', tooltip: 'Seluruh transaksi dibatalkan' }]
  }

  const badges = []
  const oldData = l.old_data || {}
  const newData = l.new_data || {}

  // Cek perubahan total_amount (harga)
  if (oldData.total_amount !== undefined && newData.total_amount !== undefined) {
    const oldAmt = Number(oldData.total_amount)
    const newAmt = Number(newData.total_amount)
    if (oldAmt !== newAmt) {
      badges.push({
        type: 'total',
        text: `💰 ${formatRupiah(oldAmt)} → ${formatRupiah(newAmt)}`,
        tooltip: `Total belanja disesuaikan dari ${formatRupiah(oldAmt)} menjadi ${formatRupiah(newAmt)}`
      })
    }
  }

  // Cek perubahan metode pembayaran
  if (oldData.metode_pembayaran && newData.metode_pembayaran && oldData.metode_pembayaran !== newData.metode_pembayaran) {
    const formatMetode = (m) => m === 'qris' ? 'QRIS' : m === 'transfer' ? 'Transfer' : 'Tunai'
    badges.push({
      type: 'metode',
      text: `💳 ${formatMetode(oldData.metode_pembayaran)} → ${formatMetode(newData.metode_pembayaran)}`,
      tooltip: `Metode pembayaran diubah`
    })
  }

  // Cek perubahan catatan
  if (oldData.catatan !== newData.catatan && (oldData.catatan || newData.catatan)) {
    badges.push({
      type: 'catatan',
      text: `📝 Catatan`,
      tooltip: `Catatan diubah: "${oldData.catatan || '(kosong)'}" → "${newData.catatan || '(kosong)'}"`
    })
  }

  // Cek perubahan payment_reference
  if (oldData.payment_reference !== newData.payment_reference && (oldData.payment_reference || newData.payment_reference)) {
    badges.push({
      type: 'referensi',
      text: `🔗 Ref: ${newData.payment_reference || 'Dihapus'}`,
      tooltip: `Referensi pembayaran diubah: "${oldData.payment_reference || '(kosong)'}" → "${newData.payment_reference || '(kosong)'}"`
    })
  }

  // Cek perubahan items (edit_items)
  if (l.correction_type === 'edit_items') {
    const oldItems = oldData.items || []
    const newItems = newData.items || []
    const oldItemsMap = new Map(oldItems.map(i => [i.product_id, i]))
    const newItemsMap = new Map(newItems.map(i => [i.product_id, i]))

    // Check removed
    const removedCount = oldItems.filter(i => !newItemsMap.has(i.product_id)).length
    if (removedCount > 0) {
      badges.push({
        type: 'item_removed',
        text: `❌ ${removedCount} Item Dihapus`,
        tooltip: `${removedCount} produk dihapus sepenuhnya dari transaksi`
      })
    }

    // Check added
    const addedCount = newItems.filter(i => !oldItemsMap.has(i.product_id)).length
    if (addedCount > 0) {
      badges.push({
        type: 'item_added',
        text: `➕ ${addedCount} Item Baru`,
        tooltip: `${addedCount} produk baru ditambahkan ke transaksi`
      })
    }

    // Check quantity changes
    let qtyChangeCount = 0
    newItems.forEach(newItem => {
      const oldItem = oldItemsMap.get(newItem.product_id)
      if (oldItem && oldItem.qty !== newItem.qty) {
        qtyChangeCount++
      }
    })
    if (qtyChangeCount > 0) {
      badges.push({
        type: 'item_qty',
        text: `✏️ ${qtyChangeCount} Qty Diubah`,
        tooltip: `${qtyChangeCount} produk mengalami penyesuaian kuantitas`
      })
    }
  }

  if (badges.length === 0) {
    if (l.hash_sebelum || l.hash_sesudah) {
      return [{ type: 'system', text: '🔒 Hash Diperbarui', tooltip: 'Hash cryptographic blockchain diperbarui' }]
    }
    return [{ type: 'other', text: 'Data Diperbarui', tooltip: 'Data transaksi diperbarui' }]
  }

  return badges
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

  // Items
  if (l.correction_type === 'edit_items') {
    const oldItems = oldData.items || []
    const newItems = newData.items || []
    const newItemProductIds = new Set(newItems.map(i => i.product_id))
    const oldItemsMap = new Map(oldItems.map(i => [i.product_id, i]))
    const newItemsMap = new Map(newItems.map(i => [i.product_id, i]))

    // 1. Items that were removed completely
    oldItems.forEach(oldItem => {
      if (!newItemProductIds.has(oldItem.product_id)) {
        details.push({
          label: `Item Dihapus`,
          lama: `${oldItem.nama_produk || 'Produk'} x${oldItem.qty} (${formatRupiah(oldItem.subtotal)})`,
          baru: '(dihapus)'
        })
      }
    })

    // 2. Items that were added completely
    newItems.forEach(newItem => {
      if (!oldItemsMap.has(newItem.product_id)) {
        details.push({
          label: `Item Ditambahkan`,
          lama: '(tidak ada)',
          baru: `${newItem.nama_produk || 'Produk'} x${newItem.qty} (${formatRupiah(newItem.subtotal)})`
        })
      }
    })

    // 3. Items whose quantity was changed
    newItems.forEach(newItem => {
      const oldItem = oldItemsMap.get(newItem.product_id)
      if (oldItem && oldItem.qty !== newItem.qty) {
        details.push({
          label: `Jumlah Item Diubah`,
          lama: `${oldItem.nama_produk || 'Produk'} x${oldItem.qty} (${formatRupiah(oldItem.subtotal)})`,
          baru: `${newItem.nama_produk || 'Produk'} x${newItem.qty} (${formatRupiah(newItem.subtotal)})`
        })
      }
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

  // State interaktif untuk salin hash
  const [copiedSebelum, setCopiedSebelum] = useState(false)
  const [copiedSesudah, setCopiedSesudah] = useState(false)

  const handleCloseDetail = () => {
    setDetail(null)
    setCopiedSebelum(false)
    setCopiedSesudah(false)
  }

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'sebelum') {
        setCopiedSebelum(true)
        setTimeout(() => setCopiedSebelum(false), 1500)
      } else {
        setCopiedSesudah(true)
        setTimeout(() => setCopiedSesudah(false), 1500)
      }
    } catch (err) {
      console.error('Gagal menyalin hash:', err)
    }
  }

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
        tipe: l.correction_type === 'void' ? 'void' : l.correction_type || '-',
        transaksiId: l.transaction?.transaction_code || '-',
        perubahan_badges: getPerubahanRingkasanArray(l),
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
    void:       'bg-red-100 text-red-700',
    tambah:     'bg-green-100 text-green-700',
  }

  const filtered = data.filter(d => {
    const matchSearch = d.kasir?.toLowerCase().includes(search.toLowerCase()) ||
                        d.transaksiId?.toLowerCase().includes(search.toLowerCase()) ||
                        d.perubahan_badges?.some(b => b.text.toLowerCase().includes(search.toLowerCase())) ||
                        d.alasan?.toLowerCase().includes(search.toLowerCase())
    const matchTipe   = filterTipe === 'semua' || d.tipe === filterTipe
    return matchSearch && matchTipe
  })

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <span>Log Koreksi Transaksi</span>
            </h2>
            <p className="text-zinc-500 text-sm mt-0.5">
              Riwayat pengawasan audit trail dan perubahan transaksi kasir secara lengkap
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/60
                          text-amber-700 text-xs font-bold px-3.5 py-2 rounded-xl self-start sm:self-auto shadow-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <span>Mode Baca Saja (Read-Only)</span>
          </div>
        </div>

        {/* Audit Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border border-blue-100 rounded-2xl p-4.5 flex gap-3.5 items-start shadow-xs">
          <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
          <div>
            <p className="text-blue-800 text-xs font-semibold leading-relaxed">
              <strong>Cryptographic Audit Trail</strong> — Setiap perubahan data transaksi dikunci secara kriptografis menggunakan blockchain signature hash sebelum dan sesudah perubahan. Gunakan data audit ini untuk melacak dan memverifikasi potensi anomali manipulasi data kasir.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Total Audit Log', val: data.length, color: 'bg-zinc-900' },
            { label: 'Koreksi Data / Item', val: data.filter(d => d.tipe === 'edit' || d.tipe === 'edit_items').length, color: 'bg-zinc-700' },
            { label: 'Pembatalan (Void)', val: data.filter(d => d.tipe === 'void').length, color: 'bg-red-700' },
          ].map(card => (
            <div key={card.label} className={`${card.color} rounded-2xl p-4 sm:p-5 text-white`}>
              <p className="text-white/70 text-xs sm:text-sm font-medium mb-3">{card.label}</p>
              <p className="text-xl sm:text-2xl font-bold">{card.val}</p>
            </div>
          ))}
        </div>

        {/* Filter & Search */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4.5 space-y-4 shadow-xs">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-zinc-450 absolute left-3.5 top-1/2 -translate-y-1/2"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari kasir, ID transaksi, alasan, atau tag perubahan..."
                className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm
                           focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"/>
            </div>
            <DateFilter onChange={setFilterDateRange} />
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100">
            {['semua', 'edit', 'edit_items', 'void'].map(t => {
              const isActive = filterTipe === t
              let activeClass = 'bg-yellow-400 text-zinc-900 border-yellow-400'
              let hoverClass = 'hover:border-yellow-300 hover:bg-yellow-50/20'
              
              if (isActive) {
                if (t === 'semua') activeClass = 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                else if (t === 'edit') activeClass = 'bg-blue-600 text-white border-blue-600 shadow-xs'
                else if (t === 'edit_items') activeClass = 'bg-purple-600 text-white border-purple-600 shadow-xs'
                else if (t === 'void') activeClass = 'bg-red-600 text-white border-red-600 shadow-xs'
              } else {
                if (t === 'semua') hoverClass = 'hover:border-zinc-400 hover:text-zinc-900'
                else if (t === 'edit') hoverClass = 'hover:border-blue-300 hover:text-blue-600'
                else if (t === 'edit_items') hoverClass = 'hover:border-purple-300 hover:text-purple-600'
                else if (t === 'void') hoverClass = 'hover:border-red-300 hover:text-red-600'
              }

              return (
                <button
                  key={t}
                  onClick={() => setFilterTipe(t)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all border duration-200 ${
                    isActive ? activeClass : `bg-white text-zinc-500 border-zinc-200 ${hoverClass}`
                  }`}
                >
                  {t === 'edit_items' ? '✏️ Edit Item' : t === 'void' ? '🚫 Pembatalan (Void)' : t === 'edit' ? '📝 Edit Data' : '📂 Semua'}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  {['Waktu', 'Kasir', 'Outlet', 'Tipe', 'ID Transaksi', 'Perubahan', 'Alasan', 'Status', ''].map(h => (
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
                    <td colSpan={9} className="px-5 py-16 text-center text-zinc-400 text-sm">
                      Belum ada log koreksi yang cocok
                    </td>
                  </tr>
                ) : filtered.map(d => (
                  <tr key={d.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-zinc-550 whitespace-nowrap">
                      {d.waktu}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900">
                      {d.kasir}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{d.outlet}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                        d.tipe === 'void' ? 'bg-red-100 text-red-700' :
                        d.tipe === 'edit_items' ? 'bg-yellow-100 text-yellow-800' :
                        d.tipe === 'edit' ? 'bg-blue-100 text-blue-700' :
                        'bg-zinc-100 text-zinc-700'
                      }`}>
                        {d.tipe === 'edit_items' ? 'Edit Item' : d.tipe === 'void' ? 'Pembatalan (Void)' : d.tipe === 'edit' ? 'Edit Data' : d.tipe}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-700 whitespace-nowrap">
                      {d.transaksiId}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-700 max-w-[280px]">
                      <div className="flex flex-col gap-0.5 font-medium">
                        {d.perubahan_badges.map((badge, index) => (
                          <span
                            key={index}
                            title={badge.tooltip}
                            className="whitespace-nowrap"
                          >
                            {badge.text}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500 max-w-xs truncate" title={d.alasan}>
                      {d.alasan}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          d.disetujui ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {d.disetujui ? 'Disetujui' : 'Pending'}
                        </span>
                        {d.isSuspicious && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 uppercase tracking-wide">
                            Anomali
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-right">
                      <button onClick={() => setDetail(d)} className="text-yellow-600 hover:text-yellow-750 text-xs font-bold hover:underline transition-colors">
                        Detail
                      </button>
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
        <div className="fixed inset-0 bg-zinc-955/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col transform scale-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-zinc-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-150 bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-zinc-900 tracking-tight text-base">Detail Log Audit</h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-zinc-200 text-zinc-700 uppercase tracking-wider">Audit Trail</span>
              </div>
              <button onClick={handleCloseDetail} className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Isi Modal */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              
              {/* Alert Anomali / Suspicious */}
              {detail.isSuspicious && detail.fraudIndicators && detail.fraudIndicators.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                    <svg className="w-4 h-4 text-rose-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Peringatan Audit Anomali</span>
                  </div>
                  <div className="space-y-1.5">
                    {detail.fraudIndicators.map((ind, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-rose-700 font-medium">
                        <span className="shrink-0 text-rose-500">🚨</span>
                        <span>{ind}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Umum */}
              <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Informasi Koreksi</h4>
                <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
                  <div>
                    <span className="text-zinc-400 font-semibold block mb-0.5">ID Transaksi</span>
                    <span className="text-zinc-900 font-mono font-semibold">{detail.transaksiId}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-semibold block mb-0.5">Waktu Audit</span>
                    <span className="text-zinc-900 font-semibold">{detail.waktu}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-semibold block mb-0.5">Operator (Kasir)</span>
                    <span className="text-zinc-900 font-bold">{detail.kasir}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-semibold block mb-0.5">Lokasi Outlet</span>
                    <span className="text-zinc-900 font-semibold">{detail.outlet}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-semibold block mb-0.5">Tipe Koreksi</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${
                      detail.tipe === 'void' ? 'bg-red-50 text-red-700 border-red-100' :
                      detail.tipe === 'edit_items' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      detail.tipe === 'edit' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-zinc-50 text-zinc-700 border-zinc-100'
                    }`}>
                      {detail.tipe === 'edit_items' ? 'Edit Item' : detail.tipe === 'void' ? 'Pembatalan (Void)' : detail.tipe === 'edit' ? 'Edit Data' : detail.tipe}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-semibold block mb-0.5">Status Persetujuan</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                      detail.disetujui ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {detail.disetujui ? 'Disetujui' : 'Pending'}
                    </span>
                  </div>
                  <div className="col-span-2 pt-2.5 border-t border-zinc-200/60">
                    <span className="text-zinc-400 font-semibold block mb-1">Alasan Koreksi</span>
                    <p className="text-zinc-800 bg-white border border-zinc-200/80 rounded-xl p-3 text-xs leading-relaxed font-medium italic">
                      "{detail.alasan}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Perubahan Data (Git Diff visual style) */}
              {detail.perubahan_detail.length > 0 && (
                <div className="pt-4 border-t border-zinc-100 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Perubahan Rincian</h4>
                  <div className="space-y-3">
                    {detail.perubahan_detail.map((change, i) => (
                      <div key={i} className="border border-zinc-150 rounded-2xl overflow-hidden bg-white shadow-xs">
                        <div className="bg-zinc-50/80 px-4 py-2 border-b border-zinc-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-700">{change.label}</span>
                          <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-200/50 px-2 py-0.5 rounded">Revisi</span>
                        </div>
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3 flex flex-col justify-between">
                            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-1">Sebelumnya (-)</span>
                            <span className="text-xs font-semibold text-rose-800 line-through break-words leading-relaxed">{change.lama}</span>
                          </div>
                          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 flex flex-col justify-between">
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Menjadi (+)</span>
                            <span className="text-xs font-bold text-emerald-800 break-words leading-relaxed">{change.baru}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hash Signature */}
              <div className="pt-4 border-t border-zinc-100">
                <div className="bg-zinc-955 border border-zinc-900 rounded-2xl p-4 space-y-3 text-white">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-xs uppercase tracking-wider">
                    <svg className="w-3.5 h-3.5 text-emerald-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Verifikasi Blockchain Ledger</span>
                  </div>
                  
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Hash Sebelum Koreksi</span>
                        <button
                          onClick={() => copyToClipboard(detail.hash_sebelum_full, 'sebelum')}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded transition-all duration-200 ${
                            copiedSebelum 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                          }`}
                        >
                          {copiedSebelum ? (
                            <>
                              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-300 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-850 break-all leading-relaxed">
                        {detail.hash_sebelum_full}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Hash Setelah Koreksi</span>
                        <button
                          onClick={() => copyToClipboard(detail.hash_sesudah_full, 'sesudah')}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded transition-all duration-200 ${
                            copiedSesudah 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                          }`}
                        >
                          {copiedSesudah ? (
                            <>
                              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-300 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-850 break-all leading-relaxed">
                        {detail.hash_sesudah_full}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-zinc-150 bg-zinc-50/50 flex gap-2">
              <button
                onClick={handleCloseDetail}
                className="w-full bg-zinc-900 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-zinc-800 active:scale-98 transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Selesai Memeriksa</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}