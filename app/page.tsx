'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'

interface TopicCount {
  id: number
  title: string
  count: number
}

export default function Dashboard() {
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [totalGroups, setTotalGroups] = useState(0)
  const [totalSources, setTotalSources] = useState(0)
  const [topicCounts, setTopicCounts] = useState<TopicCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const supabase = getSupabase()
      const [questionsRes, groupsRes, sourcesRes] = await Promise.all([
        supabase.from('questions').select('group_id', { count: 'exact' }),
        supabase.from('quiz_groups').select('*').order('order'),
        supabase.from('sources').select('*', { count: 'exact' }),
      ])

      setTotalQuestions(questionsRes.count || 0)
      setTotalGroups(groupsRes.data?.length || 0)
      setTotalSources(sourcesRes.count || 0)

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

  if (loading) {
    return <div className="loading">Загрузка...</div>
  }

  return (
    <>
      <div className="section-header">
        <h1>Панель управления</h1>
      </div>

      <div className="stats-grid">
        <Link href="/questions" className="stat-card">
          <div className="stat-value">{totalQuestions}</div>
          <div className="stat-label">Вопросов</div>
        </Link>
        <div className="stat-card">
          <div className="stat-value">{totalGroups}</div>
          <div className="stat-label">Тем</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalSources}</div>
          <div className="stat-label">Источников</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Распределение по темам</h2>
        </div>
        <div className="card-body">
          {topicCounts.length === 0 ? (
            <div className="empty-state">Нет тем</div>
          ) : (
            <div className="topics-grid">
              {topicCounts.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/questions?group=${topic.id}`}
                  className="topic-card"
                >
                  <span className="topic-name">{topic.title}</span>
                  <span className="topic-count">{topic.count}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
