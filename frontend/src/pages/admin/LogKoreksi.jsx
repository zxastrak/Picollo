import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { logKoreksiService } from '../../services/logKoreksiService'
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
    const oldItemsMap = new Map(oldItems.map(i => [i.product_id, i]))
    const newItemsMap = new Map(newItems.map(i => [i.product_id, i]))

    const itemChanges = []
    
    // Check removed
    const removedCount = oldItems.filter(i => !newItemsMap.has(i.product_id)).length
    if (removedCount > 0) {
      itemChanges.push(`${removedCount} item dihapus`)
    }

    // Check added
    const addedCount = newItems.filter(i => !oldItemsMap.has(i.product_id)).length
    if (addedCount > 0) {
      itemChanges.push(`${addedCount} item ditambahkan`)
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
      itemChanges.push(`${qtyChangeCount} jumlah item diubah`)
    }

    if (itemChanges.length > 0) {
      changes.push(itemChanges.join(', '))
    }
  }

  if (changes.length === 0) {
    // Fallback: show hash change if no meaningful data change detected
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

  // Total
  if (oldData.total_amount !== undefined && newData.total_amount !== undefined) {
    const oldAmt = Number(oldData.total_amount)
    const newAmt = Number(newData.total_amount)
    if (oldAmt !== newAmt) {
      details.push({ label: 'Total', lama: formatRupiah(oldAmt), baru: formatRupiah(newAmt) })
    }
  }

  // Metode
  if (oldData.metode_pembayaran && newData.metode_pembayaran && oldData.metode_pembayaran !== newData.metode_pembayaran) {
    details.push({ label: 'Metode Pembayaran', lama: oldData.metode_pembayaran, baru: newData.metode_pembayaran })
  }

  // Catatan
  if (oldData.catatan !== newData.catatan) {
    details.push({ label: 'Catatan', lama: oldData.catatan || '(kosong)', baru: newData.catatan || '(kosong)' })
  }

  // Reference
  if (oldData.payment_reference !== newData.payment_reference) {
    details.push({ label: 'Referensi Pembayaran', lama: oldData.payment_reference || '(kosong)', baru: newData.payment_reference || '(kosong)' })
  }

  // Status
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

export default function AdminLogKoreksi() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDateRange, setFilterDateRange] = useState({ start_date: '', end_date: '', date: '' })
  const [detail, setDetail] = useState(null)

  useEffect(() => { fetchData() }, [filterDateRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = { all: true }
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
        id_transaksi: l.transaction?.transaction_code || '-',
        kasir: l.corrected_by?.name || l.correctedBy?.name || '-',
        outlet: l.outlet?.nama || '-',
        tipe: l.correction_type || '-',
        perubahan: getPerubahanRingkasan(l),
        perubahan_detail: getPerubahanDetail(l),
        hash_sebelum_full: l.hash_sebelum || '-',
        hash_sesudah_full: l.hash_sesudah || '-',
        waktu: l.created_at ? new Date(l.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-',
        keterangan: l.alasan || '-',
        status: l.status,
      }))
      setData(mapped)
    } catch (err) {
      console.error('Fetch log koreksi error:', err)
      setData([])
    }
    finally { setLoading(false) }
  }

  const handleApprove = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menyetujui koreksi ini?')) return
    try {
      await logKoreksiService.approve(id)
      fetchData()
    } catch (err) {
      alert('Gagal menyetujui koreksi: ' + (err.response?.data?.message || err.message))
    }
  }

  const filtered = data.filter(l =>
    l.id_transaksi?.toLowerCase().includes(search.toLowerCase()) ||
    l.kasir?.toLowerCase().includes(search.toLowerCase()) ||
    l.keterangan?.toLowerCase().includes(search.toLowerCase()) ||
    l.perubahan?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Log Koreksi</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Riwayat perubahan dan koreksi data transaksi</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari ID transaksi, kasir, atau keterangan..."
                className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
            </div>
            <DateFilter onChange={setFilterDateRange} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  {['ID Transaksi', 'Kasir', 'Outlet', 'Tipe', 'Perubahan', 'Waktu', 'Keterangan', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}><td colSpan={9} className="px-5 py-3"><div className="h-8 bg-zinc-100 rounded-lg animate-pulse" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-16 text-center text-zinc-400 text-sm">Belum ada log koreksi</td></tr>
                ) : filtered.map((l, i) => (
                  <tr key={i} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono font-semibold text-zinc-900">{l.id_transaksi}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-700">{l.kasir}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-700">{l.outlet}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        l.tipe === 'void' ? 'bg-red-100 text-red-700' :
                        l.tipe === 'edit_items' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>{l.tipe === 'edit_items' ? 'Edit Item' : l.tipe}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-700 max-w-[250px]">
                      <p className="truncate">{l.perubahan}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500 whitespace-nowrap">{l.waktu}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500 max-w-xs truncate">{l.keterangan}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                        ${l.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'}`}>
                        {l.status === 'approved' ? 'Disetujui' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => setDetail(l)}
                          className="text-yellow-600 text-xs font-semibold hover:underline">Detail</button>
                        {l.status === 'flagged' && (
                          <button onClick={() => handleApprove(l.id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors">
                            Setujui
                          </button>
                        )}
                      </div>
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
                  'ID Transaksi': detail.id_transaksi,
                  'Kasir': detail.kasir,
                  'Outlet': detail.outlet,
                  'Tipe Koreksi': detail.tipe === 'edit_items' ? 'Edit Item' : detail.tipe,
                  'Waktu': detail.waktu,
                  'Keterangan': detail.keterangan,
                  'Status': detail.status === 'approved' ? 'Disetujui' : 'Pending',
                }).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-zinc-500">{k}</span>
                    <span className="text-zinc-900 font-medium text-right max-w-[60%]">{v}</span>
                  </div>
                ))}
              </div>

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