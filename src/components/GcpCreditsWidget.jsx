import { useState, useEffect, useRef } from 'react'
import { Zap, X, RefreshCw, ExternalLink, CheckCircle } from 'lucide-react'

const GCP_METRICS_URL = '/api/gcp-metrics'
const PROJECT_ID = 'gen-lang-client-0040808089'
const BILLING_URL = `https://console.cloud.google.com/billing/linkedaccount?project=${PROJECT_ID}`
const AI_STUDIO_URL = 'https://aistudio.google.com/apikey'
const BUDGET_URL = `https://console.cloud.google.com/billing/budgets?project=${PROJECT_ID}`

let _cache = null
let _cacheTime = 0
const CACHE_TTL = 10 * 60 * 1000

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
  const sym = (data?.budget?.currency || 'INR') === 'INR' ? '₹' : '$'

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition
          ${open ? 'bg-green-500/20 border-green-500/40 text-green-300'
                 : 'bg-white/5 border-dark-border text-dark-muted hover:text-white hover:bg-white/10'}`}>
        <Zap className="w-3.5 h-3.5" />
        <span>{sym}{budget.toLocaleString()} <span className="text-dark-muted">/ mo</span></span>
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
                {/* Budget */}
                <div className="text-center py-2">
                  <p className="text-3xl font-bold text-green-400">{sym}{budget.toLocaleString()}</p>
                  <p className="text-xs text-dark-muted mt-1">monthly budget</p>
                </div>

                {/* Status */}
                <div className="bg-white/5 border border-dark-border rounded-lg px-3 py-2.5 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-dark-muted">Billing</span>
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Plan</span>
                    <span className="text-white">Paid ({sym}{budget.toLocaleString()}/mo)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Project</span>
                    <span className="text-white font-mono text-[10px]">{data.project_id}</span>
                  </div>
                </div>

                {/* Quick links */}
                <div className="space-y-1.5">
                  <a href={BUDGET_URL} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-300 hover:bg-green-500/20 transition">
                    <span>View Spend &amp; Remaining Balance</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href={AI_STUDIO_URL} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 hover:bg-blue-500/20 transition">
                    <span>View API Key Usage (AI Studio)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href={BILLING_URL} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-dark-border text-xs text-dark-muted hover:text-white hover:bg-white/10 transition">
                    <span>Billing Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
