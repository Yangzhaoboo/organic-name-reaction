import type { Reaction } from '../types'
import { displayTitle } from '../lib/ui'

/**
 * 加反应只需要在 ./reactions/ 下新建一个 JSON 文件，这里会自动收集。
 * 文件名建议用「序号-英文id.json」，方便排序。
 */
const modules = import.meta.glob('./reactions/*.json', { eager: true }) as Record<
  string,
  { default: Reaction }
>

export const reactions: Reaction[] = Object.values(modules)
  .map((m) => m.default)
  // 按「大字标题」排序，等价于按英文名 A→Z，方便按字母找人名反应
  .sort((a, b) => displayTitle(a).localeCompare(displayTitle(b), 'en'))

/** 反应类型（顺序即首页筛选条的显示顺序） */
export const CATEGORIES = [
  'C–C 单键',
  'C=C 构建',
  'C–杂键构建',
  '重排',
  '氧化',
  '还原',
  '偶联',
  '周环',
] as const

export function getReaction(id: string): Reaction | undefined {
  return reactions.find((r) => r.id === id)
}

/** 按 id 批量取，顺序按传入顺序，忽略不存在的 id */
export function getReactions(ids: string[]): Reaction[] {
  return ids.map(getReaction).filter((r): r is Reaction => Boolean(r))
}
