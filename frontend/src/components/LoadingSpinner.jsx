export default function LoadingSpinner({ text = 'Memuat data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-zinc-200"/>
        <div className="w-12 h-12 rounded-full border-4 border-red-800 border-t-transparent
                        animate-spin absolute inset-0"/>
      </div>
      <p className="text-zinc-500 text-sm">{text}</p>
    </div>
  )
}