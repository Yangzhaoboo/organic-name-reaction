import { useMemo, useState } from 'react'
import type { Reaction } from '../types'
import { CATEGORIES } from '../data'
import { searchReactions } from '../lib/search'
import { ReactionCard } from '../components/ReactionCard'

export function HomePage({
  all,
  favorites,
  learned,
  onOpen,
}: {
  all: Reaction[]
  favorites: string[]
  learned: string[]
  onOpen: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('全部')
  const [onlyFav, setOnlyFav] = useState(false)
  const [onlyLearned, setOnlyLearned] = useState(false)

  const favSet = useMemo(() => new Set(favorites), [favorites])
  const learnedSet = useMemo(() => new Set(learned), [learned])

  const list = useMemo(() => {
    let out = all
    if (cat !== '全部') out = out.filter((r) => r.category === cat)
    if (onlyFav) out = out.filter((r) => favSet.has(r.id))
    if (onlyLearned) out = out.filter((r) => learnedSet.has(r.id))
    return searchReactions(out, query)
  }, [all, cat, onlyFav, onlyLearned, query, favSet, learnedSet])

  return (
    <>
      <div className="search-wrap">
        <div className="search">
          <span aria-hidden style={{ color: 'var(--muted)' }}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="中英名 / 俗称 / 缩写 / 类型"
            aria-label="搜索人名反应"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button className="clear" onClick={() => setQuery('')} aria-label="清空搜索">
              ×
            </button>
          )}
        </div>
      </div>

      <div className="filters">
        <div className="chips">
          {['全部', ...CATEGORIES].map((c) => (
            <button
              key={c}
              className={`chip${cat === c ? ' on' : ''}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="tool-row">
          <label>
            <input
              type="checkbox"
              checked={onlyFav}
              onChange={(e) => setOnlyFav(e.target.checked)}
            />
            只看收藏
          </label>
          <label>
            <input
              type="checkbox"
              checked={onlyLearned}
              onChange={(e) => setOnlyLearned(e.target.checked)}
            />
            只看已学
          </label>
          <span className="count">
            共 {all.length} 个 · 当前 {list.length}
          </span>
        </div>
      </div>

      <div className="list">
        {list.length === 0 && <div className="empty">没有匹配的反应，换个关键词试试</div>}
        {list.map((r) => (
          <ReactionCard
            key={r.id}
            r={r}
            onClick={() => onOpen(r.id)}
            favorite={favSet.has(r.id)}
            learned={learnedSet.has(r.id)}
          />
        ))}
      </div>
    </>
  )
}
