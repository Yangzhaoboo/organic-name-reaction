import { useState } from 'react'
import type { QuizMark, Reaction } from '../types'
import { ReactionCard } from '../components/ReactionCard'

export function FavoritesPage({
  all,
  favorites,
  learned,
  marks,
  onOpen,
}: {
  all: Reaction[]
  favorites: string[]
  learned: string[]
  marks: Record<string, QuizMark>
  onOpen: (id: string) => void
}) {
  const [tab, setTab] = useState<'fav' | 'learned'>('fav')

  const list =
    tab === 'fav'
      ? all.filter((r) => favorites.includes(r.id))
      : all.filter((r) => learned.includes(r.id))

  return (
    <>
      <div className="seg">
        <button className={`chip${tab === 'fav' ? ' on' : ''}`} onClick={() => setTab('fav')}>
          收藏 {favorites.length}
        </button>
        <button className={`chip${tab === 'learned' ? ' on' : ''}`} onClick={() => setTab('learned')}>
          已学 {learned.length}
        </button>
      </div>

      <div className="list">
        {list.length === 0 && (
          <div className="empty">
            {tab === 'fav' ? '还没有收藏的反应，详情页点「☆ 收藏」。' : '还没有标记已学的反应。'}
          </div>
        )}
        {list.map((r) => (
          <div key={r.id}>
            <ReactionCard
              r={r}
              onClick={() => onOpen(r.id)}
              favorite={favorites.includes(r.id)}
              learned={learned.includes(r.id)}
            />
            {marks[r.id] && (
              <div style={{ fontSize: 11.5, color: 'var(--muted)', margin: '4px 0 0 6px' }}>
                自测状态：{marks[r.id] === 'know' ? '会' : marks[r.id] === 'fuzzy' ? '模糊' : '不会'}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
