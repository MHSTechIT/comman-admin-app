import { useState, useEffect, useRef } from 'react'
import { Mic, X, RefreshCw, ExternalLink } from 'lucide-react'

const CHATBOT_API = (import.meta.env.VITE_CHATBOT_API_URL || 'https://common-chatbot-api.onrender.com').trim()
const EL_DASHBOARD = 'https://elevenlabs.io/app/subscription'

let _cache = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

function fmt(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString()
}

export default function ElevenLabsWidget() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef(null)

  const fetchCredits = async (force = false) => {
    if (!force && _cache && Date.now() - _cacheTime < CACHE_TTL) { setData(_cache); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${CHATBOT_API}/elevenlabs-credits`, { signal: AbortSignal.timeout(15000) })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const json = await res.json()
      _cache = json; _cacheTime = Date.now(); setData(json)
    } catch (e) {
      setError(e.message || 'Failed to fetch')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (open) fetchCredits() }, [open])
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const used = data?.character_count ?? null
  const limit = data?.character_limit ?? null
  const remaining = (used != null && limit != null) ? limit - used : null
  const pct = used != null && limit ? Math.min(100, (used / limit) * 100) : 0
  const barColor = pct > 90 ? '#f87171' : pct > 66 ? '#fbbf24' : '#34d399'
  const tier = data?.tier || ''

  const badgeText = remaining != null
    ? <span><span className="text-white font-semibold">{fmt(remaining)}</span> chars left</span>
    : <span>ElevenLabs</span>

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition
          ${open ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                 : 'bg-white/5 border-dark-border text-dark-muted hover:text-white hover:bg-white/10'}`}
      >
        <Mic className="w-3.5 h-3.5" />
        {badgeText}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
            <span className="text-sm font-semibold text-white">ElevenLabs Credits</span>
            <div className="flex items-center gap-1">
              <button onClick={() => fetchCredits(true)} disabled={loading}
                className="p-1 rounded text-dark-muted hover:text-white transition">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setOpen(false)} className="p-1 rounded text-dark-muted hover:text-white transition">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {loading && !data && (
              <div className="flex items-center gap-2 text-xs text-dark-muted py-4 justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-300">{error}</div>
            )}
            {data && (
              <>
                <div className="text-center py-2">
                  <p className="text-3xl font-bold" style={{ color: barColor }}>{fmt(remaining)}</p>
                  <p className="text-xs text-dark-muted mt-1">characters remaining</p>
                  {tier && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 capitalize mt-1 inline-block">{tier}</span>}
                </div>

                {used != null && limit != null && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-dark-muted">Used this month</span>
                      <span className="text-white font-medium">{fmt(used)} / {fmt(limit)}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: barColor }}>{pct.toFixed(1)}% used</p>
                  </div>
                )}

                <div className="bg-white/5 border border-dark-border rounded-lg px-3 py-2.5 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Characters used</span>
                    <span className="text-yellow-400 font-semibold">{fmt(used)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Monthly limit</span>
                    <span className="text-white">{fmt(limit)}</span>
                  </div>
                  {data.next_character_count_reset_unix && (
                    <div className="flex justify-between">
                      <span className="text-dark-muted">Resets on</span>
                      <span className="text-white">{new Date(data.next_character_count_reset_unix * 1000).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <a href={EL_DASHBOARD} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2.5 text-xs text-orange-300 hover:bg-orange-500/20 transition">
              <span>View ElevenLabs Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
