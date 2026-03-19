import { TIME_SLOT_LABELS } from '../utils/labels'

export default function HomeTestModal({ booking, onClose }) {
  if (!booking) return null
  const slotLabel = TIME_SLOT_LABELS[booking.time_slot] ?? booking.time_slot
  const date = booking.preferred_date
    ? new Date(booking.preferred_date + 'Z').toLocaleDateString()
    : '—'
  const createdAt = booking.created_at
    ? new Date(booking.created_at).toLocaleString()
    : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-dark-card border border-dark-border rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-dark-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Home Test Booking</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-dark-muted hover:text-white p-1 rounded"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <Row label="Full name" value={booking.full_name} />
          <Row label="Mobile" value={booking.mobile} />
          <Row label="Address" value={booking.address} />
          <Row label="Pincode" value={booking.pincode} />
          <Row label="Preferred date" value={date} />
          <Row label="Time slot" value={slotLabel} />
          <Row label="Test panel" value={booking.test_panel} />
          <Row label="Booked at" value={createdAt} />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <span className="text-dark-muted block text-xs mb-0.5">{label}</span>
      <span className="text-gray-200">{value || '—'}</span>
    </div>
  )
}
