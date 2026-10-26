import { useCallback } from 'react'
import type { QuizMark } from './types'
import { getReaction, reactions } from './data'
import { go, useRoute } from './lib/router'
import { STORAGE_KEYS, useLocalStorage } from './lib/storage'
import { displayTitle } from './lib/ui'
import { HomePage } from './pages/HomePage'
import { DetailPage } from './pages/DetailPage'
import { ComparePage } from './pages/ComparePage'
import { QuizPage } from './pages/QuizPage'
import { FavoritesPage } from './pages/FavoritesPage'

const TAB_ROUTES = new Set(['home', 'compare', 'quiz', 'fav'])

export default function App() {
  const route = useRoute()

  const [favorites, setFavorites] = useLocalStorage<string[]>(STORAGE_KEYS.favorites, [])
  const [learned, setLearned] = useLocalStorage<string[]>(STORAGE_KEYS.learned, [])
  const [compareIds, setCompareIds] = useLocalStorage<string[]>(STORAGE_KEYS.compare, [])
  const [marks, setMarks] = useLocalStorage<Record<string, QuizMark>>(STORAGE_KEYS.quiz, {})

  const toggle = useCallback((list: string[], id: string) => {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
  }, [])

  const setMark = useCallback(
    (id: string, mark: QuizMark) => setMarks((m) => ({ ...m, [id]: mark })),
    [setMarks]
  )

  const isDetail = route.name === 'detail'
  const current = isDetail ? getReaction(route.id) : undefined

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          {isDetail ? (
            <button className="icon-btn" onClick={() => window.history.back()} aria-label="返回">
              ‹ 返回
            </button>
          ) : (
            <h1>{titleOf(route.name)}</h1>
          )}
          {isDetail && <h1 style={{ fontSize: 16 }}>{current ? displayTitle(current) : '未找到'}</h1>}
          <span className="spacer" />
          {!isDetail && <span className="hint">预习 · 复习</span>}
        </div>
      </header>

      {route.name === 'home' && (
        <HomePage
          all={reactions}
          favorites={favorites}
          learned={learned}
          onOpen={(id) => go(`/r/${id}`)}
        />
      )}

      {isDetail &&
        (current ? (
          <DetailPage
            r={current}
            favorite={favorites.includes(current.id)}
            learned={learned.includes(current.id)}
            onToggleFav={() => setFavorites((f) => toggle(f, current.id))}
            onToggleLearned={() => setLearned((l) => toggle(l, current.id))}
            onAddCompare={() => setCompareIds((ids) => (ids.includes(current.id) ? ids : [...ids, current.id]))}
            compareFull={compareIds.length >= 4 && !compareIds.includes(current.id)}
          />
        ) : (
          <div className="empty">没有找到这个反应，可能链接有误。</div>
        ))}

      {route.name === 'compare' && (
        <ComparePage compareIds={compareIds} setCompareIds={(ids) => setCompareIds(ids)} all={reactions} />
      )}

      {route.name === 'quiz' && (
        <QuizPage all={reactions} favorites={favorites} marks={marks} setMark={setMark} />
      )}

      {route.name === 'fav' && (
        <FavoritesPage
          all={reactions}
          favorites={favorites}
          learned={learned}
          marks={marks}
          onOpen={(id) => go(`/r/${id}`)}
        />
      )}

      {TAB_ROUTES.has(route.name) && (
        <nav className="tabbar">
          <div className="tabbar-inner">
            <Tab label="反应列表" active={route.name === 'home'} onClick={() => go('/')} />
            <Tab label="对比" active={route.name === 'compare'} onClick={() => go('/compare')} />
            <Tab label="自测" active={route.name === 'quiz'} onClick={() => go('/quiz')} />
            <Tab label="收藏" active={route.name === 'fav'} onClick={() => go('/fav')} />
          </div>
        </nav>
      )}
    </div>
  )
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`tab${active ? ' on' : ''}`} onClick={onClick}>
      <span className="dot" />
      {label}
    </button>
  )
}

function titleOf(name: string): string {
  switch (name) {
    case 'compare':
      return '对比'
    case 'quiz':
      return '自测'
    case 'fav':
      return '我的'
    default:
      return '人名反应速查'
  }
}
