export default function ErrorState({ message = 'Gagal memuat data', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-zinc-900 font-semibold">{message}</p>
        <p className="text-zinc-400 text-sm mt-1">Periksa koneksi internet atau server</p>
      </div>
      {onRetry && (
        <button onClick={onRetry}
          className="bg-red-800 hover:bg-red-900 text-white font-semibold
                     px-5 py-2 rounded-xl text-sm transition-colors">
          Coba Lagi
        </button>
      )}
    </div>
  )
}