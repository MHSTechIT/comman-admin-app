import { GoogleAuth } from 'google-auth-library'
import { BigQuery } from '@google-cloud/bigquery'

const MONTHLY_BUDGET = Number(process.env.GCP_MONTHLY_BUDGET || 2000)
const CURRENCY = (process.env.GCP_CURRENCY || 'INR').trim()
const BQ_DATASET = (process.env.GCP_BQ_DATASET || 'billing_export').trim()

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
    remaining: null,
    billingEnabled: false,
    billingAccount: null,
    usage: null,
  }

  try {
    const auth = new GoogleAuth({
      credentials: saInfo,
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/cloud-billing',
        'https://www.googleapis.com/auth/bigquery.readonly',
      ],
    })
    const client = await auth.getClient()
    const { token } = await client.getAccessToken()
    const headers = { Authorization: `Bearer ${token}` }

    // 1. Get billing info
    let billingId = null
    try {
      const billingResp = await fetch(
        `https://cloudbilling.googleapis.com/v1/projects/${projectId}/billingInfo`, { headers }
      )
      if (billingResp.ok) {
        const d = await billingResp.json()
        result.billingAccount = d.billingAccountName || null
        result.billingEnabled = d.billingEnabled || false
        billingId = (d.billingAccountName || '').replace('billingAccounts/', '')
      }
    } catch {}

    // 2. Get billing account display name
    if (billingId) {
      try {
        const costResp = await fetch(
          `https://cloudbilling.googleapis.com/v1/billingAccounts/${billingId}`, { headers }
        )
        if (costResp.ok) {
          const d = await costResp.json()
          result.billingAccountName = d.displayName || null
        }
      } catch {}
    }

    // 3. Query BigQuery billing export for current month's spend
    if (billingId) {
      try {
        const bq = new BigQuery({ projectId, credentials: saInfo })
        // Billing export table name uses billing account ID with dashes replaced by underscores
        const tableId = `gcp_billing_export_v1_${billingId.replace(/-/g, '_')}`
        const query = `
          SELECT
            SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS total_cost
          FROM \`${projectId}.${BQ_DATASET}.${tableId}\`
          WHERE invoice.month = FORMAT_DATE('%Y%m', CURRENT_DATE())
        `
        // Auto-detect dataset location (could be US, EU, asia-south1, etc.)
        let bqLocation = (process.env.GCP_BQ_LOCATION || '').trim()
        let bqLocationSource = 'env'
        if (!bqLocation) {
          try {
            const [meta] = await bq.dataset(BQ_DATASET).getMetadata()
            bqLocation = meta.location || 'US'
            bqLocationSource = 'dataset-meta'
          } catch (metaErr) {
            bqLocation = 'US'
            bqLocationSource = 'fallback'
            result.bqDebug = { metaError: metaErr.message, dataset: BQ_DATASET, tableId }
          }
        }
        result.bqLocationUsed = bqLocation

        // Auto-detect actual table name from dataset (billing export table name varies)
        let resolvedTableId = tableId
        try {
          const [tables] = await bq.dataset(BQ_DATASET).getTables()
          const tableIds = tables.map(t => t.id)
          result.bqTablesFound = tableIds
          const billingTable = tableIds.find(id => id.startsWith('gcp_billing_export_v1_'))
          if (billingTable) resolvedTableId = billingTable
        } catch {}

        const resolvedQuery = `
          SELECT
            SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS total_cost
          FROM \`${projectId}.${BQ_DATASET}.${resolvedTableId}\`
          WHERE invoice.month = FORMAT_DATE('%Y%m', CURRENT_DATE())
        `
        const [rows] = await bq.query({ query: resolvedQuery, location: bqLocation })
        if (rows && rows.length > 0 && rows[0].total_cost !== null) {
          const spend = Math.round(Number(rows[0].total_cost) * 100) / 100
          result.spend = spend
          result.remaining = Math.round((MONTHLY_BUDGET - spend) * 100) / 100
        }
      } catch (e) {
        result.bqError = e.message || 'BigQuery query failed'
      }
    }

    // 4. Get this month's API request count from Cloud Monitoring
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const params = new URLSearchParams({
        filter: 'metric.type="serviceruntime.googleapis.com/api/request_count"',
        'interval.startTime': startOfMonth,
        'interval.endTime': now.toISOString(),
        'aggregation.alignmentPeriod': '2592000s',
        'aggregation.perSeriesAligner': 'ALIGN_SUM',
        'aggregation.groupByFields': 'resource.labels.service',
        'aggregation.crossSeriesReducer': 'REDUCE_SUM',
      })

      const monResp = await fetch(
        `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries?${params}`,
        { headers }
      )
      if (monResp.ok) {
        const monData = await monResp.json()
        const usage = {}
        let totalRequests = 0
        for (const ts of monData.timeSeries || []) {
          const service = ts.resource?.labels?.service || 'unknown'
          let count = 0
          for (const p of ts.points || []) {
            count += Number(p.value?.int64Value || 0)
          }
          if (count > 0) {
            usage[service] = count
            totalRequests += count
          }
        }
        result.usage = {
          total_requests: totalRequests,
          gemini_requests: usage['generativelanguage.googleapis.com'] || 0,
          by_service: usage,
        }
      }
    } catch {}
  } catch {}

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  return res.status(200).json(result)
}
