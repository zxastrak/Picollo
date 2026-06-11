import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import { transaksiService } from '../../services/transaksiService'
import { verifikasiService } from '../../services/verifikasiService'
import { laporanService } from '../../services/laporanService'
import useAuthStore from '../../store/authStore'

export default function AuditorDashboard() {
  const { activeOutletId } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [recentVerifikasi, setRecentVerifikasi] = useState([])
  const [keuangan, setKeuangan] = useState({ omzet: 0, tunai: 0, qris: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [activeOutletId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      
      const [txRes, verRes, lapRes] = await Promise.all([
        transaksiService.getAll({ outlet_id: activeOutletId }),
        verifikasiService.getHistory({ outlet_id: activeOutletId }),
        laporanService.getKeuangan({ start_date: today, end_date: today, outlet_id: activeOutletId })
      ])
      
      const allTx = txRes.data.data?.data || txRes.data.data || []
      const verData = verRes.data.data?.data || verRes.data.data || []
      const ringkasan = lapRes.data.data?.ringkasan || {}
      
      const verified = allTx.filter(tx => tx.hash_verification?.status === 'verified' || tx.status === 'success').length
      const fraud = allTx.filter(tx => tx.hash_verification?.status === 'fraud_detected' || tx.status === 'fraud').length
      const pending = allTx.length - verified - fraud
      
      setStats({
        total_transaksi: allTx.length,
        total_verified: verified,
        total_fraud: fraud,
        total_pending: pending,
      })
      
      // Recent verifications
      const recent = verData.slice(0, 5).map(v => ({
        hash: v.hash_sha256 ? v.hash_sha256.substring(0, 20) + '...' : '-',
        waktu: v.created_at ? new Date(v.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-',
        status: v.status || 'pending',
      }))
      setRecentVerifikasi(recent)

      setKeuangan({
        omzet: Number(ringkasan.total_omzet || ringkasan.total_pendapatan) || 0,
        tunai: Number(ringkasan.total_tunai) || 0,
        qris: Number(ringkasan.total_qris) || 0,
      })
    } catch (err) {
      console.error('Fetch auditor dashboard error:', err)
      setStats(null); setRecentVerifikasi([])
      setKeuangan({ omzet: 0, tunai: 0, qris: 0 })
    }
    finally { setLoading(false) }
  }

  const formatRupiah = (num) => `Rp ${Number(num).toLocaleString('id-ID')}`

  const statCards = [
    { label: 'Total Transaksi', value: stats?.total_transaksi ?? '-', color: 'bg-zinc-800' },
    { label: 'Transaksi Valid', value: stats?.total_verified ?? '-', color: 'bg-green-700' },
    { label: 'Fraud / Anomali', value: stats?.total_fraud ?? '-', color: 'bg-yellow-400' },
    { label: 'Omzet Hari Ini', value: formatRupiah(keuangan.omzet), color: 'bg-amber-700' },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Dashboard Auditor</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Overview hasil audit dan verifikasi transaksi</p>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {loading ? [...Array(4)].map((_, i) => <div key={i} className="bg-zinc-200 rounded-2xl h-32 animate-pulse" />) :
            statCards.map(card => (
              <div key={card.label} className={`${card.color} rounded-2xl p-4 sm:p-5 text-white shadow-lg`}>
                <p className="text-white/80 text-xs sm:text-sm font-medium mb-3">{card.label}</p>
                <p className="text-xl sm:text-2xl font-bold">{card.value}</p>
              </div>
            ))
          }
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-center">
            <h3 className="font-bold text-zinc-900 text-sm mb-4">Rincian Pembayaran (Hari Ini)</h3>
            {loading ? <div className="h-20 bg-zinc-100 rounded-xl animate-pulse" /> : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs font-semibold">Tunai</p>
                      <p className="text-zinc-900 font-bold text-sm">{formatRupiah(keuangan.tunai)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      QR
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs font-semibold">QRIS</p>
                      <p className="text-zinc-900 font-bold text-sm">{formatRupiah(keuangan.qris)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-900 text-sm">Riwayat Verifikasi Terbaru</h3>
              <Link to="/auditor/verifikasi" className="text-yellow-600 text-xs font-semibold hover:underline flex items-center gap-1">
                Selengkapnya
              </Link>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-zinc-100 rounded-xl animate-pulse" />)}</div>
            ) : recentVerifikasi.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-sm">Belum ada riwayat verifikasi</div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {recentVerifikasi.slice(0, 3).map((v, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-semibold text-zinc-900 truncate">{v.hash}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{v.waktu}</p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md shrink-0 ml-2
                      ${v.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


      </div>
    </Layout>
  )
}