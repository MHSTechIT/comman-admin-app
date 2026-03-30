import { useState, useEffect, useRef } from 'react'
import { Zap, X, RefreshCw, ExternalLink, ArrowDownCircle, ArrowUpCircle, BarChart2 } from 'lucide-react'

// Always use the production Render backend for GCP metrics (service account lives there)
const GCP_METRICS_URL = 'https://common-chatbot-api.onrender.com/gcp-metrics'
const GCP_CONSOLE = 'https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas?project=gen-lang-client-0040808089'

function fmt(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return Number(n).toLocaleString()
}

// Module-level cache so all widgets share one fetch result
let _cache = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 min

export default function GcpCreditsWidget() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef(null)

  const fetchMetrics = async (force = false) => {
    // Use cache if fresh
    if (!force && _cache && Date.now() - _cacheTime < CACHE_TTL) {
      setData(_cache)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(GCP_METRICS_URL, { signal: AbortSignal.timeout(12000) })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json()
      _cache = json
      _cacheTime = Date.now()
      setData(json)
    } catch (e) {
      setError(e.name === 'TimeoutError' ? 'Request timed out' : (e.message || 'Failed to fetch'))
    } finally {
      setLoading(false)
    }
  }

  // Fetch when panel opens
  useEffect(() => {
    if (open) fetchMetrics()
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const requests = data?.metrics?.generate_content_requests?.total_24h ?? null
  const inputTok = data?.metrics?.generate_content_input_token_count?.total_24h ?? null
  const outputTok = data?.metrics?.generate_content_output_token_count?.total_24h ?? null
  const remaining = requests !== null ? Math.max(0, 1500 - requests) : null
  const pct = requests !== null ? Math.min(100, (requests / 1500) * 100) : 0
  const barColor = pct > 90 ? '#f87171' : pct > 66 ? '#fbbf24' : '#34d399'

  return (
    <div className="relative" ref={panelRef}>
      {/* Badge button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition
          ${open
            ? 'bg-green-500/20 border-green-500/40 text-green-300'
            : 'bg-white/5 border-dark-border text-dark-muted hover:text-white hover:bg-white/10'
          }`}
      >
        <Zap className="w-3.5 h-3.5" />
        {remaining !== null
          ? <span><span className="text-white font-semibold">{fmt(remaining)}</span> credits left</span>
          : <span>API Credits</span>
        }
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border bg-gradient-to-r from-green-900/30 to-transparent">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-white">Gemini API Usage (24h)</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchMetrics(true)}
                disabled={loading}
                className="p-1 rounded text-dark-muted hover:text-white transition"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setOpen(false)} className="p-1 rounded text-dark-muted hover:text-white transition">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Loading */}
            {loading && !data && (
              <div className="flex items-center gap-2 text-xs text-dark-muted py-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Fetching from Google Cloud Monitoring…
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Stats */}
            {data && (
              <>
                {/* Quota bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-dark-muted">Daily quota used</span>
                    <span className="text-white font-medium">{fmt(requests)} / 1,500</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: barColor }}>
                    {remaining !== null ? `${fmt(remaining)} requests remaining today` : '—'}
                  </p>
                </div>

                {/* Token stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 border border-dark-border rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ArrowDownCircle className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-dark-muted">Input Tokens</span>
                    </div>
                    <p className="text-lg font-bold text-white">{fmt(inputTok)}</p>
                  </div>
                  <div className="bg-white/5 border border-dark-border rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ArrowUpCircle className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-dark-muted">Output Tokens</span>
                    </div>
                    <p className="text-lg font-bold text-white">{fmt(outputTok)}</p>
                  </div>
                </div>

                {/* Zero state */}
                {requests === 0 && (
                  <p className="text-xs text-dark-muted bg-white/5 rounded-lg px-3 py-2">
                    No API calls recorded in the last 24h.
                  </p>
                )}
              </>
            )}

            {/* GCP link */}
            <a
              href={GCP_CONSOLE}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition pt-1"
            >
              <ExternalLink className="w-3 h-3" />
              View full quotas in GCP Console
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
