import { useState } from 'react'
import type { Booth } from '../../types/booth'
import type { EventProject } from '../../types/event'
import { CsvImporter } from './CsvImporter'
import { ImageUploader } from './ImageUploader'
import { ProjectImportExport } from './ProjectImportExport'
import { ThemeEditor } from './ThemeEditor'

interface Props {
  project: EventProject
  onChange: (update: EventProject | ((project: EventProject) => EventProject)) => void
  onAddProject: (project: EventProject) => void
  onImportBooths: (booths: Booth[]) => void
  snapEnabled: boolean
  onSnapChange: (enabled: boolean) => void
  onSnapAll: () => void
}

type SettingsTab = 'basic' | 'theme' | 'images' | 'map' | 'data'
const tabs: Array<[SettingsTab, string]> = [
  ['basic', '基本情報'], ['theme', 'テーマ'], ['images', '画像'], ['map', 'マップ設定'], ['data', 'データ入出力'],
]

export function EventSettingsPanel({ project, onChange, onAddProject, onImportBooths, snapEnabled, onSnapChange, onSnapAll }: Props) {
  const [tab, setTab] = useState<SettingsTab>('basic')
  const field = (key: 'name' | 'shortName' | 'date' | 'venue' | 'description', value: string) => onChange({ ...project, [key]: value })
  const setMapTheme = <K extends 'mapBackgroundColor' | 'mapSurfaceColor' | 'mapTextColor' | 'mapStyle'>(key: K, value: EventProject['theme'][K]) =>
    onChange({ ...project, theme: { ...project.theme, [key]: value } })
  const setMapStyle = (mapStyle: EventProject['theme']['mapStyle']) => {
    const preset = mapStyle === 'dark'
      ? { mapBackgroundColor: '#17171b', mapSurfaceColor: '#2d2c33', mapTextColor: '#f2f1f4' }
      : mapStyle === 'light'
        ? { mapBackgroundColor: '#ece9df', mapSurfaceColor: '#f8f6ef', mapTextColor: '#25252a' }
        : {}
    onChange({ ...project, theme: { ...project.theme, ...preset, mapStyle } })
  }

  return (
    <aside className="editor-panel settings-panel">
      <div className="panel-fixed-header">
        <h2>イベント設定</h2>
        <div className="settings-tabs" role="tablist" aria-label="イベント設定">
          {tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
        </div>
      </div>
      <div className="panel-scroll-body">
        {tab === 'basic' && <div className="form-section" role="tabpanel">
          <label>イベント名<input required value={project.name} onChange={(event) => field('name', event.target.value)} /></label>
          <label>略称<input required value={project.shortName} onChange={(event) => field('shortName', event.target.value)} /></label>
          <label>開催日<input type="date" required value={project.date} onChange={(event) => field('date', event.target.value)} /></label>
          <label>会場名<input required value={project.venue} onChange={(event) => field('venue', event.target.value)} /></label>
          <label>説明文<textarea value={project.description} onChange={(event) => field('description', event.target.value)} /></label>
        </div>}
        {tab === 'theme' && <div role="tabpanel"><ThemeEditor theme={project.theme} onChange={(theme) => onChange({ ...project, theme })} /></div>}
        {tab === 'images' && <div role="tabpanel">
          <ImageUploader label="イベントロゴ" value={project.assets.logoImage} onChange={(logoImage) => onChange((current) => current.id === project.id ? { ...current, assets: { ...current.assets, logoImage } } : current)} />
          <ImageUploader label="メインビジュアル" value={project.assets.heroImage} onChange={(heroImage) => onChange((current) => current.id === project.id ? { ...current, assets: { ...current.assets, heroImage } } : current)} />
          <ImageUploader label="ページ背景画像" value={project.assets.pageBackgroundImage} onChange={(pageBackgroundImage) => onChange((current) => current.id === project.id ? { ...current, assets: { ...current.assets, pageBackgroundImage } } : current)} />
          <ImageUploader label="会場マップ画像" value={project.assets.mapImage} onChange={(mapImage) => onChange((current) => current.id === project.id ? { ...current, assets: { ...current.assets, mapImage }, map: { ...current.map, backgroundImage: mapImage } } : current)} />
        </div>}
        {tab === 'map' && <fieldset className="form-section" role="tabpanel"><legend>マップ設定</legend>
          <label>マップスタイル<select value={project.theme.mapStyle} onChange={(event) => setMapStyle(event.target.value as EventProject['theme']['mapStyle'])}>
            <option value="light">ライト</option><option value="dark">ダーク</option><option value="image">画像</option>
          </select></label>
          {([['mapBackgroundColor', 'マップ背景色'], ['mapSurfaceColor', '会場面の色'], ['mapTextColor', 'マップ文字色']] as const).map(([key, label]) =>
            <label key={key}>{label}<input type="color" value={project.theme[key]} onChange={(event) => setMapTheme(key, event.target.value)} /></label>)}
          <label>グリッド間隔（%）<input type="number" min="0.25" max="25" step="0.25" value={project.map.gridSize} onChange={(event) => {
            const value = Number(event.target.value)
            if (Number.isFinite(value) && value >= .25 && value <= 25) onChange({ ...project, map: { ...project.map, gridSize: value } })
          }} /></label>
          <label className="check-row"><input type="checkbox" checked={project.map.showGrid} onChange={(event) => onChange({ ...project, map: { ...project.map, showGrid: event.target.checked } })} />グリッドを表示</label>
          <label className="check-row"><input type="checkbox" checked={snapEnabled} onChange={(event) => onSnapChange(event.target.checked)} />グリッドへスナップ</label>
          <button type="button" onClick={onSnapAll}>すべてのブースをグリッドに合わせる</button>
        </fieldset>}
        {tab === 'data' && <div role="tabpanel"><CsvImporter current={project.booths} onImport={onImportBooths} /><ProjectImportExport project={project} onOverwrite={onChange} onAdd={onAddProject} /></div>}
      </div>
    </aside>
  )
}
