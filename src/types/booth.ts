export type Area = string

export type ItemType = '新刊' | '既刊' | 'グッズ'
export type WorkCategory = 'original' | 'derivative' | 'review' | 'other'
export type SourceMedia = 'anime' | 'manga' | 'game' | 'novel' | 'vtuber' | 'tokusatsu' | 'other'
export type PaymentMethod = '現金' | '交通系IC' | 'クレジットカード' | 'QR決済' | '電子マネー' | 'その他'

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
  workCategory: WorkCategory
  sourceMedia: SourceMedia | null
  sourceTitle: string
  paymentMethods: PaymentMethod[]
  paymentMethodOther: string
  xUrl: string
  shopUrl: string
  menuImage?: ImageReference
}

export interface ImageReference {
  id: string
  alt: string
}
