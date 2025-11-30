'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import QuestionModal from '@/components/QuestionModal'

interface Question {
  id: number
  text: string
  explanation: string
  group_id: number
  level_id: number
  source_id: number | null
  difficulty: string
  quiz_groups?: { title: string }
  quiz_levels?: { title: string }
  sources?: { title: string }
}

interface Answer {
  id: number
  question_id: number
  text: string
  is_correct: boolean
}

interface Group {
  id: number
  title: string
}

const ITEMS_PER_PAGE = 20

function QuestionsContent() {
  const searchParams = useSearchParams()
  const initialGroup = searchParams.get('group') || ''
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [selectedGroup, setSelectedGroup] = useState(initialGroup)
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Expansion & Answers
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [answers, setAnswers] = useState<{ [key: number]: Answer[] }>({})
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterQuestions()
  }, [questions, selectedGroup, selectedDifficulty, searchTerm])

  async function loadData() {
    try {
      const supabase = getSupabase()
      const [questionsRes, groupsRes] = await Promise.all([
        supabase
          .from('questions')
          .select('*, quiz_groups(title), quiz_levels(title), sources(title)')
          .order('id', { ascending: true }),
        supabase.from('quiz_groups').select('*').order('order'),
      ])

      setQuestions(questionsRes.data || [])
      setGroups(groupsRes.data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterQuestions() {
    let filtered = [...questions]

    if (selectedGroup) {
      filtered = filtered.filter((q) => q.group_id === parseInt(selectedGroup))
    }

    if (selectedDifficulty) {
      filtered = filtered.filter((q) => q.difficulty === selectedDifficulty)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((q) => q.text.toLowerCase().includes(term))
    }

    setFilteredQuestions(filtered)
    setCurrentPage(1)
  }
  
  // Helper for difficulty display
  const difficultyLabels: { [key: string]: string } = {
    'easy': 'Лёгкий',
    'medium': 'Средний', 
    'hard': 'Сложный'
  }
  
  const difficultyColors: { [key: string]: string } = {
    'easy': '#4ade80',
    'medium': '#fbbf24',
    'hard': '#f87171'
  }

  async function toggleExpand(id: number) {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }

    setExpandedId(id)

    if (!answers[id]) {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('answers')
        .select('*')
        .eq('question_id', id)
        .order('id')

      if (data) {
        setAnswers((prev) => ({ ...prev, [id]: data }))
      }
    }
  }

  async function exportToCSV() {
    try {
      const supabase = getSupabase()
      const { data: allAnswers } = await supabase.from('answers').select('*')
      
      const answersByQuestion: { [key: number]: Answer[] } = {}
      ;(allAnswers || []).forEach((a) => {
        if (!answersByQuestion[a.question_id]) answersByQuestion[a.question_id] = []
        answersByQuestion[a.question_id].push(a)
      })

      const headers = ['№', 'Вопрос', 'A', 'B', 'C', 'D', 'Правильный', 'Объяснение', 'Тема', 'Уровень', 'Источник']
      const rows = filteredQuestions.map((q, i) => {
        const qAnswers = answersByQuestion[q.id] || []
        const correct = qAnswers.find((a) => a.is_correct)
        const correctIdx = qAnswers.indexOf(correct!)
        const correctLetter = ['A', 'B', 'C', 'D'][correctIdx] || ''

        return [
          i + 1,
          q.text,
          qAnswers[0]?.text || '',
          qAnswers[1]?.text || '',
          qAnswers[2]?.text || '',
          qAnswers[3]?.text || '',
          correctLetter,
          q.explanation || '',
          q.quiz_groups?.title || '',
          q.quiz_levels?.title || '',
          q.sources?.title || '',
        ]
      })

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `siraquest_questions_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const pageQuestions = filteredQuestions.slice(startIdx, startIdx + ITEMS_PER_PAGE)

  if (loading) {
    return <div className="loading">Загрузка...</div>
  }

  return (
    <>
      <div className="section-header">
        <h1>Вопросы</h1>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={exportToCSV}>
            ⬇ Экспорт
          </button>
          <button
            className="btn btn-gold"
            onClick={() => {
              setEditingQuestion(null)
              setModalOpen(true)
            }}
          >
            + Добавить
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select
          className="filter-select"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="">Все темы</option>
          {groups.map((g) => (
            <option key={g.id} value={String(g.id)}>{g.title}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
        >
          <option value="">Все сложности</option>
          <option value="easy">Лёгкий</option>
          <option value="medium">Средний</option>
          <option value="hard">Сложный</option>
        </select>

        <input
          type="text"
          className="filter-input"
          placeholder="Поиск по тексту вопроса..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Questions List */}
      <div className="questions-list">
        {pageQuestions.length === 0 ? (
          <div className="empty-state">Вопросы не найдены</div>
        ) : (
          pageQuestions.map((q, idx) => {
            const num = startIdx + idx + 1
            const isExpanded = expandedId === q.id
            const qAnswers = answers[q.id] || []
            const letters = ['A', 'B', 'C', 'D']

            return (
              <div
                key={q.id}
                className={`question-card ${isExpanded ? 'expanded' : ''}`}
              >
                <div className="question-header" onClick={() => toggleExpand(q.id)}>
                  <span className="question-number">#{num}</span>
                  <div className="question-header-right">
                    <button
                      className="btn-icon btn-expand"
                      title={isExpanded ? 'Свернуть' : 'Развернуть'}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingQuestion(q)
                        setModalOpen(true)
                      }}
                      title="Редактировать"
                    >
                      ✎
                    </button>
                  </div>
                </div>

                <div className="question-text" onClick={() => toggleExpand(q.id)}>{q.text}</div>

                <div className="question-meta" onClick={() => toggleExpand(q.id)}>
                  <span>{q.quiz_groups?.title || '—'}</span>
                  <span style={{ color: difficultyColors[q.difficulty] || '#888' }}>
                    {difficultyLabels[q.difficulty] || q.difficulty}
                  </span>
                  {q.sources?.title && <span>{q.sources.title}</span>}
                </div>

                {/* Expanded Details - click to collapse */}
                {isExpanded && (
                  <div className="question-details" onClick={() => toggleExpand(q.id)}>
                    <div className="answers-list">
                      {qAnswers.map((a, i) => (
                        <div key={a.id} className={`answer-item ${a.is_correct ? 'correct' : ''}`}>
                          <span className="answer-letter-badge">{letters[i]}</span>
                          <span>{a.text}</span>
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="explanation-box">
                        <strong>Объяснение:</strong> {q.explanation}
                      </div>
                    )}
                    
                    <div className="collapse-hint">Нажмите, чтобы свернуть ▲</div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1))
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            disabled={currentPage === 1}
          >
            ← Назад
          </button>
          <span className="pagination-info">
            Страница {currentPage} из {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1))
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            disabled={currentPage === totalPages}
          >
            Вперёд →
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <QuestionModal
          question={editingQuestion}
          onClose={() => setModalOpen(false)}
          onSave={() => {
            loadData()
            setModalOpen(false)
          }}
          onDelete={(id) => {
            setQuestions((prev) => prev.filter((q) => q.id !== id))
            setModalOpen(false)
          }}
        />
      )}
    </>
  )
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="loading">Загрузка...</div>}>
      <QuestionsContent />
    </Suspense>
  )
}
