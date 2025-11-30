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
  questionNum: number
  onClose: () => void
}

export default function HistoryModal({ questionId, questionNum, onClose }: Props) {
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
        .limit(5)  // Max 5 versions

      setHistory(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDateTime(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>История вопроса #{questionNum}</h2>
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
              {history.map((entry, idx) => (
                <div key={entry.id} className="history-entry">
                  <div className="history-header">
                    <span className="history-version">
                      Версия {history.length - idx}
                    </span>
                    <span className="history-date">
                      {formatDateTime(entry.changed_at)}
                    </span>
                  </div>
                  
                  <div className="history-content">
                    <div className="history-text">{entry.text}</div>
                    
                    {entry.answers && entry.answers.length > 0 && (
                      <div className="history-answers">
                        {entry.answers.map((a: any, i: number) => (
                          <div 
                            key={i} 
                            className={`history-answer ${a.is_correct ? 'correct' : ''}`}
                          >
                            {['A', 'B', 'C', 'D'][i]}: {a.text}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {entry.explanation && (
                      <div className="history-explanation">
                        <strong>Объяснение:</strong> {entry.explanation}
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

