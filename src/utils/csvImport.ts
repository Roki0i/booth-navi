import type { Booth } from '../types/booth'
import { clampBooth } from './geometry'
import { findDuplicateBoothNumbers } from './eventValidation'

export const CSV_HEADERS = ['boothNumber', 'circleName', 'area', 'genre', 'description', 'x', 'y', 'width', 'height', 'xUrl', 'shopUrl'] as const

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
  if (!records.length) return { booths: [], errors: ['CSVが空です。'], missingHeaders: [...CSV_HEADERS], duplicates: [] }
  const headers = records[0].map((header) => header.trim())
  const missingHeaders = CSV_HEADERS.filter((header) => !headers.includes(header))
  if (missingHeaders.length) return { booths: [], errors: [], missingHeaders, duplicates: [] }
  const value = (row: string[], name: string) => row[headers.indexOf(name)]?.trim() ?? ''
  const booths: Booth[] = []
  const errors: string[] = []
  records.slice(1).forEach((row, rowIndex) => {
    const boothNumber = value(row, 'boothNumber')
    const circleName = value(row, 'circleName')
    const numbers = ['x', 'y', 'width', 'height'].map((name) => Number(value(row, name)))
    if (!boothNumber || !circleName || numbers.some((number) => !Number.isFinite(number))) {
      errors.push(`${rowIndex + 2}行目: 必須項目または座標が不正です。`)
      return
    }
    booths.push(clampBooth({
      id: crypto.randomUUID(),
      boothNumber,
      circleName,
      area: value(row, 'area'),
      genre: value(row, 'genre'),
      description: value(row, 'description'),
      x: numbers[0], y: numbers[1], width: numbers[2], height: numbers[3],
      xUrl: value(row, 'xUrl'),
      shopUrl: value(row, 'shopUrl'),
      paymentMethods: ['現金'],
      items: [],
    }))
  })
  return { booths, errors, missingHeaders, duplicates: findDuplicateBoothNumbers(booths) }
}

export function createCsvTemplate(): string {
  return `${CSV_HEADERS.join(',')}\nA01,サンプル出展者,A,イラスト,紹介文,10,20,8,5,https://x.com/,https://example.com/`
}
