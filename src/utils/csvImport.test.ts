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
    const csv = `${createCsvTemplate().split('\n')[0]}\nA01,"サンプル,工房",A,test,test,original,,,現金,1,2,3,4,,`
    expect(parseBoothCsv(csv).booths[0].circleName).toBe('サンプル,工房')
  })
  it('複数の支払い方法を解析できる', () => {
    expect(parseBoothCsv(createCsvTemplate()).booths[0].paymentMethods).toEqual(['現金', '交通系IC', 'QR決済'])
  })
  it('新しい列がない旧CSVも初期値を補完して読み込める', () => {
    const legacy = 'boothNumber,circleName,area,genre,description,x,y,width,height,xUrl,shopUrl\nA01,旧工房,A,創作,紹介,1,2,3,4,,'
    expect(parseBoothCsv(legacy).booths[0]).toMatchObject({
      workCategory: 'original',
      sourceMedia: null,
      sourceTitle: '',
      paymentMethods: [],
    })
  })
  it('未対応の支払い方法をエラーにする', () => {
    const csv = createCsvTemplate().replace('現金|交通系IC|QR決済', '現金|架空決済')
    expect(parseBoothCsv(csv).errors[0]).toContain('paymentMethods')
  })
})
