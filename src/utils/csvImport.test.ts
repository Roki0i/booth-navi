import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCsvTemplate, parseBoothCsv } from './csvImport'

describe('CSVインポート', () => {
  beforeEach(() => vi.stubGlobal('crypto', { randomUUID: () => Math.random().toString(36) }))
  it('正常なCSVを読み込む', () => expect(parseBoothCsv(createCsvTemplate()).booths[0].boothNumber).toBe('A01'))
  it('必須ヘッダー不足を検出する', () => expect(parseBoothCsv('boothNumber,circleName\nA01,test').missingHeaders).toContain('x'))
  it('不正行を一覧にする', () => {
    const csv = `${createCsvTemplate().split('\n')[0]}\nA01,,A,test,test,x,2,3,4,,`
    expect(parseBoothCsv(csv).errors).toHaveLength(1)
  })
  it('引用符内のカンマを読める', () => {
    const csv = `${createCsvTemplate().split('\n')[0]}\nA01,"サンプル,工房",A,test,test,1,2,3,4,,`
    expect(parseBoothCsv(csv).booths[0].circleName).toBe('サンプル,工房')
  })
})
