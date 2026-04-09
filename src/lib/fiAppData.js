import { fiAppApiUrl } from './supabaseClientFiApp'

/**
 * Fetch user profile name by id
 */
export async function fetchUserName(id) {
  try {
    const res = await fetch(`${fiAppApiUrl}/api/users/${encodeURIComponent(id)}/profile`)
    if (!res.ok) return 'User'
    const json = await res.json()
    return json.name || 'User'
  } catch {
    return 'User'
  }
}

export const fetchFiAppUserName = fetchUserName

/**
 * Fetch food logs with optional filter: all | today | weekly | monthly
 */
export async function fetchFoodLogs(userId, filter = 'all') {
  try {
    const res = await fetch(
      `${fiAppApiUrl}/api/users/${encodeURIComponent(userId)}/food-logs?filter=${filter}`
    )
    if (!res.ok) return { data: [], error: `HTTP ${res.status}` }
    const json = await res.json()
    return { data: json.data || [], error: null }
  } catch (err) {
    return { data: [], error: err.message }
  }
}

/**
 * Fetch drink/water logs with optional filter: all | today | weekly | monthly
 */
export async function fetchDrinkLogs(userId, filter = 'all') {
  try {
    const res = await fetch(
      `${fiAppApiUrl}/api/users/${encodeURIComponent(userId)}/drink-logs?filter=${filter}`
    )
    if (!res.ok) return { data: [], error: `HTTP ${res.status}` }
    const json = await res.json()
    return { data: json.data || [], error: null }
  } catch (err) {
    return { data: [], error: err.message }
  }
}

/**
 * Fetch sleep logs with optional filter: all | today | weekly | monthly
 */
export async function fetchSleepLogs(userId, filter = 'all') {
  try {
    const res = await fetch(
      `${fiAppApiUrl}/api/users/${encodeURIComponent(userId)}/sleep-logs?filter=${filter}`
    )
    if (!res.ok) return { data: [], error: `HTTP ${res.status}` }
    const json = await res.json()
    return { data: json.data || [], error: null }
  } catch (err) {
    return { data: [], error: err.message }
  }
}

/**
 * Fetch health reports
 */
export async function fetchReports(userId) {
  try {
    const res = await fetch(
      `${fiAppApiUrl}/api/users/${encodeURIComponent(userId)}/reports`
    )
    if (!res.ok) return { data: [], error: `HTTP ${res.status}` }
    const json = await res.json()
    return { data: json.data || [], error: null }
  } catch (err) {
    return { data: [], error: err.message }
  }
}
