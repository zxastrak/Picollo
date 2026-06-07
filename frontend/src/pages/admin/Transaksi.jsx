import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import Layout from '../../components/Layout'
import { transaksiService } from '../../services/transaksiService'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorState from '../../components/ErrorState'
import DateFilter from '../../components/DateFilter'

const StatusBadge = ({ status }) => {
  const map = {
    verified: 'bg-green-100 text-green-700',
    fraud:    'bg-red-100 text-red-700',
    pending:  'bg-yellow-100 text-yellow-700',
  }
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${map[status] || map.pending}`}>{status}</span>
}

export default function AdminTransaksi() {
  const { outlets } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Default ke query params jika ada, jika tidak kosong
  const [filterOutlet, setFilterOutlet] = useState(searchParams.get('outlet_id') || '')
  const [filterDateRange, setFilterDateRange] = useState({ start_date: '', end_date: '', date: '' })

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')
  const [filterMetode, setFilterMetode] = useState('semua')
  const [detail, setDetail] = useState(null)

  useEffect(() => { 
    const newParams = new URLSearchParams()
    if (filterOutlet) newParams.set('outlet_id', filterOutlet)
    if (filterDateRange.date) newParams.set('date', filterDateRange.date)
    setSearchParams(newParams, { replace: true })
    
    fetchData() 
  }, [filterOutlet, filterDateRange])

  const formatRupiah = (num) => {
    if (!num && num !== 0) return '-'
    return `Rp ${Number(num).toLocaleString('id-ID')}`
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = { all: true }
      if (filterOutlet) params.outlet_id = filterOutlet
      if (filterDateRange.start_date && filterDateRange.end_date) {
        params.start_date = filterDateRange.start_date
        params.end_date = filterDateRange.end_date
      } else if (filterDateRange.date) {
        params.date = filterDateRange.date
      }

      const res = await transaksiService.getAll(params)
      const raw = res.data.data?.data || res.data.data || []
      const mapped = raw.map(tx => ({
        id: tx.transaction_code || tx.id,
        rawId: tx.id,
        kasir: tx.kasir?.name || '-',
        outlet: tx.outlet?.nama || '-',
        total: formatRupiah(tx.total_amount),
        totalRaw: tx.total_amount,
        metode: tx.metode_pembayaran === 'qris' ? 'QRIS' : tx.metode_pembayaran === 'transfer' ? 'Transfer' : 'Tunai',
        waktu: tx.created_at ? new Date(tx.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-',
        hash: tx.hash_verification?.hash_sha256 || '-',
        status: tx.status === 'success' ? 'verified' : tx.status || 'pending',
      }))
      setData(mapped)
    } catch (err) {
      console.error('Fetch transaksi error:', err)
      setData([])
    }
    finally { setLoading(false) }
  }

  const filtered = data.filter(tx => {
    const matchSearch = tx.id?.toLowerCase().includes(search.toLowerCase()) ||
                        tx.kasir?.toLowerCase().includes(search.toLowerCase()) ||
                        tx.outlet?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'semua' || tx.status === filterStatus
    const matchMetode = filterMetode === 'semua' || tx.metode === filterMetode
    return matchSearch && matchStatus && matchMetode
  })

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Transaksi</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Kelola dan pantau semua transaksi</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari ID transaksi, kasir, outlet..."
                className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
            </div>
            <select
              value={filterOutlet}
              onChange={e => setFilterOutlet(e.target.value)}
              className="bg-white border border-zinc-300 text-zinc-700 text-sm font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:border-yellow-400 transition-colors shrink-0"
            >
              <option value="">Semua Outlet</option>
              {outlets?.map(o => (
                <option key={o.id} value={o.id}>{o.nama}</option>
              ))}
            </select>
            <DateFilter onChange={setFilterDateRange} initialDate={searchParams.get('date') || ''} />
            {(filterOutlet || filterDateRange.start_date || filterDateRange.end_date || filterDateRange.date) && (
              <button onClick={() => { setFilterOutlet(''); setFilterDateRange({ start_date: '', end_date: '', date: '' }) }} className="text-zinc-500 hover:text-yellow-600 text-sm font-semibold px-2">
                Reset
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100">
            <div className="flex gap-1">
              {['semua', 'verified', 'pending', 'fraud'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border
                    ${filterStatus === s ? 'bg-yellow-400 text-zinc-900 border-yellow-400' : 'bg-white text-zinc-600 border-zinc-200 hover:border-yellow-300'}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {['semua', 'QRIS', 'Tunai'].map(m => (
                <button key={m} onClick={() => setFilterMetode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
                    ${filterMetode === m ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  {['ID Transaksi', 'Kasir', 'Outlet', 'Total', 'Metode', 'Waktu', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-5 py-3"><div className="h-8 bg-zinc-100 rounded-lg animate-pulse" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-16 text-center text-zinc-400 text-sm">Belum ada transaksi</td></tr>
                ) : filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono font-semibold text-zinc-900">{tx.id}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-700">{tx.kasir}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-700">{tx.outlet}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900">{tx.total}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-zinc-100 text-zinc-700 font-semibold px-2.5 py-1 rounded-full">{tx.metode}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{tx.waktu}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={tx.status} /></td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setDetail(tx)} className="text-yellow-600 text-xs font-semibold hover:underline">Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detail */}
        {detail && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                <h3 className="font-bold text-zinc-900">Detail Transaksi</h3>
                <button onClick={() => setDetail(null)} className="text-zinc-400 hover:text-zinc-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-5 space-y-3">
                {Object.entries({
                  'ID Transaksi': detail.id, 'Kasir': detail.kasir, 'Outlet': detail.outlet,
                  'Total': detail.total, 'Metode': detail.metode, 'Waktu': detail.waktu,
                  'Status': detail.status
                }).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-zinc-500">{k}</span>
                    <span className="text-zinc-900 font-medium font-mono text-right max-w-xs truncate">{v}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-zinc-100 mt-2">
                  <p className="text-xs text-zinc-500 mb-1">Hash Verification (SHA-256)</p>
                  <p className="text-xs font-mono text-zinc-800 break-all bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                    {detail.hash}
                  </p>
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
      </div>
    </Layout>
  )
}