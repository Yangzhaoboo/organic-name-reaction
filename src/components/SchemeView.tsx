import { useState } from 'react'
import type { Reaction } from '../types'

/**
 * 反应式展示：
 * 1. 优先加载 public/schemes/<id>.svg（ChemDraw 导出，矢量清晰）
 * 2. 失败则退回 <id>.png
 * 3. 都没有就显示纯文本反应式
 *
 * 特别宽的反应式（宽高比 > 2.9）不做等比缩放，改为固定高度 + 横向滚动，
 * 否则手机上会缩成一条看不清的细线。
 */
export function SchemeView({ r, compact = false }: { r: Reaction; compact?: boolean }) {
  const [stage, setStage] = useState<'svg' | 'png' | 'text'>(r.scheme_image ? 'svg' : 'text')
  const [wide, setWide] = useState(false)
  const base = import.meta.env.BASE_URL

  return (
    <div>
      <div className={`scheme${wide ? ' wide' : ''}`} style={compact ? { minHeight: 72 } : undefined}>
        {stage === 'text' && <div className="scheme-text">{r.scheme_simple}</div>}
        {stage !== 'text' && r.scheme_image && (
          <img
            src={`${base}schemes/${r.scheme_image}.${stage}`}
            alt={`${r.name_zh} 反应式`}
            loading="lazy"
            onLoad={(e) => {
              const img = e.currentTarget
              if (img.naturalHeight > 0) setWide(img.naturalWidth / img.naturalHeight > 2.9)
            }}
            onError={() => setStage((s) => (s === 'svg' ? 'png' : 'text'))}
          />
        )}
      </div>
      {/* 图片本身已经画了条件，只有退回纯文本时才在下方补一行 */}
      {stage === 'text' && (r.scheme_above || r.scheme_below) && (
        <div className="scheme-cond">
          {r.scheme_above && <span>{r.scheme_above}</span>}
          {r.scheme_below && <span>{r.scheme_below}</span>}
        </div>
      )}
    </div>
  )
}
