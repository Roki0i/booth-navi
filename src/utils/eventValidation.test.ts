import { describe, expect, it } from 'vitest'
import { createSampleEvent } from '../data/sampleEvents'
import { findDuplicateBoothNumbers, themeToCssVariables, validateProject } from './eventValidation'

describe('EventProject', () => {
  it('サンプルEventProjectを作成できる', () => {
    const project = createSampleEvent()
    expect(project.schemaVersion).toBe(1)
    expect(project.booths).toHaveLength(24)
  })
  it('テーマからCSS変数を生成し、不正色は除外する', () => {
    const theme = { ...createSampleEvent().theme, primaryColor: '#123456', backgroundColor: 'invalid' }
    expect(themeToCssVariables(theme)).toMatchObject({ '--event-primary': '#123456' })
    expect(themeToCssVariables(theme)).toMatchObject({ '--event-map-background': '#ece9df' })
    expect(themeToCssVariables(theme)).not.toHaveProperty('--event-background')
  })
  it('既存イベントへマップテーマの初期値を補完する', () => {
    const project = createSampleEvent()
    delete (project.theme as Partial<typeof project.theme>).mapStyle
    delete (project.theme as Partial<typeof project.theme>).mapBackgroundColor
    const result = validateProject(project)
    expect(result.project?.theme.mapStyle).toBe('light')
    expect(result.project?.theme.mapBackgroundColor).toBe('#ece9df')
  })
  it('ブース番号重複を検出する', () => {
    const booth = createSampleEvent().booths[0]
    expect(findDuplicateBoothNumbers([booth, { ...booth, id: 'other', boothNumber: 'a01' }])).toEqual(['A01'])
  })
  it('必須項目不足を拒否する', () => {
    expect(validateProject({ schemaVersion: 1 }).valid).toBe(false)
  })
})
