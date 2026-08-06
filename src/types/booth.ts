export type Area = 'A' | 'B' | 'C' | 'D'

export type ItemType = '新刊' | '既刊' | 'グッズ'

export interface DistributionItem {
  id: string
  name: string
  price: number
  type: ItemType
  description: string
}

export interface Booth {
  id: string
  boothNumber: string
  circleName: string
  area: Area
  genre: string
  description: string
  x: number
  y: number
  width: number
  height: number
  items: DistributionItem[]
  paymentMethods: string[]
  xUrl: string
  shopUrl: string
}
