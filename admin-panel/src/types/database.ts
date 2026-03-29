export interface Profile {
  id: string
  email: string
  name: string
  phone?: string
  age?: number
  gender?: string
  height?: number
  weight?: number
  conditions?: string[]
  status: 'active' | 'disabled'
  role: 'user' | 'admin' | 'super_admin'
  created_at: string
  updated_at: string
}

export interface FoodLog {
  id: string
  user_id: string
  timestamp: string
  description: string
  calories: number
  items?: string[]
  created_at: string
}

export interface FoodLogImage {
  id: string
  food_log_id: string
  image_path: string
  created_at: string
}

export interface DrinkLog {
  id: string
  user_id: string
  timestamp: string
  type: string
  amount: number
  created_at: string
}

export interface UserReport {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  name: string
  description: string
  created_at: string
}

export interface UserCourse {
  id: string
  user_id: string
  course_id: string
  purchase_date: string
  status: 'active' | 'expired'
  expiry_date?: string
  progress?: number
  created_at: string
}
