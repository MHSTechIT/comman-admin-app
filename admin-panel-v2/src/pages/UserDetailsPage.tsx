import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function UserDetailsPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['user-details', id],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (profileError) throw profileError

      // Adapter: calories, drinks, courses counts (replace with real queries)
      const todayCalories = 0
      const weeklyCalories = 0
      const monthlyCalories = 0
      const todayDrinks = 0
      const coursesCount = 0

      return {
        profile,
        stats: {
          todayCalories,
          weeklyCalories,
          monthlyCalories,
          todayDrinks,
          coursesCount,
        },
      }
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="page">
        <div className="card">
          <div className="table-placeholder">Loading user…</div>
        </div>
      </div>
    )
  }

  if (isError || !data?.profile) {
    return (
      <div className="page">
        <div className="card">
          <div className="table-error">
            {(error as Error)?.message ?? 'Failed to load user'}
          </div>
        </div>
      </div>
    )
  }

  const { profile, stats } = data

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <div>
            <h1>{profile.name || profile.email || 'User'}</h1>
            <p className="muted">{profile.email}</p>
          </div>
        </div>
        <div className="grid-two">
          <div>
            <h2>Profile</h2>
            <dl className="details-list">
              <Detail label="Name" value={profile.name} />
              <Detail label="Email" value={profile.email} />
              <Detail label="Phone" value={profile.phone} />
              <Detail label="Age" value={profile.age} />
              <Detail label="Gender" value={profile.gender} />
              <Detail label="Height" value={profile.height} />
              <Detail label="Weight" value={profile.weight} />
              <Detail label="Conditions" value={profile.conditions} />
              <Detail label="Status" value={profile.status} />
              <Detail label="Role" value={profile.role} />
            </dl>
          </div>
          <div>
            <h2>Quick stats</h2>
            <div className="summary-grid">
              <SummaryCard label="Today calories" value={stats.todayCalories} />
              <SummaryCard label="Weekly calories" value={stats.weeklyCalories} />
              <SummaryCard label="Monthly calories" value={stats.monthlyCalories} />
              <SummaryCard label="Today drinks" value={stats.todayDrinks} />
              <SummaryCard label="Courses purchased" value={stats.coursesCount} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{value ?? '—'}</dd>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="summary-card">
      <div className="summary-label">{label}</div>
      <div className="summary-value">{value}</div>
    </div>
  )
}

