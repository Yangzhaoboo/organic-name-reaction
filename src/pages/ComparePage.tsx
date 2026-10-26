import { useMemo, useState } from 'react'
import type { Reaction } from '../types'
import { getReactions } from '../data'
import { searchReactions } from '../lib/search'
import { go } from '../lib/router'
import { displayTitle, stars } from '../lib/ui'

type Row = { label: string; get: (r: Reaction) => string }

const ROWS: Row[] = [
  { label: '反应式', get: (r) => r.scheme_simple },
  { label: '类型', get: (r) => r.category },
  { label: '试剂', get: (r) => r.reagent ?? '—' },
  { label: '催化/碱', get: (r) => [r.catalyst, r.base].filter((x) => x && x !== '—').join('；') || '—' },
  { label: '条件', get: (r) => [r.temp, r.time, r.solvent?.join('/')].filter(Boolean).join('，') || '—' },
  { label: '选择性', get: (r) => [r.regio_selectivity, r.stereo_selectivity].filter(Boolean).join('；') || '—' },
  { label: '易错点', get: (r) => r.pitfalls.join('；') || '—' },
  { label: '难度', get: (r) => stars(r.difficulty) },
]

export function ComparePage({
  compareIds,
  setCompareIds,
  all,
}: {
  compareIds: string[]
  setCompareIds: (ids: string[]) => void
  all: Reaction[]
}) {
  const [picking, setPicking] = useState(false)
  const [q, setQ] = useState('')

  const picked = useMemo(() => getReactions(compareIds), [compareIds])
  const options = useMemo(
    () => searchReactions(all.filter((r) => !compareIds.includes(r.id)), q),
    [all, compareIds, q]
  )

  const diffs = useMemo(() => {
    if (picked.length < 2) return []
    return ROWS.filter((row) => {
      const vals = picked.map((p) => row.get(p))
      return new Set(vals).size > 1
    }).map((row) => row.label)
  }, [picked])

  return (
    <>
      <div className="compare-head">
        <div className="selected">
          {picked.map((r) => (
            <span className="sel-chip" key={r.id}>
              {displayTitle(r)}
              <button
                onClick={() => setCompareIds(compareIds.filter((id) => id !== r.id))}
                aria-label={`移除 ${displayTitle(r)}`}
              >
                ×
              </button>
            </span>
          ))}
          {compareIds.length < 4 && (
            <button className="chip" onClick={() => setPicking((v) => !v)}>
              ＋ 添加
            </button>
          )}
          {compareIds.length > 0 && (
            <button className="chip" onClick={() => setCompareIds([])}>
              清空
            </button>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
          同类反应横向对比，最多 4 个；手机端可左右滑动
        </div>
      </div>

      {picking && (
        <div style={{ padding: '12px 16px 0' }}>
          <div className="search">
            <span aria-hidden style={{ color: 'var(--muted)' }}>⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索要对比的反应"
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
            {options.slice(0, 12).map((r) => (
              <button
                key={r.id}
                className="chip"
                onClick={() => {
                  setCompareIds([...compareIds, r.id])
                  setPicking(false)
                  setQ('')
                }}
              >
                {displayTitle(r)}
              </button>
            ))}
            {options.length === 0 && <span style={{ fontSize: 12, color: 'var(--muted)' }}>没有可添加的反应</span>}
          </div>
        </div>
      )}

      {picked.length === 0 ? (
        <div className="empty">
          还没有选择反应。
          <br />
          点上面的「＋ 添加」，或在详情页点「加入对比」。
        </div>
      ) : (
        <>
          {picked.length >= 3 && (
            <div className="compare-tip" style={{ marginTop: 10 }}>
              ← 左右滑动查看全部 {picked.length} 列 →
            </div>
          )}
          <div className="compare-table-wrap">
            <div
              className="compare-table"
              style={{ ['--cols' as string]: String(picked.length) }}
            >
              <div className="ct-row">
                <div className="ct-cell">字段</div>
                {picked.map((r) => (
                  <div className="ct-cell" key={r.id}>
                    <button onClick={() => go(`/r/${r.id}`)} style={{ fontWeight: 700 }}>
                      {displayTitle(r)}
                    </button>
                  </div>
                ))}
              </div>
              {ROWS.map((row) => {
                const vals = picked.map((p) => row.get(p))
                const same = new Set(vals).size === 1
                return (
                  <div className="ct-row" key={row.label}>
                    <div className="ct-cell">{row.label}</div>
                    {picked.map((p, i) => (
                      <div
                        className="ct-cell"
                        key={p.id}
                        style={!same ? { background: 'var(--accent-soft)' } : undefined}
                      >
                        {vals[i]}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="compare-tip">浅底色 = 该项存在差异</div>

          <div className="diff-card">
            <h3>
              差异摘要<span>自动生成</span>
            </h3>
            {diffs.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>所选反应的这些字段完全一致。</div>
            ) : (
              <ul>
                <li>共 {diffs.length} 个字段存在差异：{diffs.join('、')}</li>
                {diffs.slice(0, 3).map((label) => {
                  const row = ROWS.find((x) => x.label === label)!
                  const text = picked.map((p) => row.get(p)).join(' ／ ')
                  return (
                    <li key={label}>
                      <b>{label}</b>：{text.length > 90 ? text.slice(0, 90) + '…' : text}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  )
}
