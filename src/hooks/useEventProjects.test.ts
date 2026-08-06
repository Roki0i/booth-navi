import { describe, expect, it, vi } from 'vitest'
import { createSampleEvent } from '../data/sampleEvents'
import { duplicateProject, removeProject, selectProject } from './useEventProjects'
import { loadLastProjectId, loadProjects, saveLastProjectId, saveProjects, type StorageLike } from '../storage/eventStorage'

function memoryStorage(): StorageLike {
  const values = new Map<string, string>()
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value) } }
}

describe('イベント管理', () => {
  it('イベントを複製する', () => {
    vi.stubGlobal('crypto', { randomUUID: () => `id-${Math.random()}` })
    const original = createSampleEvent()
    const copy = duplicateProject(original)
    expect(copy.id).not.toBe(original.id)
    expect(copy.booths).toHaveLength(original.booths.length)
  })
  it('イベントを削除する', () => {
    const projects = [createSampleEvent('one'), createSampleEvent('two')]
    expect(removeProject(projects, 'one').map((project) => project.id)).toEqual(['two'])
  })
  it('イベントを切り替える', () => {
    const projects = [createSampleEvent('one'), createSampleEvent('two')]
    expect(selectProject(projects, 'two')?.id).toBe('two')
  })
  it('保存したイベントと最後のIDを復元する', () => {
    const storage = memoryStorage(), project = createSampleEvent('saved')
    saveProjects([project], storage); saveLastProjectId(project.id, storage)
    expect(loadProjects(storage)[0].name).toBe(project.name)
    expect(loadLastProjectId(storage)).toBe('saved')
  })
  it('古い保存データへマップテーマを補完する', () => {
    const storage = memoryStorage(), project = createSampleEvent('legacy')
    delete (project.theme as Partial<typeof project.theme>).mapStyle
    storage.setItem('booth-navi:event-projects', JSON.stringify([project]))
    expect(loadProjects(storage)[0].theme.mapStyle).toBe('light')
  })
  it('お気に入り用保存キーをイベントごとに分離できる', () => {
    const storage = memoryStorage()
    storage.setItem('booth-navi:event-a:favorites', '["a01"]')
    storage.setItem('booth-navi:event-b:favorites', '["b27"]')
    expect(storage.getItem('booth-navi:event-a:favorites')).not.toBe(storage.getItem('booth-navi:event-b:favorites'))
  })
})
