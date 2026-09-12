// @vitest-environment jsdom
import { act, useLayoutEffect, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EventEditor } from './EventEditor'
import type { MapEditor } from './MapEditor'
import { useEventProjects } from '../../hooks/useEventProjects'
import { createSampleEvent } from '../../data/sampleEvents'
import { saveProjects } from '../../storage/eventStorage'
import { getImage, putImage } from '../../storage/imageStorage'
import type { EventAssets } from '../../types/event'

// IndexedDB境界のみをメモリ化し、削除されたBlobは再取得できなくする。
const blobs = vi.hoisted(() => new Map<string, Blob>())
vi.mock('../../storage/imageStorage', () => ({
  putImage: vi.fn(async (id: string, blob: Blob) => { blobs.set(id, blob) }),
  getImage: vi.fn(async (id: string) => blobs.get(id)),
  deleteImage: vi.fn(async (id: string) => { blobs.delete(id) }),
}))
let editor: ComponentProps<typeof MapEditor>
vi.mock('./MapEditor', () => ({
  MapEditor: (props: ComponentProps<typeof MapEditor>) => { editor = props; return null },
}))
let manager: ReturnType<typeof useEventProjects>
function Harness() {
  const state = useEventProjects()
  useLayoutEffect(() => { manager = state })
  return <EventEditor key={state.current.id} project={state.current} onChange={state.updateCurrent} onAddProject={state.add} />
}

const fields: [keyof EventAssets, string][] = [
  ['logoImage', 'イベントロゴ'], ['heroImage', 'メインビジュアル'],
  ['pageBackgroundImage', 'ページ背景画像'], ['mapImage', '会場マップ画像'],
]

describe('H2: 複製間の画像削除', () => {
  let root: Root
  let container: HTMLDivElement
  let blob: Blob
  const reference = { id: 'shared-image', alt: '共有画像' }

  async function click(label: string, scope: ParentNode = container) {
    const button = [...scope.querySelectorAll('button')].find((button) => button.textContent === label)
    expect(button).toBeDefined()
    await act(async () => button!.click())
  }
  async function removeImage(label: string) {
    const uploader = [...container.querySelectorAll('.image-uploader')].find((element) => element.querySelector('strong')?.textContent === label)
    expect(uploader).toBeDefined()
    await click('画像を削除', uploader!)
    expect(uploader!.querySelector('img')).toBeNull()
  }
  function expectVisible(label: string) {
    const uploader = [...container.querySelectorAll('.image-uploader')].find((element) => element.querySelector('strong')?.textContent === label)
    expect(uploader?.querySelector('img')?.getAttribute('src')).toBe('blob:shared-image')
  }

  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value) } })
    vi.stubGlobal('confirm', () => true)
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:shared-image', revokeObjectURL: vi.fn() })
    blobs.clear()
    blob = new Blob(['image'], { type: 'image/png' })
    await putImage(reference.id, blob)
    const project = createSampleEvent('original')
    project.assets = Object.fromEntries(fields.map(([key]) => [key, { ...reference }]))
    project.map.backgroundImage = { ...reference }
    project.booths = [{ ...project.booths[0], menuImage: { ...reference } }]
    saveProjects([project])
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    await act(async () => root.render(<Harness />))
  })
  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  describe.each(['複製先', '複製元'])('%sから削除', (side) => {
    it.each(fields)('イベントの%sを削除しても他方で再表示できる', async (field, label) => {
      await act(async () => manager.duplicate())
      const copyId = manager.current.id
      const targetId = side === '複製先' ? copyId : 'original'
      const otherId = side === '複製先' ? 'original' : copyId
      await act(async () => manager.setCurrentId(targetId))
      await click('画像')
      await removeImage(label)
      expect(manager.current.assets[field]).toBeUndefined()
      if (field === 'mapImage') expect(manager.current.map.backgroundImage).toBeUndefined()
      expect(await getImage(reference.id)).toBe(blob)
      await act(async () => manager.setCurrentId(otherId))
      await click('画像')
      expect(manager.current.assets[field]).toEqual(reference)
      if (field === 'mapImage') expect(manager.current.map.backgroundImage).toEqual(reference)
      expectVisible(label)
      // 参照を外したイベント自体を削除しても、残ったイベントの画像を保つ。
      await act(async () => manager.remove(targetId))
      expect(manager.projects.map((project) => project.id)).toEqual([otherId])
      expect(await getImage(reference.id)).toBe(blob)
    })

    it('ブースのお品書き削除は他方へ影響せず、Undo/Redoとブース削除後のUndoでも復元できる', async () => {
      const originalId = manager.current.booths[0].id
      await act(async () => editor.onSelect(originalId))
      await act(async () => editor.onDuplicate())
      const copyId = manager.current.booths[1].id
      const targetId = side === '複製先' ? copyId : originalId
      const otherId = side === '複製先' ? originalId : copyId
      await act(async () => editor.onSelect(targetId))
      await removeImage('ブースのお品書き')
      expect(manager.current.booths.find((booth) => booth.id === targetId)?.menuImage).toBeUndefined()
      expect(manager.current.booths.find((booth) => booth.id === otherId)?.menuImage).toEqual(reference)
      expect(await getImage(reference.id)).toBe(blob)
      await act(async () => editor.onUndo())
      expectVisible('ブースのお品書き')
      await act(async () => editor.onRedo())
      expect(manager.current.booths.find((booth) => booth.id === targetId)?.menuImage).toBeUndefined()
      await act(async () => editor.onSelect(otherId))
      expectVisible('ブースのお品書き')
      await act(async () => editor.onDelete())
      await act(async () => editor.onUndo())
      await act(async () => editor.onSelect(otherId))
      expectVisible('ブースのお品書き')
      expect(await getImage(reference.id)).toBe(blob)
    })
  })
})
