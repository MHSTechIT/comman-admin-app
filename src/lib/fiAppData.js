/**
 * Fi App data fetcher - tries multiple table/column combinations
 * to handle different schema naming (user_id vs profile_id, etc.)
 */
import { supabaseFiApp } from './supabaseClientFiApp'

const USER_COLS = ['user_id', 'profile_id', 'user_uuid']

/** True if error means table/relation doesn't exist - try next, don't surface error */
function isTableNotFound(err) {
  const msg = (err?.message || '').toLowerCase()
  return msg.includes('does not exist') || msg.includes('could not find') || msg.includes('schema cache')
}

/**
 * Fetch user profile name by id (tries profiles_public + profiles)
 */
export async function fetchUserName(id) {
  for (const [table, col] of [
    ['profiles_public', 'user_id'],
    ['profiles', 'id'],
    ['profiles_public', 'id'],
  ]) {
    const { data, error } = await supabaseFiApp.from(table).select('name').eq(col, id).maybeSingle()
    if (!error && data) return data.name || 'User'
  }
  return 'User'
}

export const fetchFiAppUserName = fetchUserName

/**
 * Flatten food_logs + meal_items into a single list for display
 */
function flattenFoodLogs(foodLogs) {
  if (!Array.isArray(foodLogs)) return []
  const out = []
  for (const log of foodLogs) {
    const items = log.meal_items || log.mealItems || []
    if (items.length) {
      for (const m of items) {
        out.push({
          ...m,
          created_at: m.created_at || log.created_at,
          date_key: m.date_key || log.date_key,
        })
      }
    } else {
      out.push(log)
    }
  }
  return out
}

/**
 * Fetch food logs - tries food_logs (with optional meal_items join), meal_items, meal_logs
 */
export async function fetchFoodLogs(userId, filter) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const dateCols = ['created_at', 'date_key', 'date', 'logged_at']

  const joinAttempts = [
    { table: 'food_logs', col: 'user_id', select: '*, meal_items(*)' },
    { table: 'food_logs', col: 'profile_id', select: '*, meal_items(*)' },
  ]
  for (const { table, col, select } of joinAttempts) {
    let q = supabaseFiApp.from(table).select(select).eq(col, userId)
    for (const dateCol of dateCols) {
      let q2 = q
      if (filter === 'today') q2 = q2.gte(dateCol, today)
      else if (filter === 'weekly') q2 = q2.gte(dateCol, weekAgo)
      else if (filter === 'monthly') q2 = q2.gte(dateCol, monthAgo)
      const res = await q2.order(dateCol, { ascending: false })
      if (!res.error) {
        const flat = flattenFoodLogs(res.data || [])
        return { data: flat.length ? flat : (res.data || []), error: null }
      }
    }
    const fallback = await supabaseFiApp.from(table).select(select).eq(col, userId)
    const res = await fallback.order('created_at', { ascending: false })
    if (!res.error) {
      let items = flattenFoodLogs(res.data || [])
      if (filter !== 'all') {
        items = items.filter((r) => {
          const d = r.created_at || r.date_key || r.date || ''
          const dStr = (typeof d === 'string' ? d : '').slice(0, 10)
          if (filter === 'today') return dStr >= today
          if (filter === 'weekly') return dStr >= weekAgo
          if (filter === 'monthly') return dStr >= monthAgo
          return true
        })
      }
      return { data: items.length ? items : (res.data || []), error: null }
    }
  }

  const attempts = [
    ['food_logs', 'user_id'],
    ['food_logs', 'profile_id'],
    ['meal_items', 'user_id'],
    ['meal_items', 'profile_id'],
    ['meal_logs', 'user_id'],
    ['meal_logs', 'profile_id'],
    ['food_log', 'user_id'],
  ]

  for (const [table, col] of attempts) {
    let q = supabaseFiApp.from(table).select('*').eq(col, userId)
    let data = null
    let error = null
    for (const dateCol of dateCols) {
      let q2 = q
      if (filter === 'today') q2 = q2.gte(dateCol, today)
      else if (filter === 'weekly') q2 = q2.gte(dateCol, weekAgo)
      else if (filter === 'monthly') q2 = q2.gte(dateCol, monthAgo)
      const res = await q2.order(dateCol, { ascending: false })
      if (!res.error) {
        data = res.data || []
        error = null
        break
      }
      error = res.error
    }
    if (error) {
      for (const orderCol of ['created_at', 'date_key', 'date', 'id']) {
        const res = await supabaseFiApp.from(table).select('*').eq(col, userId).order(orderCol, { ascending: false })
        if (!res.error) {
          let items = res.data || []
          if (filter !== 'all') {
            items = items.filter((r) => {
              const d = r.created_at || r.date_key || r.date || ''
              const dStr = (typeof d === 'string' ? d : '').slice(0, 10)
              if (filter === 'today') return dStr >= today
              if (filter === 'weekly') return dStr >= weekAgo
              if (filter === 'monthly') return dStr >= monthAgo
              return true
            })
          }
          return { data: items, error: null }
        }
      }
    }
    if (!error) return { data: data || [], error: null }
    if (!isTableNotFound(error)) return { data: [], error: error.message }
  }
  return { data: [], error: null }
}

