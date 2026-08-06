import { useState } from 'react'
import type { Booth } from '../../types/booth'
import type { EventProject } from '../../types/event'
import { useEditorHistory } from '../../hooks/useEditorHistory'
import { EventSettingsPanel } from './EventSettingsPanel'
import { MapEditor } from './MapEditor'
import { BoothEditorPanel } from './BoothEditorPanel'
import { alignBooths, moveBooth, snapBooths, type Alignment } from '../../utils/geometry'

interface Props {
  project: EventProject
  onChange: (project: EventProject) => void
  onAddProject: (project: EventProject) => void
}

export function EventEditor({ project, onChange, onAddProject }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [mobilePanel, setMobilePanel] = useState<'map' | 'settings' | 'booth'>('map')
  const setBooths = (booths: Booth[]) => onChange({ ...project, booths })
  const history = useEditorHistory(project.booths, setBooths)
  const selectedId = selectedIds.at(-1)
  const selected = project.booths.find((booth) => booth.id === selectedId)
  const changeBooth = (booth: Booth) => history.commit(project.booths.map((candidate) => candidate.id === booth.id ? booth : candidate))
  const removeSelected = () => {
    if (!selectedIds.length || !confirm(`選択中のブース${selectedIds.length > 1 ? `${selectedIds.length}件` : ''}を削除しますか？`)) return
    history.commit(project.booths.filter((booth) => !selectedIds.includes(booth.id))); setSelectedIds([])
  }
  const duplicateSelected = () => {
    if (!selected) return
    const copy = moveBooth({ ...structuredClone(selected), id: crypto.randomUUID(), boothNumber: `${selected.boothNumber}-COPY` }, project.map.gridSize, project.map.gridSize, project.map.gridSize, snapEnabled)
    history.commit([...project.booths, copy]); setSelectedIds([copy.id])
  }
  const select = (id?: string, additive = false) => {
    if (!id) return setSelectedIds([])
    setSelectedIds((current) => additive
      ? current.includes(id) ? current.filter((candidate) => candidate !== id) : [...current, id]
      : [id])
  }
  const snapSelected = () => history.commit(project.booths.map((booth) => selectedIds.includes(booth.id) ? snapBooths([booth], project.map.gridSize)[0] : booth))
  const snapAll = () => {
    if (confirm('すべてのブースの位置とサイズをグリッドに合わせますか？')) history.commit(snapBooths(project.booths, project.map.gridSize))
  }
  const align = (alignment: Alignment) => {
    const aligned = alignBooths(project.booths, selectedIds, alignment)
    history.commit(snapEnabled
      ? aligned.map((booth) => selectedIds.includes(booth.id) ? snapBooths([booth], project.map.gridSize)[0] : booth)
      : aligned)
  }
  return <>
    <nav className="mobile-editor-tabs" aria-label="編集パネル"><button className={mobilePanel === 'settings' ? 'active' : ''} onClick={() => setMobilePanel('settings')}>設定</button><button className={mobilePanel === 'map' ? 'active' : ''} onClick={() => setMobilePanel('map')}>マップ</button><button className={mobilePanel === 'booth' ? 'active' : ''} onClick={() => setMobilePanel('booth')}>ブース</button></nav>
    <div className="editor-layout">
      <div className={`editor-left mobile-${mobilePanel}`}>
        <EventSettingsPanel project={project} onChange={onChange} onAddProject={onAddProject} onImportBooths={history.commit} snapEnabled={snapEnabled} onSnapChange={setSnapEnabled} onSnapAll={snapAll} />
      </div>
      <div className={`editor-center mobile-${mobilePanel}`}><MapEditor map={project.map} booths={project.booths} selectedIds={selectedIds} snapEnabled={snapEnabled} onSelect={select} onCommit={history.commit} onDuplicate={duplicateSelected} onDelete={removeSelected} onSnapSelected={snapSelected} onAlign={align} onUndo={history.undo} onRedo={history.redo} canUndo={history.canUndo} canRedo={history.canRedo} /></div>
      <div className={`editor-right mobile-${mobilePanel}`}><BoothEditorPanel booth={selected} booths={project.booths} gridSize={project.map.gridSize} snapEnabled={snapEnabled} onChange={changeBooth} onSelect={(id) => { select(id); setMobilePanel('booth') }} /></div>
    </div>
  </>
}
