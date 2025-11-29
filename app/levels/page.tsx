'use client'

import { useEffect, useState } from 'react'
import { supabase, QuizLevel } from '@/lib/supabase'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function LevelsPage() {
  const [levels, setLevels] = useState<(QuizLevel & { quiz_groups?: { title: string } })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data } = await supabase
      .from('quiz_levels')
      .select('*, quiz_groups(title)')
      .order('group_id')
      .order('order')
    
    setLevels(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium text-white italic">Уровни</h1>
        <p className="text-gray-400 mt-1">Уровни сложности по темам</p>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Тема</th>
              <th>Уровень</th>
              <th>Порядок</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((l) => (
              <tr key={l.id}>
                <td className="text-gray-400">{l.id}</td>
                <td className="text-teal-400">{l.quiz_groups?.title || '—'}</td>
                <td className="text-white font-medium">{l.title}</td>
                <td className="text-gray-400">{l.order}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
