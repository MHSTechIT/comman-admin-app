import { useState, useEffect, useRef } from 'react'
import { Zap, X, RefreshCw, ExternalLink } from 'lucide-react'

const GCP_METRICS_URL = '/api/gcp-metrics'
const GCP_CONSOLE = 'https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas?project=gen-lang-client-0040808089'
const DAILY_LIMIT = 1500

function fmt(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return Number(n).toLocaleString()
}

let _cache = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

export default function GcpCreditsWidget() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef(null)

  const fetchMetrics = async (force = false) => {
    if (!force && _cache && Date.now() - _cacheTime < CACHE_TTL) {
      setData(_cache)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(GCP_METRICS_URL, { signal: AbortSignal.timeout(15000) })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json()
      _cache = json
      _cacheTime = Date.now()
      setData(json)
    } catch (e) {
      setError(e.name === 'TimeoutError' ? 'Backend starting up — try again in 30s' : (e.message || 'Failed to fetch'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (open) fetchMetrics() }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const used = data?.metrics?.generate_content_requests?.total_24h ?? 0
  const remaining = DAILY_LIMIT - used
  const pct = (used / DAILY_LIMIT) * 100
  const barColor = pct > 90 ? '#f87171' : pct > 66 ? '#fbbf24' : '#34d399'

  return (
    <div className="relative" ref={panelRef}>
      {/* Badge */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition
          ${open
            ? 'bg-green-500/20 border-green-500/40 text-green-300'
            : 'bg-white/5 border-dark-border text-dark-muted hover:text-white hover:bg-white/10'
          }`}
      >
        <Zap className="w-3.5 h-3.5" />
        {data
          ? <span><span className="text-white font-semibold">{fmt(remaining)}</span> credits left</span>
          : <span>API Credits</span>
        }
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
            <span className="text-sm font-semibold text-white">Credit Balance</span>
            <div className="flex items-center gap-1">
              <button onClick={() => fetchMetrics(true)} disabled={loading}
                className="p-1 rounded text-dark-muted hover:text-white transition" title="Refresh">
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
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading…
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}

            {data && (
              <>
                {/* Big remaining number */}
                <div className="text-center py-2">
                  <p className="text-4xl font-bold" style={{ color: barColor }}>{fmt(remaining)}</p>
                  <p className="text-xs text-dark-muted mt-1">credits remaining today</p>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-dark-muted">Used today</span>
                    <span className="text-white font-medium">{fmt(used)} / {fmt(DAILY_LIMIT)}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }} />
                  </div>
                </div>

                {/* Plan info */}
                <div className="bg-white/5 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-muted space-y-0.5">
                  <div className="flex justify-between"><span>Plan</span><span className="text-white">Free Tier</span></div>
                  <div className="flex justify-between"><span>Daily limit</span><span className="text-white">1,500 req</span></div>
                  <div className="flex justify-between"><span>Per-minute</span><span className="text-white">15 req</span></div>
                  <div className="flex justify-between"><span>Token limit</span><span className="text-white">1M / min</span></div>
                </div>
              </>
            )}

            <a href={GCP_CONSOLE} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition pt-1">
              <ExternalLink className="w-3 h-3" /> View in GCP Console
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
