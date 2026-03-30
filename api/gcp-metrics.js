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
    spend: null,
    remaining: null,
    billingEnabled: false,
    billingAccount: null,
  }

  try {
    const auth = new GoogleAuth({
      credentials: saInfo,
      scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/cloud-billing'],
    })
    const client = await auth.getClient()
    const { token } = await client.getAccessToken()
    const headers = { Authorization: `Bearer ${token}` }

    // 1. Get billing account info
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

    // 2. Try to get budget + actual spend from Billing Budgets API
    if (result.billingAccount) {
      const billingId = result.billingAccount.replace('billingAccounts/', '')
      try {
        // Enable budgets API check
        const budgetsResp = await fetch(
          `https://billingbudgets.googleapis.com/v1/billingAccounts/${billingId}/budgets`,
          { headers }
        )
        if (budgetsResp.ok) {
          const budgetsData = await budgetsResp.json()
          const budgets = budgetsData.budgets || []
          if (budgets.length > 0) {
            // Get the first budget's details (has actual spend)
            const budgetName = budgets[0].name
            const detailResp = await fetch(
              `https://billingbudgets.googleapis.com/v1/${budgetName}`,
              { headers }
            )
            if (detailResp.ok) {
              const detail = await detailResp.json()
              // Budget amount
              const budgetAmount = detail.amount?.specifiedAmount?.units
                ? Number(detail.amount.specifiedAmount.units)
                : MONTHLY_BUDGET
              result.budget.amount = budgetAmount

              // Currency from budget
              const budgetCurrency = detail.amount?.specifiedAmount?.currencyCode
              if (budgetCurrency) result.budget.currency = budgetCurrency
            }
          }
        }
      } catch {}

      // 3. Try cost info from billing account
      try {
        const costResp = await fetch(
          `https://cloudbilling.googleapis.com/v1/billingAccounts/${billingId}`,
          { headers }
        )
        if (costResp.ok) {
          const costData = await costResp.json()
          result.billingAccountName = costData.displayName || null
        }
      } catch {}
    }
  } catch {}

  // Calculate remaining
  if (result.spend !== null) {
    result.remaining = Math.max(0, result.budget.amount - result.spend)
  }

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  return res.status(200).json(result)
}
