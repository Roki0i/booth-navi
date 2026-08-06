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
})
