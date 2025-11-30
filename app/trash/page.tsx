'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'

interface Question {
  id: number
  text: string
  explanation: string
  group_id: number
  deleted_at: string
  quiz_groups?: { title: string }
}

export default function TrashPage() {
  const [deletedQuestions, setDeletedQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<number | null>(null)

  useEffect(() => {
    loadDeletedQuestions()
  }, [])

  async function loadDeletedQuestions() {
    try {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('questions')
        .select('*, quiz_groups(title)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

      setDeletedQuestions(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function restoreQuestion(id: number) {
    if (!confirm('Восстановить этот вопрос?')) return
    
    setRestoring(id)
    try {
      const supabase = getSupabase()
      
      // Save restore action to history
      const { data: question } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single()
      
      if (question) {
        const { data: answers } = await supabase
          .from('answers')
          .select('*')
          .eq('question_id', id)
        
        await supabase.from('question_history').insert({
          question_id: id,
          text: question.text,
          explanation: question.explanation,
          group_id: question.group_id,
          level_id: question.level_id,
          source_id: question.source_id,
          difficulty: question.difficulty,
          answers: answers || [],
          action: 'restore',
        })
      }
      
      // Restore question
      const { error } = await supabase
        .from('questions')
        .update({ deleted_at: null })
        .eq('id', id)

      if (error) throw error

      setDeletedQuestions(prev => prev.filter(q => q.id !== id))
      alert('Вопрос восстановлен ✓')
    } catch (error: any) {
      console.error('Restore error:', error)
      alert(`Ошибка: ${error?.message || 'Неизвестная ошибка'}`)
    } finally {
      setRestoring(null)
    }
  }

  async function permanentDelete(id: number) {
    if (!confirm('УДАЛИТЬ НАВСЕГДА? Это действие нельзя отменить!')) return
    
    setRestoring(id)
    try {
      const supabase = getSupabase()
      
      // Delete answers first
      await supabase.from('answers').delete().eq('question_id', id)
      
      // Delete question
      const { error } = await supabase.from('questions').delete().eq('id', id)
      if (error) throw error

      setDeletedQuestions(prev => prev.filter(q => q.id !== id))
      alert('Вопрос удалён навсегда')
    } catch (error: any) {
      console.error('Delete error:', error)
      alert(`Ошибка: ${error?.message || 'Неизвестная ошибка'}`)
    } finally {
      setRestoring(null)
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <div className="loading">Загрузка...</div>
  }

  return (
    <>
      <div className="section-header">
        <h1>Корзина</h1>
      </div>

      {deletedQuestions.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <p>Корзина пуста</p>
              <p style={{ fontSize: '13px', marginTop: '8px', opacity: 0.6 }}>
                Удалённые вопросы появятся здесь
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="questions-list">
          {deletedQuestions.map((q) => (
            <div key={q.id} className="question-card deleted">
              <div className="question-header">
                <span className="question-number">#{q.id}</span>
                <span className="deleted-date">
                  Удалён: {formatDate(q.deleted_at)}
                </span>
              </div>

              <div className="question-text">{q.text}</div>

              <div className="question-meta">
                <span>{q.quiz_groups?.title || '—'}</span>
              </div>

              <div className="trash-actions">
                <button
                  className="btn btn-gold"
                  onClick={() => restoreQuestion(q.id)}
                  disabled={restoring === q.id}
                >
                  {restoring === q.id ? 'Восстановление...' : '↩ Восстановить'}
                </button>
                <button
                  className="btn btn-delete"
                  onClick={() => permanentDelete(q.id)}
                  disabled={restoring === q.id}
                >
                  Удалить навсегда
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

