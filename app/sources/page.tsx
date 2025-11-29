'use client'

import { useEffect, useState } from 'react'
import { supabase, Source } from '@/lib/supabase'
import { Plus, Pencil, Trash2 } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data } = await supabase
      .from('sources')
      .select('*')
      .order('title')
    
    setSources(data || [])
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl font-medium text-white italic">Источники</h1>
          <p className="text-gray-400 mt-1">Источники информации для вопросов</p>
        </div>
        <button className="btn-gold flex items-center gap-2">
          <Plus size={20} />
          Добавить
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Автор</th>
              <th>Описание</th>
              <th className="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id}>
                <td className="text-gray-400">{s.id}</td>
                <td className="text-white font-medium">{s.title}</td>
                <td className="text-teal-400">{s.author || '—'}</td>
                <td className="text-gray-400 max-w-xs truncate">{s.description || '—'}</td>
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
