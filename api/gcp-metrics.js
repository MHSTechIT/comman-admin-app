import { GoogleAuth } from 'google-auth-library'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const saJson = process.env.GCP_SERVICE_ACCOUNT_JSON
  if (!saJson) return res.status(503).json({ error: 'GCP credentials not configured' })

  let saInfo
  try {
    saInfo = JSON.parse(saJson)
  } catch {
    return res.status(500).json({ error: 'Invalid GCP credentials JSON' })
  }

  try {
    const auth = new GoogleAuth({
      credentials: saInfo,
      scopes: ['https://www.googleapis.com/auth/monitoring.read'],
    })
    const client = await auth.getClient()
    const tokenRes = await client.getAccessToken()
    const token = tokenRes.token

    const projectId = saInfo.project_id
    const now = new Date()
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const baseUrl = `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries`
    const headers = { Authorization: `Bearer ${token}` }

    const metricTypes = [
      'generativelanguage.googleapis.com/generate_content_requests',
      'generativelanguage.googleapis.com/generate_content_input_token_count',
      'generativelanguage.googleapis.com/generate_content_output_token_count',
    ]

    const results = { project_id: projectId, metrics: {} }

    for (const metricType of metricTypes) {
      const shortName = metricType.split('/').pop()
      const params = new URLSearchParams({
        filter: `metric.type="${metricType}"`,
        'interval.startTime': start.toISOString(),
        'interval.endTime': now.toISOString(),
        'aggregation.alignmentPeriod': '86400s',
        'aggregation.perSeriesAligner': 'ALIGN_SUM',
        'aggregation.crossSeriesReducer': 'REDUCE_SUM',
      })

      const resp = await fetch(`${baseUrl}?${params}`, { headers })
      const data = await resp.json()
      const timeSeries = data.timeSeries || []
      let total = 0
      for (const ts of timeSeries) {
        for (const p of ts.points || []) {
          total += Number(p.value?.int64Value || p.value?.doubleValue || 0)
        }
      }
      results.metrics[shortName] = { total_24h: total }
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(results)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch metrics' })
  }
}
