'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'

interface TopicCount {
  id: number
  title: string
  count: number
}

interface SourceCount {
  id: number
  title: string
  count: number
}

interface DifficultyCount {
  difficulty: string
  count: number
}

export default function Dashboard() {
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [totalGroups, setTotalGroups] = useState(0)
  const [totalSources, setTotalSources] = useState(0)
  const [topicCounts, setTopicCounts] = useState<TopicCount[]>([])
  const [sourceCounts, setSourceCounts] = useState<SourceCount[]>([])
  const [difficultyCounts, setDifficultyCounts] = useState<DifficultyCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const supabase = getSupabase()
      const [questionsRes, groupsRes, sourcesRes] = await Promise.all([
        supabase.from('questions').select('group_id, source_id, difficulty'),
        supabase.from('quiz_groups').select('*').order('order'),
        supabase.from('sources').select('*').order('title'),
      ])

      const questions = questionsRes.data || []
      setTotalQuestions(questions.length)
      setTotalGroups(groupsRes.data?.length || 0)
      setTotalSources(sourcesRes.data?.length || 0)

      // Count questions per topic
      const topicMap: { [key: number]: number } = {}
      questions.forEach((q: any) => {
        topicMap[q.group_id] = (topicMap[q.group_id] || 0) + 1
      })

      const topicsWithCounts = (groupsRes.data || []).map((g: any) => ({
        id: g.id,
        title: g.title,
        count: topicMap[g.id] || 0,
      }))
      setTopicCounts(topicsWithCounts)

      // Count questions per source
      const sourceMap: { [key: number]: number } = {}
      questions.forEach((q: any) => {
        if (q.source_id) {
          sourceMap[q.source_id] = (sourceMap[q.source_id] || 0) + 1
        }
      })

      const sourcesWithCounts = (sourcesRes.data || [])
        .map((s: any) => ({
          id: s.id,
          title: s.title,
          count: sourceMap[s.id] || 0,
        }))
        .filter((s: SourceCount) => s.count > 0)
        .sort((a: SourceCount, b: SourceCount) => b.count - a.count)
      
      setSourceCounts(sourcesWithCounts)

      // Count by difficulty
      const diffMap: { [key: string]: number } = { easy: 0, medium: 0, hard: 0 }
      questions.forEach((q: any) => {
        if (q.difficulty && diffMap[q.difficulty] !== undefined) {
          diffMap[q.difficulty]++
        }
      })
      
      setDifficultyCounts([
        { difficulty: 'easy', count: diffMap.easy },
        { difficulty: 'medium', count: diffMap.medium },
        { difficulty: 'hard', count: diffMap.hard },
      ])

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const difficultyLabels: { [key: string]: { label: string; className: string } } = {
    'easy': { label: 'Лёгкие', className: 'difficulty-easy' },
    'medium': { label: 'Средние', className: 'difficulty-medium' },
    'hard': { label: 'Сложные', className: 'difficulty-hard' }
  }

  if (loading) {
    return <div className="loading">Загрузка...</div>
  }

  return (
    <>
      <div className="section-header">
        <h1>Панель управления</h1>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Link href="/questions" className="stat-card clickable">
          <div className="stat-value">{totalQuestions}</div>
          <div className="stat-label">Вопросов</div>
        </Link>
        <a href="#topics-section" className="stat-card clickable">
          <div className="stat-value">{totalGroups}</div>
          <div className="stat-label">Тем</div>
        </a>
        <a href="#sources-section" className="stat-card clickable">
          <div className="stat-value">{totalSources}</div>
          <div className="stat-label">Источников</div>
        </a>
      </div>

      {/* Difficulty Distribution */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2>По сложности</h2>
        </div>
        <div className="card-body">
          <div className="topics-grid">
            {difficultyCounts.map((d) => (
              <Link
                key={d.difficulty}
                href={`/questions?difficulty=${d.difficulty}`}
                className="topic-card"
              >
                <span className="topic-name">
                  <span className={`difficulty-dot ${difficultyLabels[d.difficulty].className}`}></span>
                  {difficultyLabels[d.difficulty].label}
                </span>
                <span className="topic-count">{d.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Topics */}
      <div id="topics-section" className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2>По темам</h2>
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

      {/* Sources */}
      <div id="sources-section" className="card" style={{ marginBottom: '60px' }}>
        <div className="card-header">
          <h2>По источникам</h2>
        </div>
        <div className="card-body">
          {sourceCounts.length === 0 ? (
            <div className="empty-state">Нет источников</div>
          ) : (
            <div className="topics-grid">
              {sourceCounts.map((source) => (
                <Link 
                  key={source.id} 
                  href={`/questions?source=${source.id}`}
                  className="topic-card clickable"
                >
                  <span className="topic-name">{source.title}</span>
                  <span className="topic-count">{source.count}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
