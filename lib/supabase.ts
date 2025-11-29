import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Question {
  id: number
  text: string
  explanation: string
  difficulty: string
  group_id: number
  level_id: number
  source_id: number | null
  author: string | null
  notes: string | null
  created_at: string
  quiz_groups?: { title: string }
  quiz_levels?: { title: string }
  sources?: { title: string }
}

export interface QuizGroup {
  id: number
  title: string
  title_ar: string
  description: string
  icon: string
  order: number
}

export interface QuizLevel {
  id: number
  group_id: number
  title: string
  order: number
  questions_count: number
}

export interface Source {
  id: number
  title: string
  author: string
  description: string
}

export interface Answer {
  id: number
  question_id: number
  text: string
  is_correct: boolean
}

