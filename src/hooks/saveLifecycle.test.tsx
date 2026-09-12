// @vitest-environment jsdom
import { act, StrictMode, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { useEventProjects } from './useEventProjects'
import { usePersistentSet } from './usePersistentSet'
import { createSampleEvent } from '../data/sampleEvents'
import { PROJECTS_KEY, LAST_PROJECT_KEY } from '../storage/eventStorage'

let manager: ReturnType<typeof useEventProjects>
let favorites: ReturnType<typeof usePersistentSet>
let root: Root
let values: Map<string, string>
let write: ReturnType<typeof vi.fn>
function Harness() {
  const events = useEventProjects()
  const savedFavorites = usePersistentSet(`favorites:${events.currentId}`)
  useLayoutEffect(() => { manager = events; favorites = savedFavorites })
  return null
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  values = new Map([[PROJECTS_KEY, JSON.stringify([createSampleEvent('one'), createSampleEvent('two')])]])
  write = vi.fn((key: string, value: string) => { values.set(key, value) })
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: write })
  root = createRoot(document.createElement('div'))
  act(() => root.render(<StrictMode><Harness /></StrictMode>))
})
afterEach(() => { act(() => root.unmount()); vi.useRealTimers(); vi.unstubAllGlobals() })
const edit = (name: string) => act(() => manager.updateCurrent((p) => ({ ...p, name })))
const savedName = () => JSON.parse(values.get(PROJECTS_KEY)!)[0].name
it('debounceは連続編集の最後だけを保存する', () => {
  write.mockClear()
  edit('first'); act(() => { vi.advanceTimersByTime(200) }); edit('last')
  expect(write).not.toHaveBeenCalled()
  act(() => { vi.advanceTimersByTime(250) })
  expect(savedName()).toBe('last')
  expect(manager.saveStatus).toBe('saved')
})
it.each(['pagehide', 'beforeunload', 'hidden', 'unmount'])('%sで最後の変更を同期保存する', (event) => {
  edit('last')
  act(() => {
    if (event === 'unmount') root.unmount()
    else if (event === 'hidden') {
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
      vi.restoreAllMocks()
    } else window.dispatchEvent(new Event(event))
  })
  expect(savedName()).toBe('last')
})
it('失敗時は既存データを保持し、終了通知で再試行できる', () => {
  const previous = values.get(PROJECTS_KEY)
  edit('retry')
  write.mockImplementationOnce(() => { throw new Error('quota') })
  act(() => { vi.advanceTimersByTime(250) })
  expect(manager.saveStatus).toBe('error')
  expect(values.get(PROJECTS_KEY)).toBe(previous)
  act(() => { window.dispatchEvent(new Event('pagehide')) })
  expect(savedName()).toBe('retry')
  expect(manager.saveStatus).toBe('saved')
})
it('最後に開いたイベントの保存失敗を成功と表示しない', () => {
  act(() => manager.setCurrentId('two'))
  write.mockImplementation((key: string, value: string) => {
    if (key === LAST_PROJECT_KEY) throw new Error('quota')
    values.set(key, value)
  })
  act(() => { vi.advanceTimersByTime(250) })
  expect(manager.saveStatus).toBe('error')
  expect(JSON.parse(values.get(PROJECTS_KEY)!)).toHaveLength(2)
})
it('お気に入り保存失敗は保存済み状態を保持して検知できる', () => {
  act(() => favorites.toggle('a'))
  write.mockImplementationOnce(() => { throw new Error('quota') })
  act(() => favorites.toggle('b'))
  expect(values.get('favorites:one')).toBe('["a"]')
  expect(favorites.ids).toEqual(['a'])
  expect('saveStatus' in favorites && favorites.saveStatus).toBe('error')
  act(() => favorites.toggle('b'))
  expect(favorites.ids).toEqual(['a', 'b'])
  expect('saveStatus' in favorites && favorites.saveStatus).toBe('saved')
})
it('お気に入りの連続操作とイベント切り替えで保存先を混同しない', () => {
  act(() => { favorites.toggle('a'); favorites.toggle('b') })
  expect(values.get('favorites:one')).toBe('["a","b"]')
  act(() => manager.setCurrentId('two'))
  act(() => favorites.toggle('c'))
  expect(values.get('favorites:two')).toBe('["c"]')
})
