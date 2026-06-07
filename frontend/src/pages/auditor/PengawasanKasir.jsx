import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../services/api'
import { kasirService } from '../../services/kasirService'
import useAuthStore from '../../store/authStore'

const formatRupiah = (num) => {
  if (!num && num !== 0) return '-'
  return `Rp ${Number(num).toLocaleString('id-ID')}`
}

export default function AuditorPengawasanKasir() {
  const { activeOutletId } = useAuthStore()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [activities, setActivities] = useState([])
  const [loadingActivity, setLoadingActivity] = useState(false)

  useEffect(() => { fetchData() }, [activeOutletId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await kasirService.getAll({ outlet_id: activeOutletId })
      const raw = res.data.data || []
      const mapped = raw.map(k => ({
        id: k.id,
        nama: k.name || k.nama,
        outlet: k.outlets?.[0]?.nama || '-',
        total_transaksi: '-',
        status: k.is_active ? 'aktif' : 'nonaktif',
      }))
      setData(mapped)
    } catch (err) {
      console.error('Fetch kasir error:', err)
      setData([])
    }
    finally { setLoading(false) }
  }

  const fetchActivity = async (kasir) => {
    setSelected(kasir)
    setLoadingActivity(true)
    setActivities([])
    try {
      const res = await api.get(`/kasir/${kasir.id}/aktivitas`)
      const raw = res.data.data || []
      
      const mapped = raw.map(a => ({
        type: a.type,
        title: a.title,
        subtitle: a.subtitle,
        waktu: new Date(a.timestamp).toLocaleString('id-ID', { 
          hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' 
        }),
        status: a.status
      }))
      setActivities(mapped)
    } catch (err) {
      console.error('Fetch activity error:', err)
      setActivities([])
    }
    finally { setLoadingActivity(false) }
  }

  const filtered = data.filter(k =>
    k.nama?.toLowerCase().includes(search.toLowerCase()) ||
    k.outlet?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Pengawasan Kasir</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Monitor aktivitas dan transaksi setiap kasir secara real-time</p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Read Only
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Daftar Kasir */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-100">
              <div className="relative">
                <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                </svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari kasir..."
                  className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
              </div>
            </div>
            <div className="divide-y divide-zinc-50">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="p-4"><div className="h-10 bg-zinc-100 rounded-xl animate-pulse" /></div>
                ))
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-sm">Belum ada kasir</div>
              ) : filtered.map(k => (
                <button key={k.id} onClick={() => fetchActivity(k)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-50 transition-colors
                    ${selected?.id === k.id ? 'bg-yellow-50 border-l-2 border-yellow-400' : ''}`}>
                  <div className="w-9 h-9 bg-yellow-400/20 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-yellow-600 text-sm font-bold">{k.nama?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{k.nama}</p>
                    <p className="text-xs text-zinc-500">{k.outlet} · {k.total_transaksi} tx hari ini</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0
                    ${k.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {k.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Detail Aktivitas */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <p className="text-zinc-500 text-sm">Pilih kasir untuk melihat aktivitasnya</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-900">Aktivitas: {selected.nama}</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">{selected.outlet}</p>
                  </div>
                </div>
                <div className="divide-y divide-zinc-50">
                  {loadingActivity ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="p-4"><div className="h-8 bg-zinc-100 rounded-xl animate-pulse" /></div>
                    ))
                  ) : activities.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400 text-sm">Belum ada aktivitas tercatat</div>
                  ) : activities.map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                          ${a.type === 'login' ? 'bg-green-100 text-green-700' :
                            a.type === 'logout' ? 'bg-zinc-100 text-zinc-500' : 'bg-yellow-100 text-yellow-700'}`}>
                          {a.type === 'login' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                          )}
                          {a.type === 'logout' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          )}
                          {a.type === 'koreksi' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{a.title}</p>
                          <p className="text-xs text-zinc-500">{a.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-semibold text-zinc-500">{a.waktu}</span>
                        {a.type === 'koreksi' && a.status && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                            ${a.status === 'approved' ? 'bg-green-100 text-green-700' :
                              a.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {a.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}