import {
  AGE_RANGE_LABELS,
  FAMILY_HISTORY_LABELS,
  HIP_LABELS,
  ACTIVITY_LABELS,
  FREQUENCY_LABELS,
  CARB_LABELS,
  YES_NO_LABELS,
  SLEEP_LABELS,
  SNORING_LABELS,
  STRESS_LABELS,
  GESTATIONAL_LABELS,
  MEDICAL_CONDITION_LABELS,
  SYMPTOM_LABELS,
  HABIT_LABELS,
  getLabel,
  getListLabels,
} from '../utils/labels'
import { calculateRiskScore } from '../utils/riskScoring'
import RiskBadge from './RiskBadge'

export default function UserDetailModal({ profile, onClose }) {
  if (!profile) return null
  const { score, level, breakdown, bmi } = calculateRiskScore(profile)
  const gender = (profile.gender || '').toLowerCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-dark-card border border-dark-border rounded-xl shadow-xl max-w-2xl w-full my-8 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-dark-border flex items-center justify-between sticky top-0 bg-dark-card z-10">
          <h3 className="text-lg font-semibold text-white">Assessment Details</h3>
          <button type="button" onClick={onClose} className="text-dark-muted hover:text-white p-1 rounded">✕</button>
        </div>
        <div className="p-5 space-y-6 text-sm">
          <Section title="Personal Info">
            <Item label="Name" value={profile.name} />
            <Item label="Phone" value={profile.phone} />
            <Item label="Gender" value={profile.gender} />
            <Item label="Age range" value={getLabel(AGE_RANGE_LABELS, profile.age_range)} />
          </Section>

          <Section title="Body Measurements">
            <Item label="Weight (kg)" value={profile.weight_kg} />
            <Item label="Height (cm)" value={profile.height_cm} />
            <Item label="BMI" value={bmi != null ? bmi : '—'} />
            <Item label="Hip size" value={getLabel(HIP_LABELS, profile.hip_size)} />
          </Section>

          <Section title="Medical History">
            <Item label="Family history of diabetes" value={getLabel(FAMILY_HISTORY_LABELS, profile.family_history)} />
            <Item
              label="Medical conditions"
              value={getListLabels(MEDICAL_CONDITION_LABELS, profile.medical_conditions).join(', ') || 'None'}
            />
            {gender === 'female' && (
              <Item label="Gestational diabetes" value={getLabel(GESTATIONAL_LABELS, profile.gestational_diabetes)} />
            )}
          </Section>

          <Section title="Symptoms">
            <Item
              label="Selected symptoms"
              value={getListLabels(SYMPTOM_LABELS, profile.symptoms).join(', ') || 'None'}
            />
          </Section>

          <Section title="Diet & Lifestyle">
            <Item label="Junk food frequency" value={getLabel(FREQUENCY_LABELS, profile.junk_food_frequency)} />
            <Item label="Outside food frequency" value={getLabel(FREQUENCY_LABELS, profile.outside_food_frequency)} />
            <Item label="Carbohydrate type" value={getLabel(CARB_LABELS, profile.carbohydrate_type)} />
            <Item label="Sugary beverages" value={getLabel(YES_NO_LABELS, profile.sugary_beverages)} />
            <Item label="Physical activity level" value={getLabel(ACTIVITY_LABELS, profile.physical_activity_level)} />
          </Section>

          <Section title="Sleep & Habits">
            <Item label="Sleep duration" value={getLabel(SLEEP_LABELS, profile.sleep_duration)} />
            <Item label="Snoring" value={getLabel(SNORING_LABELS, profile.snoring)} />
            <Item label="Weight gain (last year)" value={getLabel(YES_NO_LABELS, profile.weight_gain)} />
            <Item label="Stress level" value={getLabel(STRESS_LABELS, profile.stress_level)} />
            <Item
              label="Habits"
              value={getListLabels(HABIT_LABELS, profile.habits).join(', ') || 'None'}
            />
          </Section>

          <Section title="Result">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-dark-muted">Total score:</span>
              <span className="text-white font-medium">{score}/100</span>
              <RiskBadge level={level} />
            </div>
            {breakdown.length > 0 && (
              <div className="mt-3">
                <span className="text-dark-muted block text-xs mb-2">Contributing factors (by points)</span>
                <ul className="space-y-1">
                  {breakdown.map(({ factor, points }) => (
                    <li key={factor} className="flex justify-between text-gray-300">
                      <span>{factor}</span>
                      <span className="text-accent-purpleLight">+{points}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-accent-purpleLight font-medium mb-2">{title}</h4>
      <div className="space-y-1.5 pl-0">{children}</div>
    </div>
  )
}

function Item({ label, value }) {
  return (
    <div>
      <span className="text-dark-muted text-xs">{label}: </span>
      <span className="text-gray-200">{value ?? '—'}</span>
    </div>
  )
}
