import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import useAuthStore from '../../store/authStore'
import { productService } from '../../services/produkService'
import { transaksiService } from '../../services/transaksiService'
import { authService } from '../../services/authService'

// ── Struk / Receipt ──
function ModalStruk({ transaksi, onBaru }) {
  const handlePrint = () => window.print()

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="px-6 pt-6 pb-4">

          {/* Header struk */}
          <div className="text-center mb-4 pb-4 border-b border-dashed border-zinc-300">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center
                            justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-zinc-900">Pembayaran Berhasil</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Picollo POS System</p>
            <p className="text-zinc-400 text-xs">{transaksi.waktu}</p>
          </div>

          {/* ID Transaksi */}
          <div className="flex justify-between text-xs mb-3">
            <span className="text-zinc-500">No. Transaksi</span>
            <span className="font-mono font-bold text-zinc-900">{transaksi.id}</span>
          </div>
          <div className="flex justify-between text-xs mb-4">
            <span className="text-zinc-500">Kasir</span>
            <span className="font-semibold text-zinc-900">{transaksi.kasir}</span>
          </div>

          {/* Items */}
          <div className="border-t border-dashed border-zinc-300 pt-3 mb-3 space-y-1.5">
            {transaksi.items.map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <div>
                  <p className="text-zinc-900 font-medium">{item.nama}</p>
                  <p className="text-zinc-400">
                    {item.qty} × Rp {Number(item.harga).toLocaleString('id-ID')}
                  </p>
                </div>
                <span className="text-zinc-900 font-semibold">
                  Rp {(item.qty * item.harga).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>

          {/* Total & Kembalian */}
          <div className="border-t border-dashed border-zinc-300 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-zinc-900">Total</span>
              <span className="text-yellow-700">
                Rp {Number(transaksi.total).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Metode</span>
              <span className="font-semibold text-zinc-700">{transaksi.metode}</span>
            </div>
            {transaksi.metode === 'Tunai' && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Uang Diterima</span>
                  <span className="font-semibold text-zinc-700">
                    Rp {Number(transaksi.uangDiterima).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Kembalian</span>
                  <span className="font-bold text-green-600">
                    Rp {Number(transaksi.kembalian).toLocaleString('id-ID')}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Footer struk */}
          <div className="border-t border-dashed border-zinc-300 mt-3 pt-3 text-center space-y-1">
            {transaksi.hash && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2 mb-2 font-mono text-[10px] text-zinc-500 break-all select-all">
                <p className="font-semibold text-zinc-600 mb-0.5">HASH BLOCKCHAIN</p>
                {transaksi.hash}
              </div>
            )}
            <p className="text-zinc-400 text-xs">Terima kasih telah berbelanja</p>
            <p className="text-zinc-400 text-xs">Transaksi tercatat di blockchain</p>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-2">
          <button onClick={handlePrint}
            className="flex-1 border border-zinc-300 text-zinc-700 font-semibold py-2.5
                       rounded-xl text-sm hover:bg-zinc-50 transition-colors flex items-center
                       justify-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button onClick={onBaru}
            className="flex-1 bg-zinc-900 hover:bg-zinc-700 text-white font-semibold py-2.5
                       rounded-xl text-sm transition-colors">
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Pembayaran ──
function ModalPembayaran({ keranjang, total, user, kasirNama, onClose, onSuccess }) {
  const { outlets } = useAuthStore()
  // metode hanya QRIS dan Tunai (Transfer dihapus)
  const [metode, setMetode] = useState('QRIS')
  const [uangDiterima, setUangDiterima] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorUang, setErrorUang] = useState('')
  const [struk, setStruk] = useState(null) // null = belum bayar, object = tampilkan struk

  // Hitung kembalian real-time
  const uangNum = Number(uangDiterima) || 0
  const kembalian = uangNum >= total ? uangNum - total : 0
  const kurang = uangNum > 0 && uangNum < total ? total - uangNum : 0

  const handleBayar = async () => {
    // Validasi frontend untuk Tunai
    if (metode === 'Tunai') {
      if (!uangDiterima || uangNum === 0) {
        setErrorUang('Masukkan jumlah uang yang diterima')
        return
      }
      if (uangNum < total) {
        setErrorUang(`Uang kurang Rp ${(total - uangNum).toLocaleString('id-ID')}`)
        return
      }
    }

    setLoading(true)
    try {
      console.log("USER:", user);
      console.log("KEYS:", Object.keys(user));
      console.log("OUTLETS:", outlets)
      const outletId = outlets?.[0]?.id
      if (!outletId) {
        alert('Anda tidak ditugaskan ke outlet manapun. Hubungi Admin.')
        setLoading(false)
        return
      }

      // Deteksi jika ada item dalam keranjang yang dipaksa (qty melebihi stok asli produk)
      const isForced = keranjang.some(item => item.qty > item.stok)

      const payload = {
        outlet_id: outletId,
        metode_pembayaran: metode.toLowerCase(),
        items: keranjang.map(item => ({
          product_id: item.id,
          qty: item.qty
        })),
        catatan: '',
        force: isForced // kirim force boolean ke backend
      }

      const res = await transaksiService.create(payload)
      const txData = res.data.data

      const buildStrukData = () => ({
        id: txData.transaction_code,
        waktu: new Date(txData.created_at).toLocaleString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }),
        kasir: kasirNama,
        items: keranjang,
        total,
        metode,
        uangDiterima: uangNum || total,
        kembalian: kembalian || 0,
        hash: txData.hash_verification?.hash_sha256 || null,
      })

      // Buat data struk
      setStruk(buildStrukData())
    } catch (err) {
      const errorMsg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal memproses pembayaran';
      alert(errorMsg)
    } finally { 
      setLoading(false)
    }
  }

  // Kalau struk sudah ada → tampilkan struk
  if (struk) {
    return (
      <ModalStruk
        transaksi={struk}
        onClose={onClose}
        onBaru={onSuccess}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <h3 className="font-bold text-zinc-900 text-lg">Proses Pembayaran</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Pilih metode dan konfirmasi</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Ringkasan Pesanan */}
          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
            <h4 className="font-bold text-zinc-900 text-sm mb-3">Ringkasan Pesanan</h4>
            <div className="space-y-2">
              {keranjang.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-zinc-600">{item.nama} × {item.qty}</span>
                  <span className="text-zinc-900 font-semibold">
                    Rp {(item.harga * item.qty).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-zinc-200 mt-3 pt-3 flex justify-between">
              <span className="text-zinc-900 font-bold">Total</span>
              <span className="text-yellow-600 font-bold text-lg">
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Pilih Metode — hanya QRIS dan Tunai */}
          <div>
            <h4 className="font-bold text-zinc-900 text-sm mb-3">Metode Pembayaran</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  val: 'QRIS', label: 'QRIS', sub: 'Scan QR',
                  icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z',
                },
                {
                  val: 'Tunai', label: 'Tunai', sub: 'Cash',
                  icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
                },
              ].map(m => (
                <button key={m.val} onClick={() => {
                  setMetode(m.val)
                  setUangDiterima('')
                  setErrorUang('')
                }}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2
                              transition-all
                    ${metode === m.val
                      ? 'bg-yellow-400 border-yellow-400 text-zinc-900'
                      : 'bg-white border-zinc-200 text-zinc-500 hover:border-yellow-300 hover:bg-yellow-50'}`}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={m.icon} />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-bold">{m.label}</p>
                    <p className={`text-xs ${metode === m.val ? 'text-red-200' : 'text-zinc-400'}`}>
                      {m.sub}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* QRIS → tampilkan petunjuk manual */}
          {metode === 'QRIS' && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-zinc-900 font-bold text-lg mb-1">
                Rp {total.toLocaleString('id-ID')}
              </p>
              <p className="text-zinc-600 text-xs mt-2">
                Silakan tunjukkan kode QRIS fisik outlet Anda kepada pelanggan. Tekan tombol konfirmasi di bawah jika pembayaran telah berhasil diselesaikan.
              </p>
            </div>
          )}

          {/* Tunai → input uang + hitung kembalian */}
          {metode === 'Tunai' && (
            <div className="space-y-3">
              <div>
                <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">
                  Uang Diterima (Rp)
                </label>
                <input
                  type="number"
                  value={uangDiterima}
                  onChange={e => {
                    setUangDiterima(e.target.value)
                    setErrorUang('')
                  }}
                  placeholder="Contoh: 100000"
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-zinc-900
                              focus:outline-none transition-colors font-mono text-lg
                              ${errorUang
                      ? 'border-red-400 bg-red-50'
                      : 'border-zinc-300 focus:border-yellow-400'}`} />
                {errorUang && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {errorUang}
                  </p>
                )}

                {/* Tombol cepat nominal */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[50000, 100000, 200000, 500000].map(n => (
                    <button key={n} type="button"
                      onClick={() => { setUangDiterima(String(n)); setErrorUang('') }}
                      className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700
                                 font-semibold px-3 py-1.5 rounded-lg transition-colors">
                      {(n / 1000)}rb
                    </button>
                  ))}
                </div>
              </div>

              {/* Hitung kembalian real-time */}
              <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Total Belanja</span>
                  <span className="font-semibold text-zinc-900">
                    Rp {total.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Uang Diterima</span>
                  <span className="font-semibold text-zinc-900">
                    Rp {uangNum > 0 ? uangNum.toLocaleString('id-ID') : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-zinc-200 pt-2">
                  <span className="font-bold text-zinc-900">Kembalian</span>
                  <span className={`font-bold text-lg
                    ${kembalian > 0 ? 'text-green-600' : kurang > 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                    {kembalian > 0
                      ? `Rp ${kembalian.toLocaleString('id-ID')}`
                      : kurang > 0
                        ? `-Rp ${kurang.toLocaleString('id-ID')}`
                        : 'Rp 0'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tombol Konfirmasi */}
          <button onClick={handleBayar} disabled={loading}
            className="w-full bg-zinc-900 hover:bg-yellow-500 disabled:bg-zinc-400
                       text-white font-bold py-3.5 rounded-xl text-sm transition-colors
                       flex items-center justify-center gap-2">
            {loading
              ? <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memproses...
              </span>
              : `Konfirmasi ${metode} • Rp ${total.toLocaleString('id-ID')}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Halaman Utama Kasir Transaksi ──
export default function KasirTransaksi() {
  const { user, setOutlets } = useAuthStore()
  const [produkList, setProdukList] = useState([])
  const [keranjang, setKeranjang] = useState([])
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState('Semua')
  const [showBayar, setShowBayar] = useState(false)
  const [toast, setToast] = useState(null)

  async function fetchProduk() {
    try {
      const res = await productService.getAll()
      const mapped = (res.data.data || []).map(p => ({
        id: p.id,
        nama: p.nama,
        kategori: p.kategori || 'Lainnya',
        harga: p.harga,
        foto: p.gambar_url || null,
        stok: p.outlets?.[0]?.pivot?.stok || 0,
      }))
      setProdukList(mapped)
    } catch { setProdukList([]) }
  }

  useEffect(() => {
    const refreshProfile = async () => {
      try {
        const res = await authService.me()
        const fullUser = res.data.data
        if (fullUser?.outlets) {
          setOutlets(fullUser.outlets)
        }
      } catch (err) {
        console.error("Gagal memuat ulang data outlet:", err)
      }
    }
    refreshProfile()
    fetchProduk()
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const addToKeranjang = (produk, force = false) => {
    setKeranjang(prev => {
      const ex = prev.find(k => k.id === produk.id)
      if (ex) {
        if (!force && ex.qty + 1 > produk.stok) {
          showToast(`Stok tidak cukup!`)
          return prev
        }
        return prev.map(k => k.id === produk.id ? { ...k, qty: k.qty + 1 } : k)
      }
      if (!force && produk.stok < 1) {
        showToast(`Stok habis!`)
        return prev
      }
      return [...prev, { ...produk, qty: 1 }]
    })
    showToast(`${produk.nama} ditambahkan ${force ? '(Paksa)' : ''}`)
  }

  const updateQty = (id, delta, force = false) => {
    setKeranjang(prev => {
      return prev.map(k => {
        if (k.id === id) {
          const newQty = k.qty + delta
          if (!force && delta > 0 && newQty > k.stok) {
            showToast(`Stok tidak cukup!`)
            return k
          }
          return { ...k, qty: Math.max(0, newQty) }
        }
        return k
      }).filter(k => k.qty > 0)
    })
  }

  const hapusItem = (id) => setKeranjang(prev => prev.filter(k => k.id !== id))

  const total = keranjang.reduce((s, k) => s + k.harga * k.qty, 0)
  const totalItem = keranjang.reduce((s, k) => s + k.qty, 0)

  const kategoriList = ['Semua', ...new Set(produkList.map(p => p.kategori).filter(Boolean))]
  const filtered = produkList.filter(p => {
    const matchSearch = p.nama?.toLowerCase().includes(search.toLowerCase())
    const matchKategori = kategori === 'Semua' || p.kategori === kategori
    return matchSearch && matchKategori
  })

  return (
    <Layout>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border
                        border-zinc-700 rounded-xl px-4 py-3 flex items-center gap-2 shadow-xl">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-white text-sm font-medium">{toast}</span>
        </div>
      )}

      {showBayar && (
        <ModalPembayaran
          keranjang={keranjang}
          total={total}
          user={user}
          kasirNama={user?.name || user?.email || 'Kasir'}
          onClose={() => setShowBayar(false)}
          onSuccess={() => { setKeranjang([]); setShowBayar(false) }}
        />
      )}

      <div className="flex gap-6 h-full" style={{ minHeight: 'calc(100vh - 120px)' }}>

        {/* ── KIRI: Produk ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Input Transaksi</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Pilih produk dan proses pembayaran</p>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3">
            <div>
              <p className="text-zinc-700 text-sm font-semibold mb-2">Cari Produk</p>
              <div className="relative">
                <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                </svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Ketik nama produk..."
                  className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm
                             focus:outline-none focus:border-yellow-400 transition-colors"/>
              </div>
            </div>
            <div>
              <p className="text-zinc-700 text-sm font-semibold mb-2">Filter Kategori</p>
              <div className="flex gap-2 flex-wrap">
                {kategoriList.map(k => (
                  <button key={k} onClick={() => setKategori(k)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
                      ${kategori === k
                        ? 'bg-yellow-400 text-zinc-900'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200'}`}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex-1">
            <p className="text-zinc-700 text-sm font-semibold mb-3">
              Daftar Produk ({filtered.length})
            </p>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center
                                justify-center mb-4">
                  <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-zinc-900 font-semibold text-sm">Belum ada produk</p>
                <p className="text-zinc-400 text-xs mt-1">
                  Admin perlu menambahkan produk terlebih dahulu
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map(produk => (
                  <div key={produk.id}
                    className="bg-white border border-zinc-200 rounded-2xl overflow-hidden
                               hover:border-yellow-200 hover:shadow-md transition-all group">
                    <div className="h-28 bg-zinc-100 flex items-center justify-center overflow-hidden">
                      {produk.foto
                        ? <img src={produk.foto} alt={produk.nama}
                          className="w-full h-full object-cover group-hover:scale-105
                                       transition-transform duration-300"/>
                        : <svg className="w-10 h-10 text-zinc-300" fill="none"
                          stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      }
                    </div>
                    <div className="p-3">
                      <p className="text-zinc-900 font-semibold text-sm truncate">{produk.nama}</p>
                      {produk.kategori && (
                        <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                          {produk.kategori}
                        </span>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-yellow-600 font-bold text-sm">
                          Rp {Number(produk.harga).toLocaleString('id-ID')}
                        </span>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs font-semibold ${produk.stok <= 0 ? 'text-orange-500' : 'text-zinc-500'}`}>Sisa: {produk.stok}</span>
                          <div className="flex gap-1.5 items-center">
                            {produk.stok <= 0 && (
                              <button onClick={() => addToKeranjang(produk, true)}
                                className="px-2 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-[10px] font-bold rounded-lg transition-colors shadow-sm">
                                Paksa
                              </button>
                            )}
                            <button onClick={() => addToKeranjang(produk)}
                              disabled={produk.stok <= 0}
                              className="w-8 h-8 bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-300 disabled:cursor-not-allowed rounded-full
                                         flex items-center justify-center transition-colors
                                         shadow-md shadow-yellow-500/20">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── KANAN: Keranjang ── */}
        <div className="w-80 xl:w-96 flex flex-col gap-4 shrink-0">
          <div className="mt-9">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="font-bold text-zinc-900">Keranjang</h3>
              </div>
              {totalItem > 0 && (
                <span className="w-6 h-6 bg-yellow-400 rounded-full flex items-center
                                 justify-center text-white text-xs font-bold">
                  {totalItem}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 flex-1 flex flex-col
                          overflow-hidden">
            {keranjang.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center
                                justify-center mb-4">
                  <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-zinc-500 text-sm font-medium">Keranjang kosong</p>
                <p className="text-zinc-400 text-xs mt-1">Tambahkan produk dari kiri</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-50">
                {keranjang.map(item => (
                  <div key={item.id} className="p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center
                                      justify-center shrink-0 overflow-hidden">
                        {item.foto
                          ? <img src={item.foto} alt={item.nama}
                            className="w-full h-full object-cover" />
                          : <svg className="w-5 h-5 text-zinc-400" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-zinc-900 font-semibold text-sm truncate">{item.nama}</p>
                          <button onClick={() => hapusItem(item.id)}
                            className="text-zinc-400 hover:text-yellow-600 transition-colors shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-zinc-400 text-xs">
                          Rp {Number(item.harga).toLocaleString('id-ID')} × {item.qty}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item.id, -1)}
                              className="w-6 h-6 bg-zinc-100 hover:bg-zinc-200 rounded-full
                                         flex items-center justify-center text-zinc-700
                                         font-bold text-sm transition-colors">
                              −
                            </button>
                            <span className="text-zinc-900 font-bold text-sm w-5 text-center">
                              {item.qty}
                            </span>
                            {item.qty >= item.stok ? (
                              <button onClick={() => updateQty(item.id, 1, true)}
                                className="w-6 h-6 bg-orange-100 hover:bg-orange-200 rounded-full
                                           flex items-center justify-center text-orange-700
                                           font-bold text-sm transition-colors" title="Paksa Tambah">
                                +
                              </button>
                            ) : (
                              <button onClick={() => updateQty(item.id, 1)}
                                className="w-6 h-6 bg-yellow-400 hover:bg-yellow-500 rounded-full
                                           flex items-center justify-center text-white
                                           font-bold text-sm transition-colors">
                                +
                              </button>
                            )}
                          </div>
                          <span className="text-zinc-900 font-bold text-sm">
                            Rp {(item.harga * item.qty).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Subtotal ({totalItem} item)</span>
                <span className="text-zinc-900 font-medium">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-zinc-100">
                <span className="text-zinc-900">Total Bayar</span>
                <span className="text-yellow-600 text-lg">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button onClick={() => setShowBayar(true)} disabled={keranjang.length === 0}
              className="w-full bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-300
                         text-white font-bold py-3.5 rounded-xl text-sm transition-colors
                         flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {keranjang.length === 0
                ? 'Pilih produk terlebih dahulu'
                : `Bayar Rp ${total.toLocaleString('id-ID')}`
              }
            </button>

            {keranjang.length > 0 && (
              <button onClick={() => setKeranjang([])}
                className="w-full text-zinc-400 hover:text-yellow-600 text-xs font-medium
                           py-1 transition-colors">
                Kosongkan keranjang
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}