import { describe, expect, it } from 'vitest'
import { createSampleEvent } from '../data/sampleEvents'
import { exportProject, importProject, projectFileName } from './projectImportExport'

describe('JSON入出力', () => {
  it('正常なJSONを読み込む', () => expect(importProject(exportProject(createSampleEvent())).errors).toEqual([]))
  it('不正JSONを拒否する', () => expect(importProject('{bad').errors).not.toHaveLength(0))
  it('エクスポート後に再インポートできる', () => {
    const source = createSampleEvent()
    expect(importProject(exportProject(source)).project?.booths).toHaveLength(24)
  })
  it('イベント名から安全なファイル名を作る', () => expect(projectFileName('My/Event')).toBe('My-Event.json'))
  it('旧JSONの支払い方法と不足項目を新形式へ移行する', () => {
    const legacy = createSampleEvent()
    legacy.schemaVersion = 1
    const booth = legacy.booths[0] as unknown as Record<string, unknown>
    booth.paymentMethods = '現金|交通系IC'
    delete booth.workCategory
    delete booth.sourceMedia
    delete booth.sourceTitle
    const migrated = importProject(JSON.stringify(legacy)).project
    expect(migrated?.schemaVersion).toBe(2)
    expect(migrated?.booths[0]).toMatchObject({
      workCategory: 'original',
      sourceMedia: null,
      sourceTitle: '',
      paymentMethods: ['現金', '交通系IC'],
    })
  })
})
