import type { Reaction } from '../types'
import { SchemeView } from '../components/SchemeView'
import { reactions } from '../data'
import { go } from '../lib/router'
import { displayTitle, stars, subLine, todoLabel } from '../lib/ui'

export function DetailPage({
  r,
  favorite,
  learned,
  onToggleFav,
  onToggleLearned,
  onAddCompare,
  compareFull,
}: {
  r: Reaction
  favorite: boolean
  learned: boolean
  onToggleFav: () => void
  onToggleLearned: () => void
  onAddCompare: () => void
  compareFull: boolean
}) {
  const todos = r.todo_fields ?? []
  /** 相关反应：同类型里除自己以外的前 3 个，方便一键加入对比 */
  const related = reactions.filter((x) => x.category === r.category && x.id !== r.id).slice(0, 3)

  return (
    <>
      <div className="detail">
        <h1 className="detail-title">{displayTitle(r)}</h1>
        <div className="detail-sub">{subLine(r)}</div>

        <div className="chips" style={{ padding: 0 }}>
          {r.aliases_zh
            .filter((a) => a !== r.name_zh)
            .slice(0, 3)
            .map((a) => (
              <span className="chip" key={a}>
                {a}
              </span>
            ))}
        </div>

        <div className="detail-meta">
          {r.category} · {r.tags.slice(0, 3).join(' / ')} · 难度 <span className="stars">{stars(r.difficulty)}</span>
          {r.year ? ` · ${r.year}` : ''}
        </div>

        {todos.length > 0 && (
          <div className="pitfalls" style={{ marginTop: 10, background: '#fffbeb', borderColor: '#fde68a' }}>
            <h3 style={{ color: '#b45309' }}>待核对（{todos.length} 项）</h3>
            <ul style={{ color: '#92400e' }}>
              {todos.map((t) => (
                <li key={t}>{todoLabel(t)}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ---------- 速查卡 ---------- */}
        <div className="section-label">
          速查卡 <span className="rule" />
        </div>

        <div className="sheet">
          <SchemeView r={r} />

          <div className="cond-grid">
            <Cell k="试剂" v={r.reagent} />
            <Cell k="催化" v={r.catalyst && r.catalyst !== '—' ? r.catalyst : undefined} />
            <Cell k="碱" v={r.base && r.base !== '—' ? r.base : undefined} />
            <Cell k="溶剂" v={r.solvent?.join(' / ')} />
            <Cell k="温度" v={r.temp} />
            <Cell k="时间" v={r.time} />
            <Cell k="气氛" v={r.atmosphere} />
            <Cell k="底物" v={r.substrates.slice(0, 3).join('、')} />
          </div>

          <div className="sel">
            {r.regio_selectivity && (
              <p>
                <span className="k">区域：</span>
                {r.regio_selectivity}
              </p>
            )}
            {r.stereo_selectivity && (
              <p>
                <span className="k">立体：</span>
                {r.stereo_selectivity}
              </p>
            )}
            {r.selectivity_note && <p style={{ color: 'var(--muted)' }}>{r.selectivity_note}</p>}
          </div>
        </div>

        {r.pitfalls.length > 0 && (
          <div className="pitfalls">
            <h3>易错点</h3>
            <ul>
              {r.pitfalls.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {r.mnemonics && (
          <div className="sheet" style={{ marginTop: 12, background: '#fffaf6', borderColor: 'var(--accent-line)' }}>
            <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>记忆点</div>
            <div style={{ fontSize: 13.5 }}>{r.mnemonics}</div>
          </div>
        )}

        {/* ---------- 折叠区 ---------- */}
        <div style={{ marginTop: 16, background: '#fff', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '0 14px' }}>
          <details className="block">
            <summary>
              机理分步<span className="cnt">{r.mechanism_steps.length} 步</span>
            </summary>
            <div className="body">
              <ol className="steps">
                {r.mechanism_steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          </details>

          <details className="block">
            <summary>
              典型例子<span className="cnt">{r.examples.length} 条</span>
            </summary>
            <div className="body">
              <ul className="steps">
                {r.examples.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          </details>

          <details className="block">
            <summary>适用范围与局限</summary>
            <div className="body">
              <div className="kv">
                <div className="k">产物</div>
                <div>{r.products.join('、')}</div>
                <div className="k">适用</div>
                <div>{r.scope ?? '待核对'}</div>
                <div className="k">局限</div>
                <div>{r.limitations ?? '待核对'}</div>
              </div>
            </div>
          </details>

          <details className="block">
            <summary>
              拓展阅读 · 文献<span className="cnt">{r.references.length} 条</span>
            </summary>
            <div className="body">
              <ul className="steps">
                {r.references.map((ref, i) => (
                  <li key={i}>{ref}</li>
                ))}
              </ul>
            </div>
          </details>
        </div>

        {related.length > 0 && (
          <>
            <div className="section-label">
              相关 · 可加入对比 <span className="rule" />
            </div>
            <div className="rel">
              {related.map((x) => (
                <button key={x.id} className="chip" onClick={() => go(`/r/${x.id}`)}>
                  {displayTitle(x)}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="foot-note">
          数据状态：{r.status === 'verified' ? '已核对' : r.status === 'partial' ? '部分待核对' : '未核对'}
          {r.discoverer ? ` · 发现者：${r.discoverer}` : ''}
        </div>
      </div>

      {/* 底部固定操作条 */}
      <div className="actionbar">
        <div className="actionbar-inner">
          <button className="btn ghost" onClick={onToggleFav}>
            {favorite ? '★ 已收藏' : '☆ 收藏'}
          </button>
          <button className="btn" onClick={onToggleLearned}>
            {learned ? '✓ 已学' : '标记已学'}
          </button>
          <button className="btn primary" onClick={onAddCompare} disabled={compareFull}>
            加入对比
          </button>
        </div>
      </div>
    </>
  )
}

function Cell({ k, v }: { k: string; v?: string }) {
  if (!v) return null
  return (
    <div>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  )
}
