/** 一个有机人名反应的完整数据模型（对应 Excel 模板的列） */
export type ReactionStatus = 'verified' | 'partial' | 'todo'

export type Reaction = {
  /** 英文小写 slug，全库唯一，同时作为图片文件名 */
  id: string
  name_zh: string
  name_en: string
  /** 卡片/详情页的大字标题：英文简名 + 中文后缀，如「Wittig 反应」 */
  title?: string
  /** 中文俗称 / 别名，搜索命中的关键 */
  aliases_zh: string[]
  /** 英文缩写 / 别名 */
  aliases_en: string[]
  /** 反应类型，见 CATEGORIES */
  category: string
  tags: string[]
  difficulty: number
  year?: number
  discoverer?: string
  overview: string

  /** 纯文本反应式，图片加载失败时兜底显示 */
  scheme_simple: string
  /** 箭头上方的条件 */
  scheme_above?: string
  /** 箭头下方的条件 */
  scheme_below?: string
  /** public/schemes/ 下的文件名（不含扩展名），没有则回退到纯文本 */
  scheme_image?: string

  substrates: string[]
  products: string[]
  catalyst?: string
  reagent?: string
  base?: string
  solvent?: string[]
  temp?: string
  time?: string
  atmosphere?: string

  mechanism_steps: string[]
  regio_selectivity?: string
  stereo_selectivity?: string
  selectivity_note?: string

  scope?: string
  limitations?: string
  examples: string[]
  pitfalls: string[]
  mnemonics?: string
  references: string[]

  status: ReactionStatus
  /** 需要核对的字段，界面上会显示「待核对」角标 */
  todo_fields?: string[]
}

export type QuizMark = 'know' | 'fuzzy' | 'unknown'
