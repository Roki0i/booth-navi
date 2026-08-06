import type { Booth, PaymentMethod, SourceMedia, WorkCategory } from '../types/booth'

export const WORK_CATEGORIES: ReadonlyArray<{ value: WorkCategory; label: string }> = [
  { value: 'original', label: 'オリジナル' },
  { value: 'derivative', label: '二次創作' },
  { value: 'review', label: '評論・情報' },
  { value: 'other', label: 'その他' },
]

export const SOURCE_MEDIA: ReadonlyArray<{ value: SourceMedia; label: string }> = [
  { value: 'anime', label: 'アニメ' },
  { value: 'manga', label: '漫画' },
  { value: 'game', label: 'ゲーム' },
  { value: 'novel', label: '小説' },
  { value: 'vtuber', label: 'VTuber' },
  { value: 'tokusatsu', label: '特撮' },
  { value: 'other', label: 'その他' },
]

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  '現金', '交通系IC', 'クレジットカード', 'QR決済', '電子マネー', 'その他',
]

const workCategoryValues = new Set(WORK_CATEGORIES.map(({ value }) => value))
const sourceMediaValues = new Set(SOURCE_MEDIA.map(({ value }) => value))
const paymentMethodValues = new Set<string>(PAYMENT_METHODS)

export const workCategoryLabel = (value: WorkCategory): string =>
  WORK_CATEGORIES.find((candidate) => candidate.value === value)?.label ?? 'オリジナル'

export const sourceMediaLabel = (value: SourceMedia | null): string =>
  SOURCE_MEDIA.find((candidate) => candidate.value === value)?.label ?? ''

export function normalizePaymentMethods(value: unknown): PaymentMethod[] {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[|,、/／]+/)
      : []
  return [...new Set(candidates
    .filter((candidate): candidate is string => typeof candidate === 'string')
    .map((candidate) => candidate.trim())
    .filter((candidate): candidate is PaymentMethod => paymentMethodValues.has(candidate)))]
}

export function togglePaymentMethod(current: PaymentMethod[], method: PaymentMethod): PaymentMethod[] {
  return current.includes(method) ? current.filter((candidate) => candidate !== method) : [...current, method]
}

export function normalizeBooth(booth: Booth | Record<string, unknown>): Booth {
  const value = booth as Booth
  return {
    ...value,
    workCategory: workCategoryValues.has(value.workCategory) ? value.workCategory : 'original',
    sourceMedia: sourceMediaValues.has(value.sourceMedia as SourceMedia) ? value.sourceMedia : null,
    sourceTitle: typeof value.sourceTitle === 'string' ? value.sourceTitle : '',
    paymentMethods: normalizePaymentMethods(value.paymentMethods),
    paymentMethodOther: typeof value.paymentMethodOther === 'string' ? value.paymentMethodOther : '',
  }
}

export function shouldShowSourceFields(category: WorkCategory): boolean {
  return category !== 'original'
}
