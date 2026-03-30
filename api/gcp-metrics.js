import { GoogleAuth } from 'google-auth-library'

const MONTHLY_BUDGET = Number(process.env.GCP_MONTHLY_BUDGET || 2000)
const CURRENCY = process.env.GCP_CURRENCY || 'INR'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const saJson = process.env.GCP_SERVICE_ACCOUNT_JSON
  if (!saJson) return res.status(503).json({ error: 'GCP credentials not configured' })

  let saInfo
  try { saInfo = JSON.parse(saJson) } catch { return res.status(500).json({ error: 'Invalid GCP credentials' }) }

  const projectId = saInfo.project_id
  const result = {
    project_id: projectId,
    budget: { amount: MONTHLY_BUDGET, currency: CURRENCY, period: 'monthly' },
    spend: null,
    metrics: null,
    errors: [],
  }

  try {
    const auth = new GoogleAuth({
      credentials: saInfo,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })
    const client = await auth.getClient()
    const { token } = await client.getAccessToken()
    const headers = { Authorization: `Bearer ${token}` }

    // 1. Try Cloud Billing API — get project billing info + cost
    try {
      const billingResp = await fetch(
        `https://cloudbilling.googleapis.com/v1/projects/${projectId}/billingInfo`,
        { headers }
      )
      if (billingResp.ok) {
        const billingData = await billingResp.json()
        result.billingAccount = billingData.billingAccountName || null
        result.billingEnabled = billingData.billingEnabled || false
      } else {
        result.errors.push('billing_api_disabled')
      }
    } catch (e) {
      result.errors.push('billing_api_error')
    }

    // 2. Try Cloud Monitoring API — get API request counts
    try {
      const now = new Date()
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const baseUrl = `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries`
      const metricTypes = [
        'generativelanguage.googleapis.com/generate_content_requests',
        'generativelanguage.googleapis.com/generate_content_input_token_count',
        'generativelanguage.googleapis.com/generate_content_output_token_count',
      ]
      const metrics = {}
      for (const metricType of metricTypes) {
        const params = new URLSearchParams({
          filter: `metric.type="${metricType}"`,
          'interval.startTime': start.toISOString(),
          'interval.endTime': now.toISOString(),
          'aggregation.alignmentPeriod': '86400s',
          'aggregation.perSeriesAligner': 'ALIGN_SUM',
          'aggregation.crossSeriesReducer': 'REDUCE_SUM',
        })
        const resp = await fetch(`${baseUrl}?${params}`, { headers })
        if (resp.ok) {
          const data = await resp.json()
          let total = 0
          for (const ts of data.timeSeries || []) {
            for (const p of ts.points || []) {
              total += Number(p.value?.int64Value || p.value?.doubleValue || 0)
            }
          }
          metrics[metricType.split('/').pop()] = { total_24h: total }
        }
      }
      if (Object.keys(metrics).length > 0) result.metrics = metrics
      else result.errors.push('monitoring_api_disabled')
    } catch (e) {
      result.errors.push('monitoring_api_error')
    }
  } catch (e) {
    result.errors.push(e.message)
  }

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  return res.status(200).json(result)
}
