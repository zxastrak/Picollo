import { useState } from 'react'
import Layout from '../../components/Layout'
import { verifikasiService } from '../../services/verifikasiService'

export default function AuditorVerifikasi() {
  const [hash, setHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!hash.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await verifikasiService.verifyByHash(hash)
      const data = res.data.data || res.data
      setResult({
        valid: data.status === 'verified' || data.valid === true,
        data: {
          'Kode Transaksi': data.transaction?.transaction_code || data.transaction_code || '-',
          'Outlet': data.transaction?.outlet?.nama || '-',
          'Total': data.transaction?.total_amount ? `Rp ${Number(data.transaction.total_amount).toLocaleString('id-ID')}` : '-',
          'Status Hash': data.status || '-',
          'Hash': data.hash_sha256 || hash,
        }
      })
    } catch (err) {
      setResult({ valid: false, error: err.response?.data?.message || 'Hash tidak ditemukan atau tidak valid' })
    } finally { setLoading(false) }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">Verifikasi Blockchain</h2>
            <p className="text-zinc-400 max-w-lg text-sm sm:text-base leading-relaxed">
              Pastikan keaslian dan integritas data transaksi. Masukkan Hash SHA-256 untuk memvalidasi record di jaringan blockchain internal.
            </p>
          </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 sm:p-8">
              <form onSubmit={handleVerify} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                    Hash Transaksi (SHA-256)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <input 
                      type="text" 
                      value={hash} 
                      onChange={e => setHash(e.target.value)}
                      placeholder="Masukkan hash..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-mono text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 focus:border-yellow-400 transition-all" 
                    />
                  </div>
                </div>
                
                <button type="submit" disabled={loading || !hash.trim()}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-200 disabled:text-zinc-400 text-zinc-900 font-bold py-4 rounded-2xl text-sm transition-all shadow-xl shadow-yellow-500/20 disabled:shadow-none flex items-center justify-center gap-2 group">
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Mulai Verifikasi
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Result Area */}
            {result && (
              <div className={`rounded-3xl p-6 sm:p-8 border shadow-lg overflow-hidden relative transition-all duration-500 animate-in fade-in slide-in-from-bottom-4
                ${result.valid ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-green-500/10' : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-red-500/10'}`}>
                
                <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                    ${result.valid ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-red-500 text-white shadow-red-500/30'}`}>
                    {result.valid
                      ? <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      : <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    }
                  </div>
                  <div>
                    <h3 className={`text-xl font-extrabold ${result.valid ? 'text-green-800' : 'text-red-800'}`}>
                      {result.valid ? 'Verifikasi Berhasil' : 'Peringatan: Fraud Detected!'}
                    </h3>
                    <p className={`text-sm mt-1 font-medium ${result.valid ? 'text-green-600/80' : 'text-red-600/80'}`}>
                      {result.valid ? 'Integritas data transaksi valid dan cocok dengan blockchain.' : result.error || 'Data telah dimanipulasi atau hash tidak dikenali.'}
                    </p>
                  </div>
                </div>

                {result.valid && result.data && (
                  <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/40 space-y-3">
                    {Object.entries(result.data).map(([k, v]) => (
                      <div key={k} className="flex flex-col sm:flex-row justify-between sm:items-center py-2 border-b border-zinc-100 last:border-0 last:pb-0">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{k}</span>
                        <span className={`text-sm font-mono mt-1 sm:mt-0 ${k === 'Hash' ? 'text-xs text-zinc-500 break-all max-w-[250px] text-right' : 'text-zinc-900 font-bold'}`}>
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </Layout>
  )
}
