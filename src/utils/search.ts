import type { Booth } from '../types/booth'
import { sourceMediaLabel, workCategoryLabel } from './boothMetadata'

export function toHalfWidth(value: string): string {
  return value
    .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, ' ')
}

export function normalizeBoothNumber(value: string): string {
  return toHalfWidth(value).toUpperCase().replace(/[\s\-‐‑‒–—―ー]+/g, '')
}

export function normalizeText(value: string): string {
  return toHalfWidth(value)
    .toLocaleLowerCase('ja')
    .replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/\s+/g, '')
}

export function searchBooths(allBooths: Booth[], query: string): Booth[] {
  const terms = toHalfWidth(query).trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  return allBooths.filter((booth) => {
    const boothNumber = normalizeBoothNumber(booth.boothNumber)
    const searchableText = [
      booth.circleName,
      booth.genre,
      workCategoryLabel(booth.workCategory),
      sourceMediaLabel(booth.sourceMedia),
      booth.sourceTitle,
      ...booth.paymentMethods,
      booth.paymentMethodOther,
      ...booth.items.map((item) => item.name),
    ].map(normalizeText)

    return terms.every((term) => {
      const normalizedTerm = normalizeText(term)
      return (
        boothNumber.includes(normalizeBoothNumber(term)) ||
        searchableText.some((value) => value.includes(normalizedTerm))
      )
    })
  })
}

export function sortByBoothNumber(allBooths: Booth[]): Booth[] {
  return [...allBooths].sort((a, b) =>
    normalizeBoothNumber(a.boothNumber).localeCompare(
      normalizeBoothNumber(b.boothNumber),
      'en',
      { numeric: true },
    ),
  )
}
