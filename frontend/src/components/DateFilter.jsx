import { useState, useEffect } from 'react'

export default function DateFilter({ onChange, initialMode = 'semua', initialDate = '' }) {
  const [mode, setMode] = useState(initialDate ? 'custom' : initialMode) // semua, hari_ini, minggu_ini, bulan_ini, tahun_ini, custom
  const [date, setDate] = useState(initialDate) // YYYY-MM-DD

  useEffect(() => {
    const now = new Date()
    const getLocalFormattedDate = (d) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dateVal = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${dateVal}`
    }

    let start_date = ''
    let end_date = ''

    if (mode === 'hari_ini') {
      start_date = getLocalFormattedDate(now)
      end_date = getLocalFormattedDate(now)
    } else if (mode === 'minggu_ini') {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(now)
      monday.setDate(diff)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      start_date = getLocalFormattedDate(monday)
      end_date = getLocalFormattedDate(sunday)
    } else if (mode === 'bulan_ini') {
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      start_date = `${y}-${m}-01`
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
      end_date = `${y}-${m}-${String(lastDay).padStart(2, '0')}`
    } else if (mode === 'tahun_ini') {
      const y = now.getFullYear()
      start_date = `${y}-01-01`
      end_date = `${y}-12-31`
    } else if (mode === 'custom' && date) {
      start_date = date
      end_date = date
    }

    onChange({ mode, start_date, end_date, date: mode === 'custom' ? date : '' })
  }, [mode, date])

  return (
    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
      {/* Mode Selector */}
      <select
        value={mode}
        onChange={e => setMode(e.target.value)}
        className="bg-white border border-zinc-300 text-zinc-700 text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-400 transition-colors cursor-pointer"
      >
        <option value="semua">Semua Waktu</option>
        <option value="hari_ini">Hari Ini</option>
        <option value="minggu_ini">Minggu Ini</option>
        <option value="bulan_ini">Bulan Ini</option>
        <option value="tahun_ini">Tahun Ini</option>
        <option value="custom">Custom</option>
      </select>

      {/* Date Picker (Custom) */}
      {mode === 'custom' && (
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-white border border-zinc-300 text-zinc-700 text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-400 transition-colors"
        />
      )}
    </div>
  )
}
