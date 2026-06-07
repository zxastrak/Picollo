export default function PicolloLogo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { img: 'w-8 h-8',   text: 'text-sm',  sub: 'text-xs' },
    md: { img: 'w-10 h-10', text: 'text-base', sub: 'text-xs' },
    lg: { img: 'w-14 h-14', text: 'text-xl',   sub: 'text-xs' },
    xl: { img: 'w-20 h-20', text: 'text-3xl',  sub: 'text-sm' },
  }
  const s = sizes[size] || sizes.md

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative shrink-0">
        <img
          src="/PicolloLogo.png"
          alt="Picollo"
          className={`${s.img} rounded-xl object-cover bg-white`}
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextElementSibling.style.display = 'flex'
          }}
        />
        {/* Fallback kalau gambar gagal load */}
        <div
          className={`${s.img} rounded-xl bg-white items-center justify-center`}
          style={{ display: 'none' }}>
          <span className="text-red-800 font-black"
            style={{ fontSize: size === 'sm' ? 14 : 18 }}>
            P
          </span>
        </div>
      </div>

      {showText && (
        <div>
          <p className={`text-white font-bold leading-none ${s.text}`}>
            Picollo
          </p>
          <p className={`text-zinc-500 tracking-widest ${s.sub}`}>
            HASHCHAIN POWERED
          </p>
        </div>
      )}
    </div>
  )
}