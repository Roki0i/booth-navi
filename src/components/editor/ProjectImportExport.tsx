import { useState } from 'react'
import type { EventProject } from '../../types/event'
import { downloadText, exportProject, projectFileName } from '../../utils/projectImportExport'
import {
  MAX_BACKUP_FILE_BYTES, exportProjectBackup, parseProjectDocument, restoreProjectBackup,
  type ParsedProjectDocument,
} from '../../utils/projectBackup'

interface Props { project: EventProject; onOverwrite: (project: EventProject) => void; onAdd: (project: EventProject) => void }

export function ProjectImportExport({ project, onOverwrite, onAdd }: Props) {
  const [candidate, setCandidate] = useState<ParsedProjectDocument>()
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const saveWithImages = async () => {
    setBusy(true); setErrors([]); setNotice('')
    try {
      const backup = await exportProjectBackup(project)
      downloadText(backup, projectFileName(project.name).replace(/\.json$/, '-images.json'), 'application/json')
      setNotice('画像を含むバックアップを書き出しました。')
    } catch (error) {
      setErrors([error instanceof Error ? error.message : '画像付きバックアップを作成できませんでした。'])
    } finally { setBusy(false) }
  }

  const applyImport = async (mode: 'overwrite' | 'add') => {
    if (!candidate?.project || !confirm(mode === 'overwrite'
      ? '現在のイベントを上書きしますか？'
      : '新しいイベントとして追加しますか？')) return
    setBusy(true); setErrors([]); setNotice('')
    try {
      const restored = await restoreProjectBackup(candidate.project, candidate.images)
      if (mode === 'overwrite') onOverwrite({ ...restored, id: project.id })
      else onAdd({ ...restored, id: crypto.randomUUID(),
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      setCandidate(undefined)
      setNotice('イベントを読み込みました。')
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'バックアップを読み込めませんでした。'])
    } finally { setBusy(false) }
  }

  return <section className="import-box"><h3>JSONの読み込み・書き出し</h3>
    <p>通常のJSONはイベント情報のみ、画像付きJSONには会場図・ロゴ・お品書きなどの画像データも含まれます。</p>
    <button type="button" disabled={busy} onClick={() => downloadText(exportProject(project), projectFileName(project.name), 'application/json')}>JSONを書き出す（画像なし）</button>
    <button type="button" disabled={busy} onClick={() => void saveWithImages()}>画像付きJSONを書き出す</button>
    <label>イベントJSON・画像付きバックアップを読み込む
      <input type="file" accept=".json,application/json" disabled={busy} onChange={async (event) => {
        const file = event.target.files?.[0]
        setCandidate(undefined); setErrors([]); setNotice('')
        if (!file) return
        if (file.size > MAX_BACKUP_FILE_BYTES) {
          setErrors(['ファイルが96MBを超えています。']); return
        }
        try {
          const result = parseProjectDocument(await file.text())
          setCandidate(result.project ? result : undefined)
          setErrors(result.errors)
        } catch {
          setErrors(['JSONを読み込めませんでした。'])
        }
      }} />
    </label>
    {errors.map((error, index) => <p className="field-error" role="alert" key={index}>{error}</p>)}
    {notice && <p role="status">{notice}</p>}
    {candidate?.project && <div className="import-preview"><strong>{candidate.project.name}</strong>
      <p>{candidate.project.booths.length}ブース / schemaVersion {candidate.project.schemaVersion}{candidate.images ? ' / 画像付き' : ' / 画像なし'}</p>
      <button type="button" disabled={busy} onClick={() => void applyImport('overwrite')}>現在のイベントを上書き</button>
      <button type="button" disabled={busy} onClick={() => void applyImport('add')}>新しいイベントとして追加</button>
    </div>}
  </section>
}
