'use client'

import { useEffect, useState } from 'react'
import { getSupabase, Question, QuizGroup, QuizLevel, Source } from '@/lib/supabase'
import { X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  question: Question | null
  onSave: () => void
}

export default function QuestionModal({ isOpen, onClose, question, onSave }: Props) {
  const [groups, setGroups] = useState<QuizGroup[]>([])
  const [levels, setLevels] = useState<QuizLevel[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [saving, setSaving] = useState(false)

  // Form state
  const [groupId, setGroupId] = useState<number | ''>('')
  const [levelId, setLevelId] = useState<number | ''>('')
  const [text, setText] = useState('')
  const [answers, setAnswers] = useState(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState(0)
  const [explanation, setExplanation] = useState('')
  const [sourceId, setSourceId] = useState<number | ''>('')
  const [author, setAuthor] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadFormData()
  }, [])

  useEffect(() => {
    if (question) {
      setGroupId(question.group_id)
      setLevelId(question.level_id)
      setText(question.text)
      setExplanation(question.explanation || '')
      setSourceId(question.source_id || '')
      setAuthor(question.author || '')
      setNotes(question.notes || '')
      loadAnswers(question.id)
    } else {
      resetForm()
    }
  }, [question])

  async function loadFormData() {
    const supabase = getSupabase()
    const [groupsRes, levelsRes, sourcesRes] = await Promise.all([
      supabase.from('quiz_groups').select('*').order('order'),
      supabase.from('quiz_levels').select('*').order('group_id').order('order'),
      supabase.from('sources').select('*').order('title'),
    ])

    setGroups(groupsRes.data || [])
    setLevels(levelsRes.data || [])
    setSources(sourcesRes.data || [])
  }

  async function loadAnswers(questionId: number) {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', questionId)
      .order('id')

    if (data && data.length) {
      setAnswers(data.map((a) => a.text))
      const correctIdx = data.findIndex((a) => a.is_correct)
      setCorrectAnswer(correctIdx >= 0 ? correctIdx : 0)
    }
  }

  function resetForm() {
    setGroupId('')
    setLevelId('')
    setText('')
    setAnswers(['', '', '', ''])
    setCorrectAnswer(0)
    setExplanation('')
    setSourceId('')
    setAuthor('')
    setNotes('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!groupId || !levelId || !text || answers.some((a) => !a.trim()) || !explanation) {
      alert('Заполните все обязательные поля')
      return
    }

    setSaving(true)

    try {
      const supabase = getSupabase()
      const questionData = {
        group_id: groupId as number,
        level_id: levelId as number,
        text: text.trim(),
        explanation: explanation.trim(),
        source_id: sourceId || null,
        author: author.trim() || null,
        notes: notes.trim() || null,
        difficulty: 'medium',
      }

      let questionId: number

      if (question) {
        // Update
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', question.id)

        if (error) throw error
        questionId = question.id

        // Delete old answers
        await supabase.from('answers').delete().eq('question_id', questionId)
      } else {
        // Insert
        const { data, error } = await supabase
          .from('questions')
          .insert(questionData)
          .select()

        if (error) throw error
        questionId = data[0].id
      }

      // Insert answers
      const answersData = answers.map((text, i) => ({
        question_id: questionId,
        text: text.trim(),
        is_correct: i === correctAnswer,
      }))

      const { error: answersError } = await supabase.from('answers').insert(answersData)
      if (answersError) throw answersError

      onSave()
      onClose()
    } catch (error) {
      console.error('Save error:', error)
      alert('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const filteredLevels = levels.filter((l) => l.group_id === groupId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-700 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
          <h2 className="font-serif text-xl text-white italic">
            {question ? 'Редактировать вопрос' : 'Добавить вопрос'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Topic & Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Тема <span className="text-gold-500">*</span>
              </label>
              <select
                value={groupId}
                onChange={(e) => {
                  setGroupId(parseInt(e.target.value) || '')
                  setLevelId('')
                }}
                className="form-input"
                required
              >
                <option value="">Выберите тему</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Уровень <span className="text-gold-500">*</span>
              </label>
              <select
                value={levelId}
                onChange={(e) => setLevelId(parseInt(e.target.value) || '')}
                className="form-input"
                required
                disabled={!groupId}
              >
                <option value="">Выберите уровень</option>
                {filteredLevels.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Текст вопроса <span className="text-gold-500">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="form-input min-h-[80px]"
              placeholder="Введите текст вопроса..."
              required
            />
          </div>

          {/* Answers */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Варианты ответов <span className="text-gold-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">Отметьте правильный ответ</p>
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((letter, i) => (
                <div key={letter} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer === i}
                    onChange={() => setCorrectAnswer(i)}
                    className="w-5 h-5 accent-teal-500"
                  />
                  <span className="font-serif font-semibold text-gold-500 w-5">{letter}</span>
                  <input
                    type="text"
                    value={answers[i]}
                    onChange={(e) => {
                      const newAnswers = [...answers]
                      newAnswers[i] = e.target.value
                      setAnswers(newAnswers)
                    }}
                    className="form-input flex-1"
                    placeholder={`Вариант ${letter}`}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Объяснение <span className="text-gold-500">*</span>
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="form-input min-h-[80px]"
              placeholder="Почему этот ответ правильный..."
              required
            />
          </div>

          {/* Source & Author */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Источник</label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(parseInt(e.target.value) || '')}
                className="form-input"
              >
                <option value="">Без источника</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Автор</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="form-input"
                placeholder="Имя автора"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Заметки</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input min-h-[60px]"
              placeholder="Внутренние заметки..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="btn-glass">
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-gold disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
