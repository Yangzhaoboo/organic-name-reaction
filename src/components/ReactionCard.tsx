import type { Reaction } from '../types'
import { categoryColor, displayTitle, subLine, stars, todoCount } from '../lib/ui'

export function ReactionCard({
  r,
  onClick,
  favorite,
  learned,
}: {
  r: Reaction
  onClick: () => void
  favorite?: boolean
  learned?: boolean
}) {
  const todos = todoCount(r)
  return (
    <button
      className="card"
      style={{ ['--cat-color' as string]: categoryColor(r.category) }}
      onClick={onClick}
    >
      <div className="card-title">
        {favorite ? '★ ' : ''}
        {learned ? '✓ ' : ''}
        {displayTitle(r)}
      </div>
      <div className="card-alias">{subLine(r)}</div>
      <div className="card-desc">{r.overview}</div>
      <div className="card-foot">
        <span className="tag">{r.category}</span>
        <span className="stars">{stars(r.difficulty)}</span>
        {todos > 0 ? (
          <span className="badge todo">待核对 {todos}</span>
        ) : (
          <span className="badge ok">已核对</span>
        )}
      </div>
    </button>
  )
}
