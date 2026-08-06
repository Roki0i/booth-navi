import { useState } from 'react'
import type { EventProject } from '../../types/event'
import { downloadText, exportProject, importProject, projectFileName } from '../../utils/projectImportExport'

interface Props { project: EventProject; onOverwrite: (project: EventProject) => void; onAdd: (project: EventProject) => void }

export function ProjectImportExport({ project, onOverwrite, onAdd }: Props) {
  const [candidate, setCandidate] = useState<EventProject>()
  const [errors, setErrors] = useState<string[]>([])
  return <section className="import-box"><h3>JSONの読み込み・書き出し</h3>
    <p>イベントデータをJSON形式で書き出します。アップロードした画像のデータは含まれません。</p>
    <button type="button" onClick={() => downloadText(exportProject(project), projectFileName(project.name), 'application/json')}>JSONを書き出す</button>
    <input type="file" accept=".json,application/json" onChange={async (event) => {
      const file = event.target.files?.[0]
      if (!file) return
      if (file.size > 5 * 1024 * 1024 && !confirm('ファイルが5MBを超えています。読み込みを続けますか？')) return
      const result = importProject(await file.text()); setCandidate(result.project); setErrors(result.errors)
    }} />
    {errors.map((error) => <p className="field-error" key={error}>{error}</p>)}
    {candidate && <div className="import-preview"><strong>{candidate.name}</strong><p>{candidate.booths.length}ブース / schemaVersion {candidate.schemaVersion}</p>
      <button type="button" onClick={() => { if (confirm('現在のイベントを上書きしますか？')) onOverwrite({ ...candidate, id: project.id }) }}>現在のイベントを上書き</button>
      <button type="button" onClick={() => { if (confirm('新しいイベントとして追加しますか？')) onAdd({ ...candidate, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }) }}>新しいイベントとして追加</button>
    </div>}
  </section>
}
