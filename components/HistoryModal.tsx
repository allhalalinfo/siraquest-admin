'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'

interface HistoryEntry {
  id: number
  question_id: number
  text: string
  explanation: string
  action: string
  changed_at: string
  answers: any[]
}

interface Props {
  questionId: number
  onClose: () => void
}

export default function HistoryModal({ questionId, onClose }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
    document.body.classList.add('modal-open')
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [])

  async function loadHistory() {
    try {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('question_history')
        .select('*')
        .eq('question_id', questionId)
        .order('changed_at', { ascending: false })

      setHistory(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
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

  function getActionLabel(action: string) {
    switch (action) {
      case 'update': return 'Изменение'
      case 'delete': return 'Удаление'
      case 'restore': return 'Восстановление'
      default: return action
    }
  }

  function getActionColor(action: string) {
    switch (action) {
      case 'update': return '#fbbf24'
      case 'delete': return '#f87171'
      case 'restore': return '#4ade80'
      default: return '#888'
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>История вопроса #{questionId}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <p>История пуста</p>
              <p style={{ fontSize: '13px', marginTop: '8px', opacity: 0.6 }}>
                Изменения будут записываться при редактировании
              </p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((entry) => (
                <div key={entry.id} className="history-entry">
                  <div className="history-header">
                    <span 
                      className="history-action"
                      style={{ color: getActionColor(entry.action) }}
                    >
                      {getActionLabel(entry.action)}
                    </span>
                    <span className="history-date">
                      {formatDate(entry.changed_at)}
                    </span>
                  </div>
                  
                  <div className="history-content">
                    <div className="history-text">{entry.text}</div>
                    
                    {entry.answers && entry.answers.length > 0 && (
                      <div className="history-answers">
                        {entry.answers.map((a: any, i: number) => (
                          <span 
                            key={i} 
                            className={`history-answer ${a.is_correct ? 'correct' : ''}`}
                          >
                            {['A', 'B', 'C', 'D'][i]}: {a.text}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {entry.explanation && (
                      <div className="history-explanation">
                        {entry.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

