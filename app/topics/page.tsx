'use client'

import { useEffect, useState } from 'react'
import { getSupabase, QuizGroup } from '@/lib/supabase'
import { Pencil, Trash2 } from 'lucide-react'

export default function TopicsPage() {
  const [groups, setGroups] = useState<QuizGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('quiz_groups')
      .select('*')
      .order('order')
    
    setGroups(data || [])
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
        <h1 className="font-serif text-3xl font-medium text-white italic">Темы</h1>
        <p className="text-gray-400 mt-1">Управление темами викторины</p>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Порядок</th>
              <th>Название</th>
              <th>Арабское</th>
              <th>Иконка</th>
              <th className="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id}>
                <td className="text-gray-400">{g.order}</td>
                <td className="text-white font-medium">{g.title}</td>
                <td className="text-gray-400">{g.title_ar || '—'}</td>
                <td className="text-2xl">{g.icon || '📚'}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 rounded-lg bg-dark-600/50 hover:bg-dark-500 text-gray-400 hover:text-white">
                      <Pencil size={16} />
                    </button>
                    <button className="p-2 rounded-lg bg-dark-600/50 hover:bg-red-900/30 text-gray-400 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
