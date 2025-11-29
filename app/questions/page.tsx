'use client'

import { useEffect, useState } from 'react'
import { supabase, Question, QuizGroup, Answer } from '@/lib/supabase'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react'
import QuestionModal from '@/components/QuestionModal'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [groups, setGroups] = useState<QuizGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [answers, setAnswers] = useState<{ [key: number]: Answer[] }>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterQuestions()
  }, [questions, searchTerm, selectedGroup])

  async function loadData() {
    try {
      const [questionsRes, groupsRes] = await Promise.all([
        supabase
          .from('questions')
          .select('*, quiz_groups(title), quiz_levels(title), sources(title)')
          .order('id', { ascending: false }),
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

    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (!error) {
      setQuestions((prev) => prev.filter((q) => q.id !== id))
    }
  }

  function openEditModal(question: Question) {
    setEditingQuestion(question)
    setModalOpen(true)
  }

  function openAddModal() {
    setEditingQuestion(null)
    setModalOpen(true)
  }

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const pageQuestions = filteredQuestions.slice(startIdx, startIdx + itemsPerPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl font-medium text-white italic">Вопросы</h1>
          <p className="text-gray-400 mt-1">Всего: {questions.length}</p>
        </div>
        <button onClick={openAddModal} className="btn-gold flex items-center gap-2">
          <Plus size={20} />
          Добавить
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-4">
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="form-input w-48"
        >
          <option value="">Все темы</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.title}</option>
          ))}
        </select>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Поиск по тексту вопроса..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {pageQuestions.map((q, idx) => {
          const num = filteredQuestions.length - startIdx - idx
          const isExpanded = expandedId === q.id
          const qAnswers = answers[q.id] || []
          const letters = ['A', 'B', 'C', 'D']

          return (
            <div key={q.id} className="glass-card overflow-hidden">
              <div
                className="p-5 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleExpand(q.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-serif text-lg font-semibold text-gold-500">
                    #{num}
                  </span>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(q)}
                      className="p-2 rounded-lg bg-dark-600/50 hover:bg-dark-500 text-gray-400 hover:text-white transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="p-2 rounded-lg bg-dark-600/50 hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-white mb-3">{q.text}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <span>📚 {q.quiz_groups?.title || '—'}</span>
                  <span>📊 {q.quiz_levels?.title || '—'}</span>
                  <span>📖 {q.sources?.title || '—'}</span>
                  {q.author && <span>👤 {q.author}</span>}
                </div>

                <div className="flex justify-center mt-3">
                  {isExpanded ? (
                    <ChevronUp className="text-gray-500" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-500" size={20} />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-white/10 space-y-4">
                  <div className="space-y-2">
                    {qAnswers.map((a, i) => (
                      <div
                        key={a.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          a.is_correct
                            ? 'bg-teal-900/30 border border-teal-500/30'
                            : 'bg-dark-600/30 border border-white/5'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                            a.is_correct ? 'bg-teal-500 text-white' : 'bg-gray-600 text-gray-300'
                          }`}
                        >
                          {letters[i]}
                        </span>
                        <span className={a.is_correct ? 'text-teal-300' : 'text-gray-300'}>
                          {a.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="bg-gold-500/10 border border-gold-500/20 rounded-lg p-4">
                      <strong className="text-gold-400">Объяснение:</strong>
                      <p className="text-gray-300 mt-1">{q.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="glass-card p-4 flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-glass disabled:opacity-50"
          >
            ← Назад
          </button>
          <span className="text-gray-400">
            Страница {currentPage} из {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-glass disabled:opacity-50"
          >
            Вперёд →
          </button>
        </div>
      )}

      {/* Modal */}
      <QuestionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        question={editingQuestion}
        onSave={loadData}
      />
    </div>
  )
}
