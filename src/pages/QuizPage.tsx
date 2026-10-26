import { useEffect, useMemo, useRef, useState } from 'react'
import type { QuizMark, Reaction } from '../types'
import { SchemeView } from '../components/SchemeView'
import { go } from '../lib/router'
import { displayTitle, subLine } from '../lib/ui'

type Mode = 'scheme' | 'name'
type Scope = 'all' | 'fav'

export function QuizPage({
  all,
  favorites,
  marks,
  setMark,
}: {
  all: Reaction[]
  favorites: string[]
  marks: Record<string, QuizMark>
  setMark: (id: string, mark: QuizMark) => void
}) {
  const [mode, setMode] = useState<Mode>('scheme')
  const [scope, setScope] = useState<Scope>('all')
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const pool = useMemo(() => {
    const base = scope === 'fav' ? all.filter((r) => favorites.includes(r.id)) : all
    return base
  }, [all, favorites, scope])

  const safeIndex = pool.length ? Math.min(index, pool.length - 1) : 0
  const current = pool[safeIndex]

  const answered = Object.keys(marks).length
  const know = Object.values(marks).filter((m) => m === 'know').length

  // 揭晓答案后把答案区滚到视野中间，省得用户自己往下找
  const answerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (revealed) {
      answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [revealed])

  function next() {
    setRevealed(false)
    setIndex((i) => (pool.length ? (i + 1) % pool.length : 0))
  }

  function rate(mark: QuizMark) {
    if (!current) return
    setMark(current.id, mark)
    next()
  }

  if (!current) {
    return (
      <div className="empty">
        当前范围内没有反应。
        <br />
        {scope === 'fav' ? '先收藏几个反应再来。' : '请先在 data/reactions 里添加数据。'}
      </div>
    )
  }

  return (
    <div className="quiz">
      <div className="chips" style={{ padding: 0, marginBottom: 8 }}>
        <button className={`chip${mode === 'scheme' ? ' on' : ''}`} onClick={() => { setMode('scheme'); setRevealed(false) }}>
          看反应式猜名字
        </button>
        <button className={`chip${mode === 'name' ? ' on' : ''}`} onClick={() => { setMode('name'); setRevealed(false) }}>
          看名字说条件
        </button>
      </div>
      <div className="chips" style={{ padding: 0, marginBottom: 10 }}>
        <button className={`chip${scope === 'all' ? ' on' : ''}`} onClick={() => { setScope('all'); setIndex(0); setRevealed(false) }}>
          全部 {all.length}
        </button>
        <button className={`chip${scope === 'fav' ? ' on' : ''}`} onClick={() => { setScope('fav'); setIndex(0); setRevealed(false) }}>
          只练收藏 {favorites.length}
        </button>
      </div>

      <div className="quiz-progress">
        <span>
          第 {safeIndex + 1} / {pool.length} 题
        </span>
        <div className="bar">
          <i style={{ width: `${((safeIndex + 1) / pool.length) * 100}%` }} />
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 11.5 }}>
          会 {know} / 已答 {answered}
        </span>
      </div>

      <div className="qcard">
        <div className="q-label">{mode === 'scheme' ? '题面 · 反应识别' : '题面 · 条件与选择性'}</div>

        {mode === 'scheme' ? (
          <>
            <div className="q-title">这是哪个人名反应？</div>
            <SchemeView r={current} compact />
          </>
        ) : (
          <>
            <div className="q-title" style={{ fontSize: 18 }}>
              {displayTitle(current)}
              <div style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 13 }}>
                {subLine(current)}
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              说出：典型底物、试剂与条件、区域/立体选择性
            </div>
          </>
        )}

        {!revealed ? (
          <div className="answer">
            <div style={{ fontSize: 14, fontWeight: 600, color: '#8b929c' }}>答案已隐藏</div>
            <div>点下方「显示答案」揭晓</div>
          </div>
        ) : (
          <div className="answer revealed" ref={answerRef}>
            {mode === 'scheme' ? (
              <>
                <div className="big">{displayTitle(current)}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>{subLine(current)}</div>
                <div style={{ fontSize: 13 }}>
                  类型：{current.category}
                  {current.aliases_zh.length > 0 ? ` · 别名：${current.aliases_zh.join('、')}` : ''}
                </div>
                {current.mnemonics && (
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    <b>记忆点：</b>
                    {current.mnemonics}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  <b>底物：</b>
                  {current.substrates.join('、')}
                </div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  <b>试剂：</b>
                  {current.reagent ?? '—'}
                  {current.catalyst && current.catalyst !== '—' ? `；催化 ${current.catalyst}` : ''}
                  {current.base && current.base !== '—' ? `；碱 ${current.base}` : ''}
                </div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  <b>条件：</b>
                  {[current.temp, current.time, current.solvent?.join('/')].filter(Boolean).join('，') || '待核对'}
                </div>
                <div style={{ fontSize: 13 }}>
                  <b>选择性：</b>
                  {[current.regio_selectivity, current.stereo_selectivity].filter(Boolean).join('；') || '待核对'}
                </div>
              </>
            )}
            <div style={{ marginTop: 8 }}>
              <button className="chip" onClick={() => go(`/r/${current.id}`)}>
                打开完整速查卡 →
              </button>
            </div>
          </div>
        )}

        {revealed && (
          <div className="rates">
            <button className={`rate know${marks[current.id] === 'know' ? ' on' : ''}`} onClick={() => rate('know')}>
              会
            </button>
            <button className={`rate fuzzy${marks[current.id] === 'fuzzy' ? ' on' : ''}`} onClick={() => rate('fuzzy')}>
              模糊
            </button>
            <button className={`rate unknown${marks[current.id] === 'unknown' ? ' on' : ''}`} onClick={() => rate('unknown')}>
              不会
            </button>
          </div>
        )}
      </div>

      {/* 固定操作条，悬在底部 tab 之上，两者都能看到 */}
      <div className="quiz-nav-bar">
        <div className="quiz-nav">
          <button
            className="btn"
            onClick={() => {
              setRevealed(false)
              setIndex((i) => (i - 1 + pool.length) % pool.length)
            }}
          >
            上一题
          </button>
          {revealed ? (
            <button className="btn primary" onClick={next}>
              下一题
            </button>
          ) : (
            <button className="btn primary" onClick={() => setRevealed(true)}>
              显示答案
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
