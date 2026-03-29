/**
 * Human-readable labels for assessment options (raw DB values → display text).
 */

export const AGE_RANGE_LABELS = {
  below25: 'Below 25',
  '26-30': '26–30',
  '30-35': '30–35',
  '35-40': '35–40',
  '40-45': '40–45',
  '45-50': '45–50',
  above50: 'Above 50',
}

export const FAMILY_HISTORY_LABELS = {
  none: 'None',
  'not-sure': 'Not sure',
  siblings: 'Siblings',
  'one-parent': 'One parent with diabetes',
  'both-parents': 'Both parents with diabetes',
}

export const HIP_LABELS = {
  less90: 'Less than 90 cm',
  '90-100': '90–100 cm',
  more100: 'More than 100 cm',
  less80: 'Less than 80 cm',
  '80-90': '80–90 cm',
  more90: 'More than 90 cm',
}

export const ACTIVITY_LABELS = {
  vigorous: 'Vigorous (intense exercise regularly)',
  moderate: 'Moderate (exercise a few times a week)',
  light: 'Light (occasional walking)',
  sedentary: 'Mostly sitting (desk job / minimal movement)',
}

export const FREQUENCY_LABELS = {
  rarely: 'Rarely',
  weekly1_2: '1–2 times per week',
  weekly3_4: '3–4 times per week',
  weekly5plus: '5+ times per week',
}

export const CARB_LABELS = {
  complex: 'Mostly complex (whole grains, etc.)',
  mixed: 'Mixed',
  refined: 'Mostly refined (white bread, etc.)',
}

export const YES_NO_LABELS = { no: 'No', yes: 'Yes' }

export const SLEEP_LABELS = {
  '7-8': '7–8 hours',
  more8: 'More than 8 hours',
  '6-7': '6–7 hours',
  less6: 'Less than 6 hours',
}

export const SNORING_LABELS = { no: 'No', 'not-sure': 'Not sure', yes: 'Yes' }

export const STRESS_LABELS = { low: 'Low', moderate: 'Moderate', high: 'High' }

export const GESTATIONAL_LABELS = {
  not_applicable: 'Not applicable',
  no: 'No',
  yes: 'Yes',
}

export const MEDICAL_CONDITION_LABELS = {
  hypertension: 'Hypertension',
  'high-cholesterol': 'High cholesterol',
  pcos: 'PCOS',
  'thyroid-disorder': 'Thyroid disorder',
  'fatty-liver': 'Fatty liver',
  'heart-disease': 'Heart disease',
  'kidney-disease': 'Kidney disease',
  none: 'None',
}

export const SYMPTOM_LABELS = {
  'frequent-urination': 'Frequent urination',
  'excessive-thirst': 'Excessive thirst',
  'increased-hunger': 'Increased hunger',
  fatigue: 'Fatigue',
  'blurred-vision': 'Blurred vision',
  'slow-wound-healing': 'Slow wound healing',
  'tingling-numbness': 'Tingling/numbness',
  'dark-patches': 'Dark patches (skin)',
  none: 'None',
}

export const HABIT_LABELS = {
  smoking: 'Smoking',
  alcohol: 'Alcohol',
  'tobacco-chewing': 'Tobacco chewing',
  none: 'None',
}

export const TIME_SLOT_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
}

export const ADMIN_STATUS_LABELS = {
  fresh: 'Fresh',
  pending: 'Pending',
  completed: 'Completed',
}

export function getLabel(map, value) {
  if (value == null || value === '') return '—'
  return map[value] ?? value
}

export function getListLabels(map, commaSeparated) {
  if (!commaSeparated || typeof commaSeparated !== 'string') return []
  return commaSeparated
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s !== 'none')
    .map((s) => map[s] ?? s)
}
