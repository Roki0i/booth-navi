import type { ImageReference } from '../types/booth'
import type { EventProject } from '../types/event'
import { deleteImage, getImage, putImage } from '../storage/imageStorage'
import { validateProject } from './eventValidation'
import { importProject } from './projectImportExport'

const FORMAT = 'booth-navi-images'
const FORMAT_VERSION = 1
const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const MAX_TOTAL_IMAGE_BYTES = 64 * 1024 * 1024
export const MAX_BACKUP_FILE_BYTES = 96 * 1024 * 1024
const TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export type BackupImage = { type: string; data: string }
export type ParsedProjectDocument = {
  project?: EventProject
  images?: Record<string, BackupImage>
  errors: string[]
}

function imageReferences(project: EventProject): ImageReference[] {
  const refs = [
    project.assets.logoImage, project.assets.heroImage,
    project.assets.pageBackgroundImage, project.assets.mapImage,
    project.map.backgroundImage, ...project.booths.map(booth => booth.menuImage),
  ].filter((ref): ref is ImageReference => !!ref)
  return [...new Map(refs.map(ref => [ref.id, ref])).values()]
}

function encode(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 32768) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 32768))
  }
  return btoa(binary)
}

function decode(entry: BackupImage): Blob {
  if (!entry || !TYPES.has(entry.type) || typeof entry.data !== 'string'
    || !entry.data.length || entry.data.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 4
    || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(entry.data)) {
    throw new Error('画像データの形式またはサイズが不正です。')
  }
  const binary = atob(entry.data)
  if (!binary.length || binary.length > MAX_IMAGE_BYTES) throw new Error('画像が20MBを超えています。')
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
  const png = bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
  const jpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  const webp = bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP'
  if (!(entry.type === 'image/png' && png || entry.type === 'image/jpeg' && jpeg
    || entry.type === 'image/webp' && webp)) throw new Error('画像の実際の形式が一致しません。')
  return new Blob([bytes], { type: entry.type })
}

/** A self-contained, image-inclusive JSON; missing source blobs abort export. */
export async function exportProjectBackup(project: EventProject): Promise<string> {
  const images: Record<string, BackupImage> = Object.create(null)
  let total = 0
  for (const ref of imageReferences(project)) {
    const blob = await getImage(ref.id)
    if (!blob) throw new Error('画像が見つかりません: ' + ref.id)
    if (!TYPES.has(blob.type) || !blob.size || blob.size > MAX_IMAGE_BYTES)
      throw new Error('画像の種類またはサイズが対応範囲外です: ' + ref.id)
    total += blob.size
    if (total > MAX_TOTAL_IMAGE_BYTES) throw new Error('画像の合計が64MBを超えています。')
    images[ref.id] = { type: blob.type, data: encode(new Uint8Array(await blob.arrayBuffer())) }
  }
  return JSON.stringify({ backupFormat: FORMAT, backupVersion: FORMAT_VERSION, project, images })
}

/** Accept both existing metadata-only JSON and the new portable image backup. */
export function parseProjectDocument(text: string): ParsedProjectDocument {
  if (text.length > MAX_BACKUP_FILE_BYTES) return { errors: ['ファイルが96MBを超えています。'] }
  let raw: unknown
  try { raw = JSON.parse(text) } catch { return { errors: ['JSONの構文が不正です。'] } }
  if (!raw || typeof raw !== 'object' || !('backupFormat' in raw)) return importProject(text)
  const data = raw as Record<string, unknown>
  if (data.backupFormat !== FORMAT || data.backupVersion !== FORMAT_VERSION)
    return { errors: ['対応していない画像付きバックアップ形式です。'] }
  const parsed = validateProject(data.project)
  if (!parsed.valid || !parsed.project) return { errors: parsed.errors }
  if (!data.images || typeof data.images !== 'object' || Array.isArray(data.images))
    return { errors: ['画像データが不正です。'] }
  const entries = data.images as Record<string, BackupImage>
  const refs = imageReferences(parsed.project)
  if (Object.keys(entries).length !== refs.length || refs.some(ref => !Object.hasOwn(entries, ref.id)))
    return { errors: ['画像の参照とバックアップ内容が一致しません。'] }
  try {
    let total = 0
    for (const ref of refs) {
      total += decode(entries[ref.id]).size
      if (total > MAX_TOTAL_IMAGE_BYTES) throw new Error('画像の合計が64MBを超えています。')
    }
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : '画像データが不正です。'] }
  }
  return { project: parsed.project, images: entries, errors: [] }
}

/** Save new image IDs so importing cannot overwrite blobs from another event. */
export async function restoreProjectBackup(
  project: EventProject, images?: Record<string, BackupImage>,
): Promise<EventProject> {
  if (!images) return project
  const copy = structuredClone(project)
  const ids = new Map<string, string>()
  const written: string[] = []
  try {
    for (const ref of imageReferences(project)) {
      if (!Object.hasOwn(images, ref.id)) throw new Error('バックアップに画像がありません: ' + ref.id)
      const id = crypto.randomUUID()
      await putImage(id, decode(images[ref.id]))
      ids.set(ref.id, id)
      written.push(id)
    }
    const remap = (ref?: ImageReference) => ref ? { ...ref, id: ids.get(ref.id)! } : undefined
    for (const key of ['logoImage', 'heroImage', 'pageBackgroundImage', 'mapImage'] as const)
      copy.assets[key] = remap(copy.assets[key])
    copy.map.backgroundImage = remap(copy.map.backgroundImage)
    copy.booths.forEach(booth => { booth.menuImage = remap(booth.menuImage) })
    return copy
  } catch (error) {
    await Promise.allSettled(written.map(id => deleteImage(id)))
    throw error
  }
}
