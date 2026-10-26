import type { Reaction } from '../types'

/** 归一化：转小写、全角转半角、去掉标点与空格，便于中英混搜 */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[\s\-–—_·,，.。:：;；/\\()（）[\]【】"'"'’]/g, '')
}

export type SearchHit = { reaction: Reaction; score: number }

/**
 * 搜索权重：反应名 > 别名/缩写 > 类型与标签 > 其余字段
 * 多个关键词按「全部命中」处理（AND），任一词命中别名即可
 */
export function searchReactions(list: Reaction[], query: string): Reaction[] {
  const q = norm(query)
  if (!q) return list

  const terms = query
    .split(/\s+/)
    .map(norm)
    .filter(Boolean)

  const hits: SearchHit[] = []
  for (const r of list) {
    const name_zh = norm(r.name_zh)
    const name_en = norm(r.name_en)
    const aliases = [...r.aliases_zh, ...r.aliases_en].map(norm)
    const tags = r.tags.map(norm)
    const category = norm(r.category)
    const rest = norm(
      [
        r.overview,
        r.reagent ?? '',
        r.catalyst ?? '',
        r.base ?? '',
        ...r.substrates,
        ...r.products,
        r.mnemonics ?? '',
      ].join(' ')
    )

    let total = 0
    let allMatched = true

    for (const t of terms) {
      let s = 0
      if (name_zh === t || name_en === t) s = 100
      else if (name_zh.startsWith(t) || name_en.startsWith(t)) s = 80
      else if (name_zh.includes(t) || name_en.includes(t)) s = 60
      else if (aliases.some((a) => a.includes(t))) s = 45
      else if (tags.some((x) => x.includes(t))) s = 30
      else if (category.includes(t)) s = 25
      else if (rest.includes(t)) s = 10

      if (s === 0) allMatched = false
      total += s
    }

    if (allMatched) hits.push({ reaction: r, score: total })
  }

  return hits.sort((a, b) => b.score - a.score).map((h) => h.reaction)
}
