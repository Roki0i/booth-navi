import { describe, expect, it, vi } from 'vitest'
import { createSampleEvent } from '../data/sampleEvents'
import {
  exportProjectBackup, parseProjectDocument, restoreProjectBackup,
} from './projectBackup'
import { exportProject } from './projectImportExport'

const blobs = vi.hoisted(() => new Map<string, Blob>())
vi.mock('../storage/imageStorage', () => ({
  getImage: vi.fn(async (id: string) => blobs.get(id)),
  putImage: vi.fn(async (id: string, blob: Blob) => { blobs.set(id, blob) }),
  deleteImage: vi.fn(async (id: string) => { blobs.delete(id) }),
}))

const png = () => new Blob([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], { type: 'image/png' })

describe('portable project image backup', () => {
  it('exports referenced images once and restores fresh IDs without touching originals', async () => {
    blobs.clear()
    const event = createSampleEvent()
    event.assets.logoImage = { id: 'logo-original', alt: 'ロゴ' }
    event.map.backgroundImage = { id: 'logo-original', alt: '会場図' }
    event.booths[0].menuImage = { id: 'logo-original', alt: 'お品書き' }
    blobs.set('logo-original', png())

    const text = await exportProjectBackup(event)
    const document = parseProjectDocument(text)
    expect(document.errors).toEqual([])
    expect(Object.keys(document.images ?? {})).toEqual(['logo-original'])
    const restored = await restoreProjectBackup(document.project!, document.images)
    const id = restored.assets.logoImage?.id
    expect(id).toBeTruthy()
    expect(id).not.toBe('logo-original')
    expect(restored.map.backgroundImage?.id).toBe(id)
    expect(restored.booths[0].menuImage?.id).toBe(id)
    expect(restored.assets.logoImage?.alt).toBe('ロゴ')
    expect(blobs.has('logo-original')).toBe(true)
    expect(blobs.get(id!)?.type).toBe('image/png')
  })

  it('rejects missing, forged or malformed images before showing import options', async () => {
    const event = createSampleEvent()
    event.assets.logoImage = { id: 'missing-image', alt: 'logo' }
    await expect(exportProjectBackup(event)).rejects.toThrow(/画像が見つかりません/)
    blobs.set('missing-image', png())
    const raw = JSON.parse(await exportProjectBackup(event))
    delete raw.images['missing-image']
    expect(parseProjectDocument(JSON.stringify(raw)).errors.join(' ')).toMatch(/一致しません/)
    raw.images['missing-image'] = { type: 'image/svg+xml', data: 'PHN2Zz4=' }
    expect(parseProjectDocument(JSON.stringify(raw)).errors.join(' ')).toMatch(/不正/)
    raw.images['missing-image'] = { type: 'image/png', data: 'PHN2Zz4=' }
    expect(parseProjectDocument(JSON.stringify(raw)).errors.join(' ')).toMatch(/一致しません/)
    raw.backupVersion = 2
    expect(parseProjectDocument(JSON.stringify(raw)).errors.join(' ')).toMatch(/対応していない/)
  })

  it('continues to accept existing metadata-only JSON without image blobs', () => {
    const original = createSampleEvent()
    const parsed = parseProjectDocument(exportProject(original))
    expect(parsed.errors).toEqual([])
    expect(parsed.project?.name).toBe(original.name)
    expect(parsed.images).toBeUndefined()
  })
})
