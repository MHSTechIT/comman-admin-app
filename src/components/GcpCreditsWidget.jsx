import { useState, useEffect, useRef } from 'react'
import { Zap, X, RefreshCw, ExternalLink } from 'lucide-react'

const GCP_METRICS_URL = '/api/gcp-metrics'
const GCP_BILLING = 'https://console.cloud.google.com/billing/linkedaccount?project=gen-lang-client-0040808089'

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
    if (!force && _cache && Date.now() - _cacheTime < CACHE_TTL) { setData(_cache); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(GCP_METRICS_URL, { signal: AbortSignal.timeout(15000) })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const json = await res.json()
      _cache = json; _cacheTime = Date.now(); setData(json)
    } catch (e) {
      setError(e.message || 'Failed to fetch')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (open) fetchMetrics() }, [open])
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const budget = data?.budget?.amount ?? 2000
  const currency = data?.budget?.currency === 'INR' ? '₹' : '$'

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition
          ${open ? 'bg-green-500/20 border-green-500/40 text-green-300'
                 : 'bg-white/5 border-dark-border text-dark-muted hover:text-white hover:bg-white/10'}`}>
        <Zap className="w-3.5 h-3.5" />
        <span>{currency}{budget.toLocaleString()} <span className="text-dark-muted">/ mo</span></span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
            <span className="text-sm font-semibold text-white">API Credit Balance</span>
            <div className="flex items-center gap-1">
              <button onClick={() => fetchMetrics(true)} disabled={loading}
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
                {/* Budget display */}
                <div className="text-center py-2">
                  <p className="text-3xl font-bold text-green-400">{currency}{budget.toLocaleString()}</p>
                  <p className="text-xs text-dark-muted mt-1">monthly budget</p>
                </div>

                {/* Plan details */}
                <div className="bg-white/5 border border-dark-border rounded-lg px-3 py-2.5 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-dark-muted">Plan</span><span className="text-white">Paid</span></div>
                  <div className="flex justify-between"><span className="text-dark-muted">Budget</span><span className="text-white">{currency}{budget.toLocaleString()} / month</span></div>
                  <div className="flex justify-between"><span className="text-dark-muted">Project</span><span className="text-white font-mono text-[10px]">{data.project_id}</span></div>
                </div>

                {/* API usage if available */}
                {data.metrics && (
                  <div className="bg-white/5 border border-dark-border rounded-lg px-3 py-2.5 text-xs space-y-1">
                    <p className="text-white font-medium mb-1">Usage (24h)</p>
                    <div className="flex justify-between">
                      <span className="text-dark-muted">API Calls</span>
                      <span className="text-white">{(data.metrics.generate_content_requests?.total_24h ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-muted">Input Tokens</span>
                      <span className="text-white">{(data.metrics.generate_content_input_token_count?.total_24h ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-muted">Output Tokens</span>
                      <span className="text-white">{(data.metrics.generate_content_output_token_count?.total_24h ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Enable APIs note */}
                {data.errors?.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 text-xs text-yellow-300">
                    <p className="font-medium mb-1">Enable APIs for live spend data:</p>
                    <a href="https://console.cloud.google.com/apis/library/monitoring.googleapis.com?project=gen-lang-client-0040808089"
                      target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline block">1. Enable Cloud Monitoring API</a>
                    <a href="https://console.cloud.google.com/apis/library/cloudbilling.googleapis.com?project=gen-lang-client-0040808089"
                      target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline block">2. Enable Cloud Billing API</a>
                  </div>
                )}
              </>
            )}

            {/* Billing console link */}
            <a href={GCP_BILLING} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition pt-1">
              <ExternalLink className="w-3 h-3" /> View real-time spend in GCP
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
