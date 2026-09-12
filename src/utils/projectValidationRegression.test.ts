import { describe, expect, it } from 'vitest'
import { createSampleEvent } from '../data/sampleEvents'
import { createBlankProject } from '../hooks/useEventProjects'
import { loadProjects, saveProjects } from '../storage/eventStorage'
import { validateProject } from './eventValidation'
import { importProject } from './projectImportExport'

const invalidCases: [string, unknown][] = [
  ['assets', undefined], ['assets', null], ['assets', []],
  ['assets.logoImage', { id: 1, alt: '' }], ['assets.heroImage', { id: 'image' }],
  ['assets.pageBackgroundImage', 'image'], ['assets.mapImage', null],
  ['map', []], ['theme', []], ['description', {}], ['schemaVersion', 1.5],
  ...['width', 'height', 'gridSize'].flatMap((field): [string, unknown][] =>
    [undefined, null, '100', 0, -1, Infinity, NaN].map((value) => [`map.${field}`, value])),
  ['map.showGrid', 'false'], ['map.backgroundImage', {}],
  ...['primaryColor', 'backgroundColor', 'surfaceColor', 'textColor', 'mutedTextColor'].flatMap((field): [string, unknown][] =>
    [undefined, null, 123, 'invalid'].map((value) => [`theme.${field}`, value])),
  ...['mapBackgroundColor', 'mapSurfaceColor', 'mapTextColor'].flatMap((field): [string, unknown][] =>
    [null, 123, 'invalid'].map((value) => [`theme.${field}`, value])),
  ['theme.fontStyle', undefined], ['theme.fontStyle', 'invalid'], ['theme.mapStyle', 'invalid'], ['theme.mapStyle', null],
  ...['id', 'boothNumber', 'circleName', 'area', 'genre', 'description', 'xUrl', 'shopUrl'].flatMap((field): [string, unknown][] =>
    [undefined, null, 123, {}].map((value) => [`booths.0.${field}`, value])),
  ['booths.0.id', ' '], ['booths.0.menuImage', {}],
  ['booths.0.items', undefined], ['booths.0.items', {}], ['booths.0.items', null], ['booths.0.items.0', null],
  ...['id', 'name', 'description'].flatMap((field): [string, unknown][] =>
    [undefined, null, 123].map((value) => [`booths.0.items.0.${field}`, value])),
  ['booths.0.items.0.id', ''], ['booths.0.items.0.type', 'invalid'],
  ...[undefined, null, '100', -1, Infinity, NaN].map((value): [string, unknown] => ['booths.0.items.0.price', value]),
]

function withInvalidField(path: string, value: unknown) {
  const project = createSampleEvent()
  const keys = path.split('.')
  let target = project as unknown as Record<string, unknown>
  for (const key of keys.slice(0, -1)) target = target[key] as Record<string, unknown>
  target[keys[keys.length - 1]] = value
  return project
}

function storageWith(value: unknown) {
  let text = JSON.stringify(value)
  return { getItem: () => text, setItem: (_key: string, value: string) => { text = value } }
}

describe('H3: 取り込みと復元の境界検証', () => {
  it.each(invalidCases)('%s = %j を両経路で拒否する', (path, value) => {
    const project = withInvalidField(path, value)
    expect(validateProject(project).valid).toBe(false)
    const imported = importProject(JSON.stringify(project))
    expect(imported.project).toBeUndefined()
    expect(imported.errors.length).toBeGreaterThan(0)
    expect(loadProjects(storageWith([project]))).toEqual([])
  })

  it.each(['booth', 'item'])('%s IDの重複を拒否する', (kind) => {
    const project = createSampleEvent()
    if (kind === 'booth') project.booths[1].id = project.booths[0].id
    else project.booths[0].items.push({ ...project.booths[0].items[0] })
    expect(importProject(JSON.stringify(project)).project).toBeUndefined()
    expect(loadProjects(storageWith([project]))).toEqual([])
  })

  it('壊れたイベントが混在していても正常なイベントを復元する', () => {
    const good = createSampleEvent('good')
    expect(loadProjects(storageWith([null, withInvalidField('assets', null), good]))).toEqual([good])
  })

  it('正常データ、空の入力欄、価格0、空の商品配列を保持する', () => {
    const project = createBlankProject()
    const booth = createSampleEvent().booths[0]
    project.booths = [{ ...booth, circleName: '', boothNumber: '', items: [{ ...booth.items[0], name: '', description: '', price: 0 }] }, { ...booth, id: 'empty-items', items: [] }]
    const storage = storageWith([])
    saveProjects([project], storage)
    expect(storage.getItem()).toBe(JSON.stringify([project]))
    expect(loadProjects(storage)).toEqual([project])
    expect(importProject(JSON.stringify(project)).project).toEqual(project)
  })

  it('別ブースの商品IDは独立して扱い、正常な画像参照も保持する', () => {
    const project = createSampleEvent()
    project.booths[1].items[0].id = project.booths[0].items[0].id
    project.assets.logoImage = { id: 'logo', alt: '' }
    project.map.backgroundImage = { id: 'map', alt: '会場図' }
    project.booths[0].menuImage = { id: 'menu', alt: 'お品書き' }
    const original = structuredClone(project)
    expect(validateProject(project).project).toEqual(original)
    expect(project).toEqual(original)
    expect(importProject(JSON.stringify(project)).project).toEqual(original)
    expect(loadProjects(storageWith([project]))).toEqual([original])
  })

  it('構文エラーと配列でない保存データを安全に拒否する', () => {
    expect(loadProjects({ getItem: () => '{bad', setItem: () => {} })).toEqual([])
    expect(loadProjects(storageWith({}))).toEqual([])
  })

  it('旧形式の補完結果が両経路で一致する', () => {
    const project = createSampleEvent()
    project.schemaVersion = 1
    const legacy = project.booths[0] as unknown as Record<string, unknown>
    legacy.paymentMethods = '現金|交通系IC'
    for (const field of ['workCategory', 'sourceMedia', 'sourceTitle', 'paymentMethodOther']) delete legacy[field]
    for (const field of ['mapBackgroundColor', 'mapSurfaceColor', 'mapTextColor', 'mapStyle']) delete (project.theme as unknown as Record<string, unknown>)[field]
    const imported = importProject(JSON.stringify(project)).project
    expect(imported).toBeDefined()
    expect(loadProjects(storageWith([project]))).toEqual([imported])
  })
})
