import { useState, useRef, useEffect } from 'react'
import { ADMIN_STATUS_LABELS } from '../utils/labels'

const STATUS_OPTIONS = ['fresh', 'pending', 'completed']
const STATUS_COLORS = {
  fresh: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
}

export default function StatusDropdown({ currentStatus, profileId, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(currentStatus || 'fresh')
  const ref = useRef(null)

  useEffect(() => {
    setStatus(currentStatus || 'fresh')
  }, [currentStatus])

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (value) => {
    setStatus(value)
    setOpen(false)
    onUpdate(profileId, value)
  }

  const color = STATUS_COLORS[status] ?? STATUS_COLORS.fresh
  return (
    <div className="relative stop-row-click" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer hover:opacity-90 ${color}`}
      >
        {ADMIN_STATUS_LABELS[status] ?? status}
        <span className="text-[10px]">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[120px] rounded-lg border border-dark-border bg-dark-card shadow-xl py-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${status === opt ? 'bg-white/10' : ''}`}
            >
              {ADMIN_STATUS_LABELS[opt]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
