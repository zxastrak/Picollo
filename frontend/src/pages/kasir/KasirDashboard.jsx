import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { transaksiService } from '../../services/transaksiService'

const formatRupiah = (num) => {
  if (!num && num !== 0) return '-'
  return `Rp ${Number(num).toLocaleString('id-ID')}`
}

export default function KasirDashboard() {
  const [stats, setStats] = useState(null)
  const [recentTx, setRecentTx] = useState([])
  const [loading, setLoading] = useState(true)
  async function fetchData() {
    setLoading(true)
    try {
      const res = await transaksiService.getAll()
      const allTx = res.data.data?.data || res.data.data || []
      
      // Filter transaksi hari ini
      const today = new Date().toISOString().split('T')[0]
      const todayTx = allTx.filter(tx => tx.created_at?.startsWith(today))
      
      const totalOmzet = todayTx.reduce((sum, tx) => sum + (Number(tx.total_amount) || 0), 0)
      const qrisCount = todayTx.filter(tx => tx.metode_pembayaran === 'qris').length
      const tunaiCount = todayTx.filter(tx => tx.metode_pembayaran === 'tunai').length
      
      setStats({
        total_transaksi: todayTx.length,
        total_omzet: formatRupiah(totalOmzet),
        total_qris: qrisCount,
        total_tunai: tunaiCount,
      })
      
      // Recent transactions (max 5)
      const recent = allTx.slice(0, 5).map(tx => ({
        id: tx.transaction_code || tx.id,
        metode: tx.metode_pembayaran === 'qris' ? 'QRIS' : 'Tunai',
        waktu: tx.created_at ? new Date(tx.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
        total: formatRupiah(tx.total_amount),
      }))
      setRecentTx(recent)
    } catch (err) {
      console.error('Fetch kasir dashboard error:', err)
      setStats(null); setRecentTx([])
    }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const statCards = [
    { label: 'Transaksi Hari Ini', value: stats?.total_transaksi ?? '-', color: 'bg-yellow-400' },
    { label: 'Total Omzet', value: stats?.total_omzet ?? '-', color: 'bg-zinc-800' },
    { label: 'QRIS', value: stats?.total_qris ?? '-', color: 'bg-zinc-700' },
    { label: 'Tunai', value: stats?.total_tunai ?? '-', color: 'bg-zinc-600' },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Dashboard Kasir</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Ringkasan aktivitas hari ini</p>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {loading ? [...Array(4)].map((_, i) => <div key={i} className="bg-zinc-200 rounded-2xl h-32 animate-pulse" />) :
            statCards.map(card => (
              <div key={card.label} className={`${card.color} rounded-2xl p-4 sm:p-5 text-white`}>
                <p className="text-white/70 text-xs sm:text-sm font-medium mb-3">{card.label}</p>
                <p className="text-xl sm:text-2xl font-bold">{card.value}</p>
              </div>
            ))
          }
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <h3 className="font-bold text-zinc-900 text-sm">Transaksi Terbaru Hari Ini</h3>
            <a href="/kasir/rekap" className="text-yellow-600 text-xs font-semibold hover:underline">Lihat rekap →</a>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-zinc-100 rounded-xl animate-pulse" />)}</div>
          ) : recentTx.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-sm">Belum ada transaksi hari ini</div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
                      <span className="text-zinc-500 text-xs font-mono font-bold">{tx.metode === 'QRIS' ? 'QR' : 'TN'}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">{tx.id}</p>
                      <p className="text-xs text-zinc-400">{tx.waktu}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-zinc-900">{tx.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}