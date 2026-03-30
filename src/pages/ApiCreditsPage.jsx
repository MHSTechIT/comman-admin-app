import { useEffect, useState, useCallback } from 'react'
import { ExternalLink, CheckCircle, XCircle, RefreshCw, Key, Cpu, Zap, BarChart2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

const GCP_PROJECT_ID = import.meta.env.VITE_GCP_PROJECT_ID || 'gen-lang-client-0040808089'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const CHATBOT_API = import.meta.env.VITE_CHATBOT_API_URL || 'https://common-chatbot-api.onrender.com'

const HIGHLIGHT_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']

const APIS = [
  {
    id: 'chatbot',
    label: 'Chatbot Module',
    description: 'Gemini API used by the MHS Chatbot',
    apiKey: import.meta.env.VITE_GEMINI_CHATBOT_KEY,
    color: 'purple',
    gcpLink: `https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas?project=${GCP_PROJECT_ID}`,
    billingLink: `https://console.cloud.google.com/billing/linkedaccount?project=${GCP_PROJECT_ID}`,
  },
  {
    id: 'fiapp',
    label: 'Fi App Module',
    description: 'Gemini API used by the Fi App',
    apiKey: import.meta.env.VITE_GEMINI_FIAPP_KEY,
    color: 'blue',
    gcpLink: `https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas?project=${GCP_PROJECT_ID}`,
    billingLink: `https://console.cloud.google.com/billing/linkedaccount?project=${GCP_PROJECT_ID}`,
  },
]

function maskKey(key) {
  if (!key) return 'Not configured'
  return key.slice(0, 8) + '••••••••••••••••••••' + key.slice(-4)
}

function formatNumber(n) {
  if (n == null || n === '') return '—'
  const num = Number(n)
  if (isNaN(num)) return '—'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  return num.toLocaleString()
}

// ─── GCP Metrics Panel (shared for all keys, same project) ───────────────────
function GcpMetricsPanel() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${CHATBOT_API}/gcp-metrics`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message || 'Failed to fetch metrics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMetrics() }, [fetchMetrics])

  const requests = data?.metrics?.generate_content_requests?.total_24h ?? null
  const inputTokens = data?.metrics?.generate_content_input_token_count?.total_24h ?? null
  const outputTokens = data?.metrics?.generate_content_output_token_count?.total_24h ?? null

  return (
    <div className="bg-dark-card border border-green-500/20 rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-900/40 to-transparent px-6 py-5 border-b border-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-green-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Real-Time Usage (Last 24h)</h2>
              <p className="text-sm text-dark-muted">Live data from Google Cloud Monitoring · Project: <code className="text-green-400">{GCP_PROJECT_ID}</code></p>
            </div>
          </div>
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center gap-3 text-dark-muted text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Fetching Cloud Monitoring data…
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-300">
            {error}
            {error.includes('not configured') && (
              <p className="text-red-400/60 mt-1 text-xs">Set GCP_SERVICE_ACCOUNT_JSON in the Render backend environment variables.</p>
            )}
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* API Requests */}
              <div className="bg-white/5 border border-dark-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-dark-muted uppercase tracking-wider">API Requests</span>
                </div>
                <p className="text-3xl font-bold text-white">{formatNumber(requests)}</p>
                <p className="text-xs text-dark-muted mt-1">Total calls in 24h</p>
              </div>

              {/* Input Tokens */}
              <div className="bg-white/5 border border-dark-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-dark-muted uppercase tracking-wider">Input Tokens</span>
                </div>
                <p className="text-3xl font-bold text-white">{formatNumber(inputTokens)}</p>
                <p className="text-xs text-dark-muted mt-1">Tokens sent to model</p>
              </div>

              {/* Output Tokens */}
              <div className="bg-white/5 border border-dark-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpCircle className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-dark-muted uppercase tracking-wider">Output Tokens</span>
                </div>
                <p className="text-3xl font-bold text-white">{formatNumber(outputTokens)}</p>
                <p className="text-xs text-dark-muted mt-1">Tokens received from model</p>
              </div>
            </div>

            {/* Free tier quota bar */}
            {requests !== null && (
              <div className="bg-white/5 border border-dark-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-dark-muted">Daily Request Quota (Free tier: 1,500 / day)</span>
                  <span className="text-xs text-white font-medium">{formatNumber(requests)} / 1,500</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (requests / 1500) * 100)}%`,
                      backgroundColor: requests > 1350 ? '#f87171' : requests > 1000 ? '#fbbf24' : '#34d399'
                    }}
                  />
                </div>
                <p className="text-xs text-dark-muted mt-1.5">
                  {1500 - requests > 0 ? `${formatNumber(1500 - requests)} requests remaining today` : 'Daily quota reached'}
                </p>
              </div>
            )}

            {/* Zero data notice */}
            {requests === 0 && inputTokens === 0 && outputTokens === 0 && (
              <p className="text-xs text-dark-muted bg-white/5 rounded-lg px-4 py-3">
                No API calls recorded in the last 24 hours for this project. Make a Gemini API request and refresh to see live data.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Per-key API status card ──────────────────────────────────────────────────
function ApiCard({ api }) {
  const [status, setStatus] = useState('loading')
  const [models, setModels] = useState([])
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchModels = async () => {
    setStatus('loading')
    setRefreshing(true)
    setError('')
    try {
      const res = await fetch(`${GEMINI_BASE}?key=${api.apiKey}`)
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setError(data?.error?.message || 'API key invalid or quota exceeded')
      } else {
        const filtered = (data.models || []).filter(m =>
          HIGHLIGHT_MODELS.some(h => m.name.includes(h))
        )
        setModels(filtered.length ? filtered : (data.models || []).slice(0, 5))
        setStatus('ok')
      }
    } catch {
      setStatus('error')
      setError('Network error — could not reach Gemini API')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchModels() }, [])

  const colorMap = {
    purple: {
      border: 'border-purple-500/30',
      badge: 'bg-purple-500/20 text-purple-300',
      icon: 'text-purple-400',
      header: 'from-purple-900/40 to-transparent',
      modelBg: 'bg-purple-500/10 border-purple-500/20',
    },
    blue: {
      border: 'border-blue-500/30',
      badge: 'bg-blue-500/20 text-blue-300',
      icon: 'text-blue-400',
      header: 'from-blue-900/40 to-transparent',
      modelBg: 'bg-blue-500/10 border-blue-500/20',
    },
  }
  const c = colorMap[api.color]

  return (
    <div className={`bg-dark-card border ${c.border} rounded-xl overflow-hidden`}>
      <div className={`bg-gradient-to-r ${c.header} px-6 py-5 border-b border-dark-border`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className={`w-5 h-5 ${c.icon}`} />
              <h2 className="text-lg font-semibold text-white">{api.label}</h2>
            </div>
            <p className="text-sm text-dark-muted">{api.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {status === 'loading' && (
              <span className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full">
                <RefreshCw className="w-3 h-3 animate-spin" /> Checking...
              </span>
            )}
            {status === 'ok' && (
              <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" /> Active
              </span>
            )}
            {status === 'error' && (
              <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full">
                <XCircle className="w-3 h-3" /> Error
              </span>
            )}
            <button onClick={fetchModels} disabled={refreshing}
              className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-white/5 transition">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Key className={`w-4 h-4 ${c.icon}`} />
            <span className="text-xs font-medium text-dark-muted uppercase tracking-wider">API Key</span>
          </div>
          <code className="text-sm text-dark-muted font-mono bg-black/30 px-3 py-1.5 rounded-lg block">
            {maskKey(api.apiKey)}
          </code>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className={`w-4 h-4 ${c.icon}`} />
            <span className="text-xs font-medium text-dark-muted uppercase tracking-wider">GCP Project ID</span>
          </div>
          <code className="text-sm text-white font-mono bg-black/30 px-3 py-1.5 rounded-lg block">
            {GCP_PROJECT_ID}
          </code>
        </div>

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {status === 'ok' && models.length > 0 && (
          <div>
            <span className="text-xs font-medium text-dark-muted uppercase tracking-wider block mb-3">
              Available Models
            </span>
            <div className="space-y-2">
              {models.map(m => (
                <div key={m.name} className={`border ${c.modelBg} rounded-lg px-4 py-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{m.displayName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>v{m.version || '—'}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-dark-muted">
                    <span>Input: <span className="text-white">{formatNumber(m.inputTokenLimit)} tokens</span></span>
                    <span>Output: <span className="text-white">{formatNumber(m.outputTokenLimit)} tokens</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'ok' && (
          <div className="bg-white/5 border border-dark-border rounded-lg px-4 py-3 text-xs text-dark-muted space-y-1">
            <p className="text-white font-medium text-xs mb-1">Free Tier Quotas (Gemini Flash)</p>
            <div className="flex gap-4 flex-wrap">
              <span>15 req / min</span>
              <span>1,000,000 tokens / min</span>
              <span>1,500 req / day</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <a href={api.gcpLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition">
            <ExternalLink className="w-3.5 h-3.5" /> View Quotas in GCP
          </a>
          <a href={api.billingLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition">
            <ExternalLink className="w-3.5 h-3.5" /> Billing Console
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ApiCreditsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Credits</h1>
          <p className="text-dark-muted text-sm mt-1">
            Live status &amp; real usage data for Google Gemini API keys across all modules
          </p>
        </div>
        <a
          href={`https://console.cloud.google.com/apis/dashboard?project=${GCP_PROJECT_ID}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-dark-border text-sm text-white hover:bg-white/10 transition"
        >
          <ExternalLink className="w-4 h-4" /> GCP Console
        </a>
      </div>

      {/* Real-time metrics from Cloud Monitoring */}
      <GcpMetricsPanel />

      {/* Per-key status cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {APIS.map(api => <ApiCard key={api.id} api={api} />)}
      </div>
    </div>
  )
}
