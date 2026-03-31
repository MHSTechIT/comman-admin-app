import { useState, useEffect, useRef } from 'react'
import { Zap, X, RefreshCw, ExternalLink } from 'lucide-react'

const GCP_METRICS_URL = '/api/gcp-metrics'
const GCP_BILLING = 'https://console.cloud.google.com/billing/linkedaccount?project=gen-lang-client-0040808089'

let _cache = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

function fmt(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

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
  const currency = (data?.budget?.currency || 'INR').trim() === 'INR' ? '₹' : '$'
  const spend = data?.spend
  const remaining = data?.remaining
  const geminiReqs = data?.usage?.gemini_requests ?? null
  const pct = spend != null ? Math.min(100, (spend / budget) * 100) : 0
  const barColor = pct > 90 ? '#f87171' : pct > 66 ? '#fbbf24' : '#34d399'

  // Badge text
  let badgeText
  if (remaining != null) {
    badgeText = <span><span className="text-white font-semibold">{currency}{fmt(remaining)}</span> left</span>
  } else if (geminiReqs != null) {
    badgeText = <span><span className="text-white font-semibold">{fmt(geminiReqs)}</span> API calls</span>
  } else {
    badgeText = <span>{currency}{fmt(budget)} <span className="text-dark-muted">/ mo</span></span>
  }

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition
          ${open ? 'bg-green-500/20 border-green-500/40 text-green-300'
                 : 'bg-white/5 border-dark-border text-dark-muted hover:text-white hover:bg-white/10'}`}>
        <Zap className="w-3.5 h-3.5" />
        {badgeText}
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
                {/* Balance — show remaining if available, else budget */}
                <div className="text-center py-2">
                  {remaining != null ? (
                    <>
                      <p className="text-3xl font-bold" style={{ color: barColor }}>{currency}{fmt(remaining)}</p>
                      <p className="text-xs text-dark-muted mt-1">remaining this month</p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-green-400">{currency}{fmt(budget)}</p>
                      <p className="text-xs text-dark-muted mt-1">monthly budget</p>
                    </>
                  )}
                </div>

                {/* Spend progress bar */}
                {spend != null && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-dark-muted">Spent this month</span>
                      <span className="text-white font-medium">{currency}{fmt(spend)} / {currency}{fmt(budget)}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: barColor }}>{pct.toFixed(1)}% used</p>
                  </div>
                )}

                {/* Spend + budget breakdown */}
                <div className="bg-white/5 border border-dark-border rounded-lg px-3 py-2.5 text-xs space-y-1">
                  {spend != null && (
                    <div className="flex justify-between">
                      <span className="text-dark-muted">Spent</span>
                      <span className="text-yellow-400 font-semibold">{currency}{fmt(spend)}</span>
                    </div>
                  )}
                  {remaining != null && (
                    <div className="flex justify-between">
                      <span className="text-dark-muted">Remaining</span>
                      <span className="text-green-400 font-semibold">{currency}{fmt(remaining)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Budget</span>
                    <span className="text-white">{currency}{fmt(budget)} / month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Billing</span>
                    <span className="text-green-400">{data.billingEnabled ? '✓ Active' : '✗ Inactive'}</span>
                  </div>
                </div>

                {/* Gemini usage */}
                {data.usage && (
                  <div className="bg-white/5 border border-dark-border rounded-lg px-3 py-2.5 text-xs space-y-1">
                    <p className="text-white font-medium">Usage this month</p>
                    <div className="flex justify-between">
                      <span className="text-dark-muted">Gemini API calls</span>
                      <span className="text-white font-semibold">{fmt(data.usage.gemini_requests)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-muted">Total API calls</span>
                      <span className="text-white">{fmt(data.usage.total_requests)}</span>
                    </div>
                  </div>
                )}

                {/* BQ data pending note */}
                {spend == null && !data.bqError && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 text-xs text-yellow-300">
                    Billing data populating — spend will appear within 24h after enabling BigQuery export.
                  </div>
                )}

                {/* BQ error */}
                {data.bqError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-300">
                    {data.bqError.includes('Not found') ? 'Billing export data not yet available — takes up to 24h.' : data.bqError}
                  </div>
                )}
              </>
            )}

            <a href={GCP_BILLING} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2.5 text-xs text-green-300 hover:bg-green-500/20 transition">
              <span>View Spend & Remaining Balance</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
