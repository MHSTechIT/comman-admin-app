import { GoogleAuth } from 'google-auth-library'

const MONTHLY_BUDGET = Number(process.env.GCP_MONTHLY_BUDGET || 2000)
const CURRENCY = (process.env.GCP_CURRENCY || 'INR').trim()

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
    billingEnabled: false,
    billingAccount: null,
  }

  try {
    const auth = new GoogleAuth({
      credentials: saInfo,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })
    const client = await auth.getClient()
    const { token } = await client.getAccessToken()
    const headers = { Authorization: `Bearer ${token}` }

    // Get billing info
    try {
      const billingResp = await fetch(
        `https://cloudbilling.googleapis.com/v1/projects/${projectId}/billingInfo`,
        { headers }
      )
      if (billingResp.ok) {
        const billingData = await billingResp.json()
        result.billingAccount = billingData.billingAccountName || null
        result.billingEnabled = billingData.billingEnabled || false
      }
    } catch {}
  } catch {}

  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')
  return res.status(200).json(result)
}
