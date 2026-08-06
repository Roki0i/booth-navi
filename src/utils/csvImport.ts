import type { Booth } from '../types/booth'
import { clampBooth } from './geometry'
import { findDuplicateBoothNumbers } from './eventValidation'
import { normalizePaymentMethods, SOURCE_MEDIA, WORK_CATEGORIES } from './boothMetadata'
import type { SourceMedia, WorkCategory } from '../types/booth'

export const CSV_HEADERS = ['boothNumber', 'circleName', 'area', 'genre', 'description', 'workCategory', 'sourceMedia', 'sourceTitle', 'paymentMethods', 'x', 'y', 'width', 'height', 'xUrl', 'shopUrl'] as const
const REQUIRED_CSV_HEADERS = ['boothNumber', 'circleName', 'area', 'genre', 'description', 'x', 'y', 'width', 'height', 'xUrl', 'shopUrl'] as const

function parseRecords(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], field = '', quoted = false
  const source = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    if (quoted && char === '"' && source[i + 1] === '"') { field += '"'; i += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) { row.push(field); field = '' }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[i + 1] === '\n') i += 1
      row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = ''
    } else field += char
  }
  row.push(field); if (row.some(Boolean)) rows.push(row)
  return rows
}

export interface CsvResult {
  booths: Booth[]
  errors: string[]
  missingHeaders: string[]
  duplicates: string[]
}

export function parseBoothCsv(text: string): CsvResult {
  const records = parseRecords(text)
  if (!records.length) return { booths: [], errors: ['CSVが空です。'], missingHeaders: [...REQUIRED_CSV_HEADERS], duplicates: [] }
  const headers = records[0].map((header) => header.trim())
  const missingHeaders = REQUIRED_CSV_HEADERS.filter((header) => !headers.includes(header))
  if (missingHeaders.length) return { booths: [], errors: [], missingHeaders, duplicates: [] }
  const value = (row: string[], name: string) => row[headers.indexOf(name)]?.trim() ?? ''
  const booths: Booth[] = []
  const errors: string[] = []
  records.slice(1).forEach((row, rowIndex) => {
    const boothNumber = value(row, 'boothNumber')
    const circleName = value(row, 'circleName')
    const numbers = ['x', 'y', 'width', 'height'].map((name) => Number(value(row, name)))
    const workCategory = value(row, 'workCategory') || 'original'
    const sourceMedia = value(row, 'sourceMedia')
    const rawPaymentMethods = value(row, 'paymentMethods').split('|').map((method) => method.trim()).filter(Boolean)
    if (!boothNumber || !circleName || numbers.some((number) => !Number.isFinite(number))) {
      errors.push(`${rowIndex + 2}行目: 必須項目または座標が不正です。`)
      return
    }
    if (!WORK_CATEGORIES.some(({ value: candidate }) => candidate === workCategory)) {
      errors.push(`${rowIndex + 2}行目: workCategoryが不正です。`)
      return
    }
    if (sourceMedia && !SOURCE_MEDIA.some(({ value: candidate }) => candidate === sourceMedia)) {
      errors.push(`${rowIndex + 2}行目: sourceMediaが不正です。`)
      return
    }
    if (rawPaymentMethods.some((method) => !normalizePaymentMethods([method]).length)) {
      errors.push(`${rowIndex + 2}行目: paymentMethodsに未対応の値があります。`)
      return
    }
    booths.push(clampBooth({
      id: crypto.randomUUID(),
      boothNumber,
      circleName,
      area: value(row, 'area'),
      genre: value(row, 'genre'),
      description: value(row, 'description'),
      workCategory: workCategory as WorkCategory,
      sourceMedia: sourceMedia ? sourceMedia as SourceMedia : null,
      sourceTitle: value(row, 'sourceTitle'),
      x: numbers[0], y: numbers[1], width: numbers[2], height: numbers[3],
      xUrl: value(row, 'xUrl'),
      shopUrl: value(row, 'shopUrl'),
      paymentMethods: normalizePaymentMethods(rawPaymentMethods),
      paymentMethodOther: '',
      items: [],
    }))
  })
  return { booths, errors, missingHeaders, duplicates: findDuplicateBoothNumbers(booths) }
}

export function createCsvTemplate(): string {
  return `${CSV_HEADERS.join(',')}\nA01,サンプル出展者,A,イラスト,紹介文,derivative,manga,月灯り物語,現金|交通系IC|QR決済,10,20,8,5,https://x.com/,https://example.com/`
}
