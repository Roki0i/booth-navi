import { describe, expect, it } from 'vitest'
import { booths } from '../data/booths'
import { normalizeBoothNumber, searchBooths, sortByBoothNumber, toHalfWidth } from './search'

describe('ブース検索', () => {
  it('B27とB-27を同じ番号に正規化する', () => {
    expect(normalizeBoothNumber('B27')).toBe(normalizeBoothNumber('B-27'))
  })
  it('全角英数字を半角に正規化する', () => {
    expect(toHalfWidth('Ｂ－２７')).toBe('B-27')
    expect(normalizeBoothNumber('ｂ ２７')).toBe('B27')
  })
  it('大文字と小文字を区別せず検索できる', () => {
    expect(searchBooths(booths, 'b27').map((booth) => booth.boothNumber)).toContain('B27')
  })
  it('サークル名を部分一致で検索できる', () => {
    expect(searchBooths(booths, 'ドロップ').map((booth) => booth.circleName)).toContain('薄荷ドロップ')
  })
  it('「B27 薄荷」で対象ブースが一致する', () => {
    expect(searchBooths(booths, 'B27 薄荷').map((booth) => booth.circleName)).toContain('薄荷ドロップ')
  })
  it('「薄荷 B-27」でも一致する', () => {
    expect(searchBooths(booths, '薄荷 B-27').map((booth) => booth.circleName)).toContain('薄荷ドロップ')
  })
  it('全角スペース区切りでも一致する', () => {
    expect(searchBooths(booths, 'B27　薄荷').map((booth) => booth.circleName)).toContain('薄荷ドロップ')
  })
  it('検索語の順番を変えても同じ結果になる', () => {
    expect(searchBooths(booths, '創作漫画 B27')).toEqual(searchBooths(booths, 'B27 創作漫画'))
  })
  it('カタカナ入力でひらがなの名前が一致する', () => {
    expect(searchBooths(booths, 'マドロミ').map((booth) => booth.circleName)).toContain('まどろみ植物園')
  })
  it('ひらがな入力でカタカナの名前が一致する', () => {
    expect(searchBooths(booths, 'どろっぷ').map((booth) => booth.circleName)).toContain('薄荷ドロップ')
  })
  it('ジャンルとの複合検索ができる', () => {
    expect(searchBooths(booths, 'B27 創作漫画').map((booth) => booth.circleName)).toEqual(['薄荷ドロップ'])
  })
  it('頒布物名との複合検索ができる', () => {
    expect(searchBooths(booths, '薄荷 新作集').map((booth) => booth.circleName)).toEqual(['薄荷ドロップ'])
  })
  it('すべての検索語を満たさないブースは除外される', () => {
    expect(searchBooths(booths, '薄荷 創作小説')).toEqual([])
  })
  it('作品区分の日本語名で検索できる', () => {
    expect(searchBooths(booths, '二次創作').every((booth) => booth.workCategory === 'derivative')).toBe(true)
    expect(searchBooths(booths, '二次創作')).not.toHaveLength(0)
  })
  it('原作メディアで検索できる', () => {
    expect(searchBooths(booths, '漫画').some((booth) => booth.sourceMedia === 'manga')).toBe(true)
  })
  it('原作名で検索できる', () => {
    expect(searchBooths(booths, '月灯りの旅人').some((booth) => booth.sourceTitle === '月灯りの旅人')).toBe(true)
  })
  it('支払い方法で検索できる', () => {
    expect(searchBooths(booths, '交通系IC').every((booth) => booth.paymentMethods.includes('交通系IC'))).toBe(true)
  })
  it('ブース番号順に並べる', () => {
    const sorted = sortByBoothNumber([booths[8], booths[0], booths[7]])
    expect(sorted.map((booth) => booth.boothNumber)).toEqual(['A01', 'B26', 'B27'])
  })
})
