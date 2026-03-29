/**
 * Risk scoring for Diabetes Risk Assessment (0–100).
 * Risk levels: 0–30=LOW, 31–55=LOW_MODERATE, 56–75=MODERATE, 76–90=MODERATE_HIGH, 91–100=HIGH
 */

const AGE_SCORES = {
  below25: 0,
  '26-30': 1,
  '30-35': 1,
  '35-40': 2,
  '40-45': 2,
  '45-50': 3,
  above50: 4,
}

const FAMILY_HISTORY_SCORES = {
  none: 0,
  'not-sure': 2,
  siblings: 4,
  'one-parent': 6,
  'both-parents': 8,
}

function bmiScore(bmi) {
  if (bmi < 23) return 0
  if (bmi <= 27.4) return 5
  if (bmi <= 32.4) return 10
  return 13
}

const HIP_MALE = { less90: 0, '90-100': 3, more100: 5 }
const HIP_FEMALE = { less80: 0, '80-90': 3, more90: 5 }

const ACTIVITY_SCORES = {
  vigorous: 0,
  moderate: 2,
  light: 4,
  sedentary: 6,
}

const MEDICAL_CONDITION_SCORES = {
  hypertension: 3,
  pcos: 3,
  'high-cholesterol': 2,
  'thyroid-disorder': 2,
  'fatty-liver': 2,
  'heart-disease': 3,
  'kidney-disease': 3,
}
const MEDICAL_CAP = 14

const SYMPTOM_SCORE = 3
const SYMPTOM_OPTIONS = [
  'frequent-urination', 'excessive-thirst', 'increased-hunger', 'fatigue',
  'blurred-vision', 'slow-wound-healing', 'tingling-numbness', 'dark-patches', 'none',
]
const SYMPTOM_CAP = 16

const JUNK_FOOD_SCORES = { rarely: 0, weekly1_2: 1, weekly3_4: 2, weekly5plus: 3 }
const OUTSIDE_FOOD_SCORES = { rarely: 0, weekly1_2: 1, weekly3_4: 2, weekly5plus: 3 }
const CARB_SCORES = { complex: 0, mixed: 2, refined: 4 }
const SUGARY_BEVERAGES = { no: 0, yes: 3 }
const HABIT_SCORES = { smoking: 2, alcohol: 2, 'tobacco-chewing': 2, none: 0 }
const HABIT_CAP = 5
const SLEEP_SCORES = { '7-8': 0, more8: 0, '6-7': 2, less6: 4 }
const SNORING_SCORES = { no: 0, 'not-sure': 1, yes: 3 }
const WEIGHT_GAIN_SCORES = { no: 0, yes: 3 }
const STRESS_SCORES = { low: 0, moderate: 2, high: 4 }
const GESTATIONAL_SCORES = { not_applicable: 0, no: 0, yes: 3 }

export const RISK_LEVELS = {
  LOW: { min: 0, max: 30, label: 'LOW' },
  LOW_MODERATE: { min: 31, max: 55, label: 'LOW_MODERATE' },
  MODERATE: { min: 56, max: 75, label: 'MODERATE' },
  MODERATE_HIGH: { min: 76, max: 90, label: 'MODERATE_HIGH' },
  HIGH: { min: 91, max: 100, label: 'HIGH' },
}

