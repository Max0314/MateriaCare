export type HerbCategory =
  | '补益'
  | '理气'
  | '清热'
  | '化湿'
  | '活血'
  | '化痰'
  | '解表'
  | '食养常用'

export type SourceType = 'standard' | 'regulatory' | 'image-reference' | 'literature'

export interface SourceRef {
  id: string
  name: string
  url: string
  type: SourceType
  trustLevel: '权威标准' | '监管查询' | '图像参考' | '医学文献'
  note: string
}

export interface Herb {
  id: string
  name: string
  aliases: string[]
  category: HerbCategory
  sourceSummary: string
  natureSummary: string
  useSummary: string
  cautions: string[]
  storage: string
  similarHerbs: string[]
  commonPairings: string[]
  sourceIds: string[]
  imageFocus: string
}

export interface DietSuggestion {
  id: string
  title: string
  herbIds: string[]
  scene: string
  ingredients: string[]
  steps: string[]
  caution: string
}

export interface CabinetItem {
  id: string
  herbId: string
  amount: string
  purchaseDate: string
  expiresAt: string
  note: string
}

export interface Reminder {
  id: string
  herbId: string
  title: string
  time: string
  cycle: string
  startDate: string
  endDate: string
  done: boolean
}
