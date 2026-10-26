import type { Reaction } from '../types'

/** 每个反应类型一个颜色，用于卡片左侧色条 */
const CATEGORY_COLORS: Record<string, string> = {
  'C–C 单键': '#2563eb',
  'C=C 构建': '#9333ea',
  'C–杂键构建': '#0891b2',
  重排: '#0d9488',
  氧化: '#dc2626',
  还原: '#16a34a',
  偶联: '#d97706',
  周环: '#7c3aed',
}

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#c2410c'
}

/** 难度 1–5 显示成 ★★☆ 形式 */
export function stars(difficulty: number): string {
  const n = Math.max(1, Math.min(5, Math.round(difficulty || 1)))
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

/** 大字标题：优先用数据里的 title（形如「Wittig 反应」），否则从英文名推导 */
export function displayTitle(r: Reaction): string {
  if (r.title) return r.title
  const map: [RegExp, string][] = [
    [/reaction/i, '反应'],
    [/condensation/i, '缩合'],
    [/addition/i, '加成'],
    [/oxidation/i, '氧化'],
    [/rearrangement/i, '重排'],
    [/alkylation/i, '烷基化'],
    [/olefination/i, '烯化'],
  ]
  for (const [re, zh] of map) {
    if (re.test(r.name_en)) return r.name_en.replace(re, zh).trim()
  }
  return r.name_en
}

/** 小字副标题：中文名 · 英文全名；若中文名与大字标题重复，只显示英文 */
export function subLine(r: Reaction): string {
  const t = displayTitle(r).replace(/\s+/g, '')
  const zh = r.name_zh.replace(/\s+/g, '')
  if (t === zh || t.startsWith(zh)) return r.name_en
  return `${r.name_zh} · ${r.name_en}`
}

/** 卡片上的小字（与副标题一致） */
export function aliasLine(r: Reaction): string {
  return subLine(r)
}

export function todoCount(r: Reaction): number {
  return r.todo_fields?.length ?? 0
}

/** 把 todo_fields 里的英文字段名翻成中文，方便直接看懂要核对什么 */
export function todoLabel(key: string): string {
  const rules: [RegExp, string][] = [
    [/examples/i, '典型例子（含产率）'],
    [/references/i, '参考文献（页码 / 章节）'],
    [/year|discoverer/i, '年份 / 发现者'],
    [/time/i, '反应时间'],
    [/atmosphere/i, '气氛要求'],
    [/temp/i, '温度'],
    [/迁移/, '基团迁移能力顺序'],
    [/yield/i, '产率'],
  ]
  for (const [re, label] of rules) {
    if (re.test(key)) return label
  }
  return key
}