function parseList(value) {
  if (!value || typeof value !== 'string') return []
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

/**
 * Returns { score, level, breakdown } for a user profile.
 * breakdown: array of { factor, points } for contributing factors (sorted by points desc).
 */
export function calculateRiskScore(profile) {
  const breakdown = []
  let total = 0

  // Age
  const ageVal = profile.age_range || ''
  const agePts = AGE_SCORES[ageVal] ?? 0
  if (agePts > 0) breakdown.push({ factor: 'Age', points: agePts })
  total += agePts

  // Family history
  const fhVal = profile.family_history || ''
  const fhPts = FAMILY_HISTORY_SCORES[fhVal] ?? 0
  if (fhPts > 0) breakdown.push({ factor: 'Family history of diabetes', points: fhPts })
  total += fhPts

  // BMI
  const weight = Number(profile.weight_kg)
  const height = Number(profile.height_cm)
  const bmi = height > 0 ? weight / ((height / 100) ** 2) : 0
  const bmiPts = bmiScore(bmi)
  if (bmiPts > 0) breakdown.push({ factor: 'BMI', points: bmiPts })
  total += bmiPts

  // Hip size
  const hipVal = profile.hip_size || ''
  const isFemale = (profile.gender || '').toLowerCase() === 'female'
  const hipMap = isFemale ? HIP_FEMALE : HIP_MALE
  const hipPts = hipMap[hipVal] ?? 0
  if (hipPts > 0) breakdown.push({ factor: 'Hip size', points: hipPts })
  total += hipPts

  // Activity
  const actVal = profile.physical_activity_level || ''
  const actPts = ACTIVITY_SCORES[actVal] ?? 0
  if (actPts > 0) breakdown.push({ factor: 'Physical activity', points: actPts })
  total += actPts

  // Medical conditions (cap 14)
  const conditions = parseList(profile.medical_conditions).filter((c) => c !== 'none')
  let medPts = 0
  for (const c of conditions) {
    medPts += MEDICAL_CONDITION_SCORES[c] ?? 0
  }
  medPts = Math.min(medPts, MEDICAL_CAP)
  if (medPts > 0) breakdown.push({ factor: 'Medical conditions', points: medPts })
  total += medPts

  // Symptoms (cap 16)
  const symptoms = parseList(profile.symptoms).filter((s) => s !== 'none')
  let symPts = Math.min(symptoms.length * SYMPTOM_SCORE, SYMPTOM_CAP)
  if (symPts > 0) breakdown.push({ factor: 'Symptoms', points: symPts })
  total += symPts

  // Junk food
  const junkVal = profile.junk_food_frequency || ''
  const junkPts = JUNK_FOOD_SCORES[junkVal] ?? 0
  if (junkPts > 0) breakdown.push({ factor: 'Junk food frequency', points: junkPts })
  total += junkPts

  // Outside food
  const outVal = profile.outside_food_frequency || ''
  const outPts = OUTSIDE_FOOD_SCORES[outVal] ?? 0
  if (outPts > 0) breakdown.push({ factor: 'Outside food frequency', points: outPts })
  total += outPts

  // Carbs
  const carbVal = profile.carbohydrate_type || ''
  const carbPts = CARB_SCORES[carbVal] ?? 0
  if (carbPts > 0) breakdown.push({ factor: 'Carbohydrate type', points: carbPts })
  total += carbPts

  // Sugary beverages
  const sugVal = (profile.sugary_beverages || 'no').toLowerCase()
  const sugPts = SUGARY_BEVERAGES[sugVal] ?? 0
  if (sugPts > 0) breakdown.push({ factor: 'Sugary beverages', points: sugPts })
  total += sugPts

  // Habits (cap 5)
  const habits = parseList(profile.habits).filter((h) => h !== 'none')
  let habPts = 0
  for (const h of habits) {
    habPts += HABIT_SCORES[h] ?? 0
  }
  habPts = Math.min(habPts, HABIT_CAP)
  if (habPts > 0) breakdown.push({ factor: 'Habits (smoking/alcohol/tobacco)', points: habPts })
  total += habPts

  // Sleep
  const sleepVal = profile.sleep_duration || ''
  const sleepPts = SLEEP_SCORES[sleepVal] ?? 0
  if (sleepPts > 0) breakdown.push({ factor: 'Sleep duration', points: sleepPts })
  total += sleepPts

  // Snoring
  const snorVal = profile.snoring || ''
  const snorPts = SNORING_SCORES[snorVal] ?? 0
  if (snorPts > 0) breakdown.push({ factor: 'Snoring', points: snorPts })
  total += snorPts

  // Weight gain
  const wgVal = (profile.weight_gain || 'no').toLowerCase()
  const wgPts = WEIGHT_GAIN_SCORES[wgVal] ?? 0
  if (wgPts > 0) breakdown.push({ factor: 'Weight gain (last year)', points: wgPts })
  total += wgPts

  // Stress
  const stressVal = profile.stress_level || ''
  const stressPts = STRESS_SCORES[stressVal] ?? 0
  if (stressPts > 0) breakdown.push({ factor: 'Stress level', points: stressPts })
  total += stressPts

  // Gestational diabetes
  const gestVal = profile.gestational_diabetes || 'not_applicable'
  const gestPts = GESTATIONAL_SCORES[gestVal] ?? 0
  if (gestPts > 0) breakdown.push({ factor: 'Gestational diabetes', points: gestPts })
  total += gestPts

  total = Math.min(100, Math.max(0, total))

  let level = 'LOW'
  if (total >= 91) level = 'HIGH'
  else if (total >= 76) level = 'MODERATE_HIGH'
  else if (total >= 56) level = 'MODERATE'
  else if (total >= 31) level = 'LOW_MODERATE'

  breakdown.sort((a, b) => b.points - a.points)

  return {
    score: total,
    level,
    breakdown,
    bmi: height > 0 ? Math.round(bmi * 10) / 10 : null,
  }
}
