import { useState } from 'react'
import type { Booth } from '../../types/booth'
import type { EventProject } from '../../types/event'
import { useEditorHistory } from '../../hooks/useEditorHistory'
import { EventSettingsPanel } from './EventSettingsPanel'
import { MapEditor } from './MapEditor'
import { BoothEditorPanel } from './BoothEditorPanel'

interface Props {
  project: EventProject
  onChange: (project: EventProject) => void
  onAddProject: (project: EventProject) => void
}

export function EventEditor({ project, onChange, onAddProject }: Props) {
  const [selectedId, setSelectedId] = useState<string>()
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [mobilePanel, setMobilePanel] = useState<'map' | 'settings' | 'booth'>('map')
  const setBooths = (booths: Booth[]) => onChange({ ...project, booths })
  const history = useEditorHistory(project.booths, setBooths)
  const selected = project.booths.find((booth) => booth.id === selectedId)
  const changeBooth = (booth: Booth) => history.commit(project.booths.map((candidate) => candidate.id === booth.id ? booth : candidate))
  const removeSelected = () => {
    if (!selectedId || !confirm('選択中のブースを削除しますか？')) return
    history.commit(project.booths.filter((booth) => booth.id !== selectedId)); setSelectedId(undefined)
  }
  const duplicateSelected = () => {
    if (!selected) return
    const copy = { ...structuredClone(selected), id: crypto.randomUUID(), boothNumber: `${selected.boothNumber}-COPY`, x: Math.min(100 - selected.width, selected.x + 2), y: Math.min(100 - selected.height, selected.y + 2) }
    history.commit([...project.booths, copy]); setSelectedId(copy.id)
  }
  return <>
    <nav className="mobile-editor-tabs" aria-label="編集パネル"><button className={mobilePanel === 'settings' ? 'active' : ''} onClick={() => setMobilePanel('settings')}>設定</button><button className={mobilePanel === 'map' ? 'active' : ''} onClick={() => setMobilePanel('map')}>マップ</button><button className={mobilePanel === 'booth' ? 'active' : ''} onClick={() => setMobilePanel('booth')}>ブース</button></nav>
    <div className="editor-layout">
      <div className={`editor-left mobile-${mobilePanel}`}>
        <EventSettingsPanel project={project} onChange={onChange} onAddProject={onAddProject} onImportBooths={history.commit} snapEnabled={snapEnabled} onSnapChange={setSnapEnabled} />
      </div>
      <div className={`editor-center mobile-${mobilePanel}`}><MapEditor map={project.map} booths={project.booths} selectedId={selectedId} snapEnabled={snapEnabled} onSelect={setSelectedId} onCommit={history.commit} onDuplicate={duplicateSelected} onDelete={removeSelected} onUndo={history.undo} onRedo={history.redo} canUndo={history.canUndo} canRedo={history.canRedo} /></div>
      <div className={`editor-right mobile-${mobilePanel}`}><BoothEditorPanel booth={selected} booths={project.booths} onChange={changeBooth} onSelect={(id) => { setSelectedId(id); setMobilePanel('booth') }} /></div>
    </div>
  </>
}
