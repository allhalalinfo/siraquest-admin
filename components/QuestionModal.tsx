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
  difficulty?: string
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
  onDelete?: (id: number) => void
}

export default function QuestionModal({ question, onClose, onSave, onDelete }: Props) {
  const [groups, setGroups] = useState<Group[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Form state
  const [groupId, setGroupId] = useState<string>('')
  const [levelId, setLevelId] = useState<string>('')
  const [text, setText] = useState('')
  const [answers, setAnswers] = useState(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState(0)
  const [explanation, setExplanation] = useState('')
  const [sourceId, setSourceId] = useState<string>('')
  
  // New source
  const [showNewSource, setShowNewSource] = useState(false)
  const [newSourceTitle, setNewSourceTitle] = useState('')
  const [newSourceUrl, setNewSourceUrl] = useState('')

  useEffect(() => {
    loadFormData()
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
      
      // Create new source if needed
      let finalSourceId: number | null = sourceId ? parseInt(sourceId) : null
      
      if (showNewSource && newSourceTitle.trim()) {
        const { data: newSource, error: sourceError } = await supabase
          .from('sources')
          .insert({ 
            title: newSourceTitle.trim(), 
            url: newSourceUrl.trim() || null,
            type: 'other'
          })
          .select()
        
        if (sourceError) {
          console.error('Source error:', sourceError)
          alert(`Ошибка создания источника: ${sourceError.message}`)
          setSaving(false)
          return
        }
        
        if (newSource && newSource[0]) {
          finalSourceId = newSource[0].id
        }
      }
      
      const questionData = {
        group_id: parseInt(groupId),
        level_id: parseInt(levelId),
        text: text.trim(),
        explanation: explanation.trim(),
        source_id: finalSourceId,
        difficulty: 'medium',
      }

      let questionId: number

      if (question) {
        // Save current version to history before updating
        await saveToHistory(question.id)
        
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', question.id)

        if (error) throw error
        questionId = question.id

        await supabase.from('answers').delete().eq('question_id', questionId)
      } else {
        const { data, error } = await supabase.from('questions').insert(questionData).select()

        if (error) throw error
        questionId = data[0].id
      }

      const answersData = answers.map((txt, i) => ({
        question_id: questionId,
        text: txt.trim(),
        is_correct: i === correctAnswer,
      }))

      const { error: answersError } = await supabase.from('answers').insert(answersData)
      if (answersError) throw answersError

      // Show success message
      setSuccessMessage(question ? 'Вопрос обновлён ✓' : 'Вопрос добавлен ✓')
      
      // Close after delay
      setTimeout(() => {
        onSave()
      }, 1000)
      
    } catch (error: any) {
      console.error('Save error:', error)
      alert(`Ошибка сохранения: ${error?.message || 'Неизвестная ошибка'}`)
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteClick() {
    setShowDeleteConfirm(true)
  }

  async function confirmDelete() {
    if (!question || !onDelete) return
    
    setShowDeleteConfirm(false)
    setDeleting(true)
    
    try {
      const supabase = getSupabase()
      
      // Save to history before soft delete
      await saveToHistory(question.id)
      
      // Soft delete - set deleted_at instead of actual delete
      const { error } = await supabase
        .from('questions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', question.id)
      
      if (error) throw error
      
      setSuccessMessage('Вопрос удалён ✓')
      
      setTimeout(() => {
        onDelete(question.id)
        onClose()
      }, 1000)
    } catch (error: any) {
      console.error('Delete error:', error)
      setSuccessMessage('')
      setDeleting(false)
    }
  }

  const filteredLevels = levels.filter((l) => l.group_id === parseInt(groupId))

  // Save question history before changes (keep max 5 versions)
  async function saveToHistory(questionId: number) {
    const supabase = getSupabase()
    
    // Get current question data
    const { data: currentQuestion } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()
    
    if (!currentQuestion) return
    
    // Get current answers
    const { data: currentAnswers } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', questionId)
      .order('id')
    
    // Save to history
    await supabase.from('question_history').insert({
      question_id: questionId,
      text: currentQuestion.text,
      explanation: currentQuestion.explanation,
      group_id: currentQuestion.group_id,
      level_id: currentQuestion.level_id,
      source_id: currentQuestion.source_id,
      difficulty: currentQuestion.difficulty,
      answers: currentAnswers || [],
      action: 'update',
    })
    
    // Delete old versions (keep only 5)
    const { data: allHistory } = await supabase
      .from('question_history')
      .select('id')
      .eq('question_id', questionId)
      .order('changed_at', { ascending: false })
    
    if (allHistory && allHistory.length > 5) {
      const idsToDelete = allHistory.slice(5).map(h => h.id)
      await supabase.from('question_history').delete().in('id', idsToDelete)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Success Toast */}
        {successMessage && (
          <div className="toast toast-success">
            {successMessage}
          </div>
        )}
        
        <div className="modal-header">
          <h2>{question ? 'Редактировать вопрос' : 'Добавить вопрос'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
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
              {!showNewSource ? (
                <>
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
                  <button 
                    type="button" 
                    className="btn-link"
                    onClick={() => {
                      setShowNewSource(true)
                      setSourceId('')
                    }}
                  >
                    + Добавить новый источник
                  </button>
                </>
              ) : (
                <div className="new-source-form">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Название источника *"
                    value={newSourceTitle}
                    onChange={(e) => setNewSourceTitle(e.target.value)}
                  />
                  <input
                    type="url"
                    className="form-input"
                    placeholder="URL (необязательно)"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="btn-link"
                    onClick={() => {
                      setShowNewSource(false)
                      setNewSourceTitle('')
                      setNewSourceUrl('')
                    }}
                  >
                    ← Выбрать из существующих
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            {question && onDelete && (
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  className="btn btn-delete"
                  onClick={handleDeleteClick}
                  disabled={deleting}
                >
                  {deleting ? 'Удаление...' : 'Удалить'}
                </button>
              ) : (
                <div className="delete-confirm-inline">
                  <span>Удалить?</span>
                  <button
                    type="button"
                    className="btn btn-delete-yes"
                    onClick={confirmDelete}
                  >
                    Да
                  </button>
                  <button
                    type="button"
                    className="btn btn-delete-no"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Нет
                  </button>
                </div>
              )}
            )}
            
            <div className="modal-footer-right">
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
