'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { HelpCircle, BookOpen, Layers, Library } from 'lucide-react'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface Stats {
  questions: number
  topics: number
  levels: number
  sources: number
}

interface TopicCount {
  id: number
  title: string
  count: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ questions: 0, topics: 0, levels: 0, sources: 0 })
  const [topicCounts, setTopicCounts] = useState<TopicCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [questionsRes, groupsRes, levelsRes, sourcesRes] = await Promise.all([
        supabase.from('questions').select('group_id', { count: 'exact' }),
        supabase.from('quiz_groups').select('*').order('order'),
        supabase.from('quiz_levels').select('*', { count: 'exact' }),
        supabase.from('sources').select('*', { count: 'exact' }),
      ])

      setStats({
        questions: questionsRes.count || 0,
        topics: groupsRes.data?.length || 0,
        levels: levelsRes.count || 0,
        sources: sourcesRes.count || 0,
      })

      // Count questions per topic
      const counts: { [key: number]: number } = {}
      questionsRes.data?.forEach((q: any) => {
        counts[q.group_id] = (counts[q.group_id] || 0) + 1
      })

      const topicsWithCounts = (groupsRes.data || []).map((g: any) => ({
        id: g.id,
        title: g.title,
        count: counts[g.id] || 0,
      }))

      setTopicCounts(topicsWithCounts)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Вопросов', value: stats.questions, icon: HelpCircle, href: '/questions' },
    { label: 'Тем', value: stats.topics, icon: BookOpen, href: '/topics' },
    { label: 'Уровней', value: stats.levels, icon: Layers, href: '/levels' },
    { label: 'Источников', value: stats.sources, icon: Library, href: '/sources' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-medium text-white italic">
          Панель управления
        </h1>
        <p className="text-gray-400 mt-2">Обзор данных викторины</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href}>
              <div className="glass-card glass-card-hover p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="text-teal-400" size={24} />
                </div>
                <div className="font-serif text-4xl font-semibold text-gold-500 mb-1">
                  {card.value}
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">
                  {card.label}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Topics Distribution */}
      <div className="glass-card">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-serif text-xl text-white">Распределение по темам</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {topicCounts.map((topic) => (
              <Link key={topic.id} href={`/questions?topic=${topic.id}`}>
                <div className="bg-dark-600/40 border border-white/5 rounded-xl p-4 hover:bg-dark-500/50 hover:border-teal-500/20 transition-all cursor-pointer">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">{topic.title}</span>
                    <span className="font-serif text-xl font-semibold text-gold-500">
                      {topic.count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