/**
 * Fetch drink/water logs - tries daily_logs, water_logs, drink_logs
 */
export async function fetchDrinkLogs(userId, filter) {
  const attempts = [
    ['daily_logs', 'user_id'],
    ['daily_logs', 'profile_id'],
    ['water_logs', 'user_id'],
    ['water_logs', 'profile_id'],
    ['drink_logs', 'user_id'],
  ]
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  for (const [table, col] of attempts) {
    let q = supabaseFiApp.from(table).select('*').eq(col, userId)
    const dateCols = ['date_key', 'created_at', 'date']
    let data = null
    let error = null
    for (const dateCol of dateCols) {
      let q2 = q
      if (filter === 'today') q2 = q2.gte(dateCol, today)
      else if (filter === 'weekly') q2 = q2.gte(dateCol, weekAgo)
      else if (filter === 'monthly') q2 = q2.gte(dateCol, monthAgo)
      const res = await q2.order(dateCol, { ascending: false })
      if (!res.error) {
        data = res.data || []
        error = null
        break
      }
      error = res.error
    }
    if (!error) return { data: data || [], error: null }
    if (!isTableNotFound(error)) return { data: [], error: error?.message }
  }
  return { data: [], error: null }
}

/**
 * Fetch sleep logs - tries daily_logs, sleep_logs
 */
export async function fetchSleepLogs(userId, filter) {
  const attempts = [
    ['daily_logs', 'user_id'],
    ['daily_logs', 'profile_id'],
    ['sleep_logs', 'user_id'],
    ['sleep_logs', 'profile_id'],
  ]
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  for (const [table, col] of attempts) {
    let q = supabaseFiApp.from(table).select('*').eq(col, userId)
    const dateCol = 'date_key'
    if (filter === 'today') q = q.gte(dateCol, today)
    else if (filter === 'weekly') q = q.gte(dateCol, weekAgo)
    else if (filter === 'monthly') q = q.gte(dateCol, monthAgo)
    let { data, error } = await q.order(dateCol, { ascending: false })
    if (error) {
      const alt = await supabaseFiApp.from(table).select('*').eq(col, userId)
      if (!alt.error) {
        data = alt.data || []
        error = null
      }
    }
    if (!error) return { data: data || [], error: null }
    if (!isTableNotFound(error)) return { data: [], error: error?.message }
  }
  return { data: [], error: null }
}

/**
 * Fetch reports - tries reports, user_reports, health_reports with user_id or profile_id
 */
export async function fetchReports(userId) {
  const attempts = [
    ['reports', 'user_id'],
    ['reports', 'profile_id'],
    ['user_reports', 'user_id'],
    ['user_reports', 'profile_id'],
    ['health_reports', 'user_id'],
  ]
  for (const [table, col] of attempts) {
    const { data, error } = await supabaseFiApp
      .from(table)
      .select('*')
      .eq(col, userId)
      .order('created_at', { ascending: false })
    if (!error) return { data: data || [], error: null }
    if (!isTableNotFound(error)) return { data: [], error: error?.message }
  }
  return { data: [], error: null }
}
