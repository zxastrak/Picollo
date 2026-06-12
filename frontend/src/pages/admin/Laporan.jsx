import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { laporanService } from '../../services/laporanService'
import { rekapService } from '../../services/rekapService'
import useAuthStore from '../../store/authStore'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import DateFilter from '../../components/DateFilter'

const formatRupiah = (num) => {
  if (!num && num !== 0) return '-'
  return `Rp ${Number(num).toLocaleString('id-ID')}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length)
    return (
      <div className="bg-zinc-900 rounded-xl px-4 py-2.5 shadow-xl">
        <p className="text-zinc-400 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-sm">{payload[0].value}</p>
      </div>
    )
  return null
}

export default function AdminLaporan() {
  const { outlets } = useAuthStore()
  const [activeTab, setActiveTab] = useState('keuangan') // 'keuangan' | 'rekap'
  const [selectedOutlet, setSelectedOutlet] = useState('')
  const [data, setData] = useState({ revenue: [], byOutlet: [], byProduct: [], aktivitasPerJam: [] })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('bulan_ini')
  const [exportLoading, setExportLoading] = useState(false)

  const formatPeriodLabel = (p) => {
    const map = {
      hari_ini: 'Hari Ini',
      minggu_ini: 'Minggu Ini',
      bulan_ini: 'Bulan Ini',
      tahun: 'Tahun Ini',
    }
    return map[p] || p
  }

  const getDateRange = (p) => {
    const now = new Date()
    const getLocalFormattedDate = (d) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dateVal = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${dateVal}`
    }

    if (p === 'hari_ini') {
      const todayStr = getLocalFormattedDate(now)
      return { start_date: todayStr, end_date: todayStr }
    } else if (p === 'minggu_ini') {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(now)
      monday.setDate(diff)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return {
        start_date: getLocalFormattedDate(monday),
        end_date: getLocalFormattedDate(sunday)
      }
    } else if (p === 'bulan_ini') {
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
      return {
        start_date: `${y}-${m}-01`,
        end_date: `${y}-${m}-${String(lastDay).padStart(2, '0')}`
      }
    } else if (p === 'tahun') {
      const y = now.getFullYear()
      return {
        start_date: `${y}-01-01`,
        end_date: `${y}-12-31`
      }
    }

    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
    return {
      start_date: `${y}-${m}-01`,
      end_date: `${y}-${m}-${String(lastDay).padStart(2, '0')}`
    }
  }

  useEffect(() => { fetchData() }, [period, selectedOutlet])

  const fetchData = async () => {
    setLoading(true)
    try {
      const range = getDateRange(period)
      if (selectedOutlet) range.outlet_id = selectedOutlet
      const res = await laporanService.getKeuangan(range)
      const d = res.data.data || {}
      setData({
        revenue: (d.per_hari || []).map(h => ({ label: h.tanggal, value: Number(h.total) || 0 })),
        byOutlet: (d.per_outlet || []).map(o => ({ nama: o.outlet_nama || '-', omzet: Number(o.total) || 0 })),
        aktivitasPerJam: d.aktivitas_per_jam || [],
        byProduct: (d.produk_terlaris || []).map(p => ({
          nama: p.nama || '-',
          terjual: p.terjual || 0,
          omzet: formatRupiah(p.omzet || 0),
          outlet: p.outlet || '-'
        })),
        ringkasan: d.ringkasan || {},
      })
    } catch (err) {
      console.error('Fetch laporan error:', err)
      setData({ revenue: [], byOutlet: [], byProduct: [], aktivitasPerJam: [] })
    }
    finally { setLoading(false) }
  }

  const handleExport = async (type) => {
    setExportLoading(true)
    try {
      const range = getDateRange(period)
      if (selectedOutlet) range.outlet_id = selectedOutlet
      if (type === 'pdf') {
        const res = await laporanService.exportPdf(range)
        const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
        const a = document.createElement('a'); a.href = url
        a.download = `laporan-${range.start_date}-ke-${range.end_date}.pdf`; a.click()
        URL.revokeObjectURL(url)
      } else {
        const res = await laporanService.exportExcel(range)
        const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
        const a = document.createElement('a'); a.href = url
        a.download = `laporan-${range.start_date}-ke-${range.end_date}.csv`; a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Export error:', err)
      alert('Export gagal: ' + (err.response?.data?.message || err.message))
    }
    finally { setExportLoading(false) }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Laporan & Rekap</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Ringkasan keuangan dan persetujuan rekap harian kasir</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedOutlet}
              onChange={e => setSelectedOutlet(e.target.value)}
              className="bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold rounded-xl px-4 py-2 focus:outline-none focus:border-yellow-400 transition-colors shadow-sm"
            >
              <option value="">Semua Outlet</option>
              {outlets?.map(o => (
                <option key={o.id} value={o.id}>{o.nama}</option>
              ))}
            </select>

            <div className="flex bg-zinc-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('keuangan')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'keuangan' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                Statistik Keuangan
              </button>
              <button onClick={() => setActiveTab('rekap')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'rekap' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                Persetujuan Rekap Kasir
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'keuangan' && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-800">Filter Keuangan</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { value: 'hari_ini', label: 'Hari Ini' },
                  { value: 'minggu_ini', label: 'Minggu Ini' },
                  { value: 'bulan_ini', label: 'Bulan Ini' },
                  { value: 'tahun', label: 'Tahun' },
                ].map(p => (
                  <button key={p.value} onClick={() => setPeriod(p.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
                  ${period === p.value ? 'bg-yellow-400 text-zinc-900 border-yellow-400' : 'bg-white text-zinc-600 border-zinc-200 hover:border-yellow-300'}`}>
                    {p.label}
                  </button>
                ))}
                <button onClick={() => handleExport('pdf')} disabled={exportLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors border border-zinc-900">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF
                </button>
                <button onClick={() => handleExport('xlsx')} disabled={exportLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors border border-green-700">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel
                </button>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-zinc-200">
                <h3 className="font-bold text-zinc-900 text-sm mb-1">Tren Omzet</h3>
                <p className="text-zinc-400 text-xs mb-5">Periode: {formatPeriodLabel(period)}</p>
                {loading ? <div className="h-52 bg-zinc-100 rounded-xl animate-pulse" /> :
                  data.revenue.length === 0 ? (
                    <div className="h-52 flex items-center justify-center text-zinc-400 text-sm">
                      Belum ada data laporan
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={data.revenue} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#991b1b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#991b1b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" stroke="#991b1b" strokeWidth={2.5} fill="url(#grad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )
                }
              </div>

              <div className="bg-white rounded-2xl p-5 border border-zinc-200">
                <h3 className="font-bold text-zinc-900 text-sm mb-1">Omzet per Outlet</h3>
                <p className="text-zinc-400 text-xs mb-5">Periode: {formatPeriodLabel(period)}</p>
                {loading ? <div className="h-52 bg-zinc-100 rounded-xl animate-pulse" /> :
                  data.byOutlet.length === 0 ? (
                    <div className="h-52 flex items-center justify-center text-zinc-400 text-sm">
                      Belum ada data outlet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data.byOutlet} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                        <XAxis dataKey="nama" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="omzet" fill="#991b1b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                }
              </div>
            </div>

            {/* Grafik Aktivitas per Jam (Transaksi vs Koreksi) */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200 mt-4">
              <h3 className="font-bold text-zinc-900 text-sm mb-1">Aktivitas & Log Koreksi per Jam</h3>
              <p className="text-zinc-400 text-xs mb-5">
                Pantau jam sibuk dan anomali koreksi. Periode: {formatPeriodLabel(period)}
              </p>
              {loading ? <div className="h-52 bg-zinc-100 rounded-xl animate-pulse" /> :
                data.aktivitasPerJam.length === 0 ? (
                  <div className="h-52 flex items-center justify-center text-zinc-400 text-sm">
                    Belum ada data aktivitas
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.aktivitasPerJam} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                      <XAxis dataKey="jam" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                      <Bar dataKey="transaksi" name="Total Transaksi" fill="#27272a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="koreksi" name="Log Koreksi / Anomali" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </div>

            {/* Tabel produk terlaris */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100">
                <h3 className="font-bold text-zinc-900 text-sm">Produk Terlaris</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      {['Produk', 'Total Terjual', 'Omzet', 'Outlet'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [...Array(4)].map((_, i) => (
                        <tr key={i}><td colSpan={4} className="px-5 py-3"><div className="h-8 bg-zinc-100 rounded-lg animate-pulse" /></td></tr>
                      ))
                    ) : data.byProduct.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-12 text-center text-zinc-400 text-sm">Belum ada data produk</td></tr>
                    ) : data.byProduct.map((p, i) => (
                      <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900">{p.nama}</td>
                        <td className="px-5 py-3.5 text-sm text-zinc-700">{p.terjual}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900">{p.omzet}</td>
                        <td className="px-5 py-3.5 text-sm text-zinc-500">{p.outlet}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'rekap' && <TabRekapKasir selectedOutlet={selectedOutlet} />}
      </div>
    </Layout>
  )
}

function TabRekapKasir({ selectedOutlet }) {
  const [rekaps, setRekaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDateRange, setFilterDateRange] = useState({ start_date: '', end_date: '', date: '' })
  const navigate = useNavigate()

  useEffect(() => { fetchRekap() }, [filterDateRange])

  const fetchRekap = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterDateRange.start_date && filterDateRange.end_date) {
        params.start_date = filterDateRange.start_date
        params.end_date = filterDateRange.end_date
      } else if (filterDateRange.date) {
        params.date = filterDateRange.date
      }
      const res = await rekapService.getHarian(params)
      setRekaps(res.data.data?.data || res.data.data || [])
    } catch (err) {
      console.error('Fetch rekap error:', err)
    } finally { setLoading(false) }
  }

  const handleApprove = async (id) => {
    if (!window.confirm('Setujui rekap ini? Pastikan jumlah uang fisik sudah sesuai.')) return
    try {
      await rekapService.approve(id)
      fetchRekap() // refresh data
    } catch (err) {
      alert('Gagal menyetujui: ' + (err.response?.data?.message || err.message))
    }
  }

  const filteredRekaps = selectedOutlet
    ? rekaps.filter(r => r.outlet_id == selectedOutlet)
    : rekaps

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/50">
        <h3 className="font-bold text-zinc-900 text-lg">Daftar Rekap Kasir</h3>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter onChange={setFilterDateRange} />
          <button onClick={fetchRekap} className="text-zinc-500 hover:text-zinc-900 transition-colors text-sm font-bold flex items-center gap-1.5 bg-white border border-zinc-200 px-3 py-2.5 rounded-xl">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-zinc-100">
              {['Tanggal / Outlet', 'Kasir', 'Tunai', 'QRIS', 'Total Transaksi', 'Void', 'Status / Aksi'].map(h => (
                <th key={h} className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50/80">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-400"><div className="animate-pulse flex items-center justify-center gap-2"><div className="w-2 h-2 bg-zinc-300 rounded-full"></div><div className="w-2 h-2 bg-zinc-300 rounded-full delay-75"></div><div className="w-2 h-2 bg-zinc-300 rounded-full delay-150"></div></div></td></tr>
            ) : filteredRekaps.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-16 text-center text-zinc-400 text-sm font-medium">Belum ada rekap yang disubmit kasir</td></tr>
            ) : (
              filteredRekaps.map(r => (
                <tr key={r.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-zinc-900">
                      {new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{r.outlet?.nama}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-zinc-800">{r.kasir?.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-zinc-900">{formatRupiah(r.total_tunai)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-zinc-700">{formatRupiah(r.total_qris)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-zinc-900">{r.total_transaksi}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Total: {formatRupiah(r.total_amount)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-red-600">{r.total_void || 0}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {r.status === 'submitted' ? (
                        <div className="flex flex-col items-start gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> Menunggu
                          </span>
                          <button onClick={() => handleApprove(r.id)} className="bg-yellow-400 hover:bg-yellow-500 text-zinc-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-colors w-full text-left">
                            Setuju
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Disetujui
                        </span>
                      )}

                      <button
                        onClick={() => navigate(`/admin/transaksi?outlet_id=${r.outlet_id}&date=${r.tanggal}`)}
                        className="text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-xl transition-colors w-full text-left flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Riwayat Transaksi
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
  )
}