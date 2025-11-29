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
  author: string | null
  notes: string | null
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

interface Level {
  id: number
  title: string
  group_id: number
}

const ITEMS_PER_PAGE = 20

function QuestionsContent() {
  const searchParams = useSearchParams()
  const initialGroup = searchParams.get('group') || ''
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [selectedGroup, setSelectedGroup] = useState(initialGroup)
  const [selectedLevel, setSelectedLevel] = useState('')
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
  }, [questions, selectedGroup, selectedLevel, searchTerm])

  async function loadData() {
    try {
      const supabase = getSupabase()
      const [questionsRes, groupsRes, levelsRes] = await Promise.all([
        supabase
          .from('questions')
          .select('*, quiz_groups(title), quiz_levels(title), sources(title)')
          .order('id', { ascending: false }),
        supabase.from('quiz_groups').select('*').order('order'),
        supabase.from('quiz_levels').select('*').order('group_id').order('order'),
      ])

      setQuestions(questionsRes.data || [])
      setGroups(groupsRes.data || [])
      setLevels(levelsRes.data || [])
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

    if (selectedLevel) {
      filtered = filtered.filter((q) => q.quiz_levels?.title === selectedLevel)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((q) => q.text.toLowerCase().includes(term))
    }

    setFilteredQuestions(filtered)
    setCurrentPage(1)
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

  async function deleteQuestion(id: number) {
    if (!confirm('Удалить этот вопрос?')) return

    const supabase = getSupabase()
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (!error) {
      setQuestions((prev) => prev.filter((q) => q.id !== id))
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

      const headers = ['№', 'Вопрос', 'A', 'B', 'C', 'D', 'Правильный', 'Объяснение', 'Тема', 'Уровень', 'Источник', 'Автор']
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
          q.author || '',
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

  // Unique level titles for filter
  const uniqueLevels = [...new Set(levels.map((l) => l.title))]

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
            <option key={g.id} value={g.id}>{g.title}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          <option value="">Все уровни</option>
          {uniqueLevels.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
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
            const num = filteredQuestions.length - startIdx - idx
            const isExpanded = expandedId === q.id
            const qAnswers = answers[q.id] || []
            const letters = ['A', 'B', 'C', 'D']

            return (
              <div
                key={q.id}
                className={`question-card ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleExpand(q.id)}
              >
                <div className="question-header">
                  <span className="question-number">#{num}</span>
                  <div className="question-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-icon"
                      onClick={() => {
                        setEditingQuestion(q)
                        setModalOpen(true)
                      }}
                      title="Редактировать"
                    >
                      ✎
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => deleteQuestion(q.id)}
                      title="Удалить"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="question-text">{q.text}</div>

                <div className="question-meta">
                  <span>📚 {q.quiz_groups?.title || '—'}</span>
                  <span>📊 {q.quiz_levels?.title || '—'}</span>
                  <span>📖 {q.sources?.title || '—'}</span>
                  {q.author && <span>👤 {q.author}</span>}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="question-details">
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
