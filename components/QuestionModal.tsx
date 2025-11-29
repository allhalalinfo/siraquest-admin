'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'

interface Question {
  id: number
  text: string
  explanation: string
  group_id: number
  level_id: number
  source_id: number | null
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

interface Source {
  id: number
  title: string
}

interface Props {
  question: Question | null
  onClose: () => void
  onSave: () => void
}

export default function QuestionModal({ question, onClose, onSave }: Props) {
  const [groups, setGroups] = useState<Group[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [saving, setSaving] = useState(false)

  // Form state
  const [groupId, setGroupId] = useState<string>('')
  const [levelId, setLevelId] = useState<string>('')
  const [text, setText] = useState('')
  const [answers, setAnswers] = useState(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState(0)
  const [explanation, setExplanation] = useState('')
  const [sourceId, setSourceId] = useState<string>('')

  useEffect(() => {
    loadFormData()
    // Block body scroll
    document.body.classList.add('modal-open')
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [])

  useEffect(() => {
    if (question) {
      setGroupId(String(question.group_id))
      setLevelId(String(question.level_id))
      setText(question.text)
      setExplanation(question.explanation || '')
      setSourceId(question.source_id ? String(question.source_id) : '')
      loadAnswers(question.id)
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
        group_id: parseInt(groupId),
        level_id: parseInt(levelId),
        text: text.trim(),
        explanation: explanation.trim(),
        source_id: sourceId ? parseInt(sourceId) : null,
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
        const { data, error } = await supabase.from('questions').insert(questionData).select()

        if (error) throw error
        questionId = data[0].id
      }

      // Insert answers
      const answersData = answers.map((txt, i) => ({
        question_id: questionId,
        text: txt.trim(),
        is_correct: i === correctAnswer,
      }))

      const { error: answersError } = await supabase.from('answers').insert(answersData)
      if (answersError) throw answersError

      onSave()
    } catch (error) {
      console.error('Save error:', error)
      alert('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const filteredLevels = levels.filter((l) => l.group_id === parseInt(groupId))

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{question ? 'Редактировать вопрос' : 'Добавить вопрос'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Тема</label>
                <select
                  className="form-select"
                  value={groupId}
                  onChange={(e) => {
                    setGroupId(e.target.value)
                    setLevelId('')
                  }}
                  required
                >
                  <option value="">Выберите тему</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Уровень</label>
                <select
                  className="form-select"
                  value={levelId}
                  onChange={(e) => setLevelId(e.target.value)}
                  required
                >
                  {!groupId ? (
                    <option value="">Сначала выберите тему</option>
                  ) : filteredLevels.length === 0 ? (
                    <option value="">Нет уровней</option>
                  ) : (
                    <>
                      <option value="">Выберите уровень</option>
                      {filteredLevels.map((l) => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Текст вопроса</label>
              <textarea
                className="form-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Введите текст вопроса..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Варианты ответов</label>
              <p className="form-hint">Отметьте правильный ответ</p>
              <div className="answers-group">
                {['A', 'B', 'C', 'D'].map((letter, i) => (
                  <div key={letter} className="answer-row">
                    <input
                      type="radio"
                      name="correctAnswer"
                      className="answer-radio"
                      checked={correctAnswer === i}
                      onChange={() => setCorrectAnswer(i)}
                    />
                    <span className="answer-letter">{letter}</span>
                    <input
                      type="text"
                      className="form-input"
                      value={answers[i]}
                      onChange={(e) => {
                        const newAnswers = [...answers]
                        newAnswers[i] = e.target.value
                        setAnswers(newAnswers)
                      }}
                      placeholder={`Вариант ${letter}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Объяснение ответа</label>
              <textarea
                className="form-textarea"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Почему этот ответ правильный..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Источник</label>
              <select
                className="form-select"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              >
                <option value="">Без источника</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-gold" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
