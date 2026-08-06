import { useCallback, useMemo, useRef, useState } from 'react'
import { BoothBottomSheet } from './components/BoothBottomSheet'
import { BoothDetail } from './components/BoothDetail'
import { FavoritesList } from './components/FavoritesList'
import { SearchBox } from './components/SearchBox'
import { UiThemeSwitch } from './components/UiThemeSwitch'
import { VenueMap } from './components/VenueMap'
import { EventEditor } from './components/editor/EventEditor'
import { useEventProjects } from './hooks/useEventProjects'
import { useImageUrl } from './hooks/useImageStorage'
import { usePersistentSet } from './hooks/usePersistentSet'
import { useNarrowLayout } from './hooks/useNarrowLayout'
import { useUiTheme } from './hooks/useUiTheme'
import type { AppMode } from './types/editor'
import type { Booth } from './types/booth'
import { themeToCssVariables } from './utils/eventValidation'
import { closeViewerSheet, selectViewerBooth } from './utils/viewerSelection'

export default function App() {
  const manager = useEventProjects()
  const project = manager.current
  const [mode, setMode] = useState<AppMode>('view')
  const [selectedId, setSelectedId] = useState(project.booths[0]?.id)
  const [mapFocusRequest, setMapFocusRequest] = useState(0)
  const [showEvents, setShowEvents] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const returnFocusRef = useRef<HTMLElement | SVGElement | null>(null)
  const isNarrow = useNarrowLayout()
  const { theme: uiTheme, toggleTheme } = useUiTheme()
  const favorites = usePersistentSet(`booth-navi:${project.id}:favorites`)
  const visited = usePersistentSet(`booth-navi:${project.id}:visited`)
  const backgroundUrl = useImageUrl(project.assets.pageBackgroundImage)
  const heroUrl = useImageUrl(project.assets.heroImage)
  const logoUrl = useImageUrl(project.assets.logoImage)
  const selected = project.booths.find((booth) => booth.id === selectedId) ?? project.booths[0]
  const themeStyle = useMemo(() => ({
    ...themeToCssVariables(project.theme),
    '--event-font': project.theme.fontStyle === 'serif' ? 'Georgia, "Noto Serif JP", serif' : project.theme.fontStyle === 'rounded' ? '"Arial Rounded MT Bold", "Noto Sans JP", sans-serif' : 'Inter, "Noto Sans JP", sans-serif',
    backgroundImage: backgroundUrl ? `linear-gradient(var(--ui-page-overlay),var(--ui-page-overlay)),url(${backgroundUrl})` : undefined,
  } as React.CSSProperties), [backgroundUrl, project.theme])

  const closeSheet = useCallback(() => {
    setIsSheetOpen(closeViewerSheet('').isSheetOpen)
  }, [])
  const selectBooth = (booth: Booth) => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement || document.activeElement instanceof SVGElement ? document.activeElement : null
    const selection = selectViewerBooth(booth.id, isNarrow)
    setSelectedId(selection.selectedId)
    setMapFocusRequest((value) => value + 1)
    setIsSheetOpen(selection.isSheetOpen)
    if (!selection.isSheetOpen) window.setTimeout(() => document.getElementById('map-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  return <div className="app-shell" style={themeStyle}>
    <header className="site-header">
      <div className="header-inner">
        <button className="brand brand-button" type="button" onClick={() => setShowEvents((value) => !value)} aria-expanded={showEvents}>
          {logoUrl ? <img className="brand-logo" src={logoUrl} alt={project.assets.logoImage?.alt ?? ''} /> : <span className="brand-mark" aria-hidden="true">BN</span>}
          <span><strong>{project.shortName}</strong><small>{project.name}</small></span><span aria-hidden="true">⌄</span>
        </button>
        <UiThemeSwitch theme={uiTheme} onToggle={toggleTheme} />
        <div className="mode-switch" aria-label="表示モード">
          <button type="button" className={mode === 'view' ? 'active' : ''} onClick={() => setMode('view')}>閲覧モード</button>
          <button type="button" className={mode === 'edit' ? 'active' : ''} onClick={() => setMode('edit')}>編集モード</button>
        </div>
        <span className={`save-status status-${manager.saveStatus}`} aria-live="polite">{manager.saveStatus === 'saving' ? '保存中…' : manager.saveStatus === 'saved' ? '保存しました' : '保存できませんでした'}</span>
        {mode === 'view' && <dl className="stats"><div><dt>ブース</dt><dd>{project.booths.length}</dd></div><div><dt>お気に入り</dt><dd>{favorites.ids.length}</dd></div><div><dt>訪問済み</dt><dd>{visited.ids.length}</dd></div></dl>}
      </div>
      {showEvents && <div className="event-switcher">
        <div className="event-switcher-list">{manager.projects.map((event) => <button key={event.id} type="button" className={event.id === project.id ? 'active' : ''} onClick={() => { manager.setCurrentId(event.id); setShowEvents(false) }}><strong>{event.name}</strong><small>{event.date} · {event.venue || '会場未設定'}</small></button>)}</div>
        <div className="event-switcher-actions"><button type="button" onClick={() => { manager.add(); setShowEvents(false) }}>新規作成</button><button type="button" onClick={() => { manager.duplicate(); setShowEvents(false) }}>複製</button><button type="button" onClick={() => { if (confirm(`「${project.name}」を削除しますか？`)) manager.remove(project.id) }}>削除</button><button type="button" onClick={() => { if (confirm('サンプルイベントを初期状態へ戻しますか？')) manager.resetSample() }}>サンプルへリセット</button></div>
      </div>}
    </header>
    {mode === 'view' ? <main>
      <section className={`intro ${heroUrl ? 'has-hero' : ''}`} style={heroUrl ? { backgroundImage: `linear-gradient(90deg,rgba(20,18,28,.86),rgba(20,18,28,.25)),url(${heroUrl})` } : undefined}>
        <p className="eyebrow">{project.date} · {project.venue}</p><h1>{project.name}</h1><p>{project.description}</p>
      </section>
      {selected ? <>
        <SearchBox booths={project.booths} selectedBooth={selected} onSelect={selectBooth} />
        <div className="workspace"><VenueMap booths={project.booths} map={project.map} mapStyle={project.theme.mapStyle} eventName={project.name} selectedId={selected.id} focusRequest={mapFocusRequest} favoriteIds={favorites.ids} visitedIds={visited.ids} onSelect={selectBooth} /><div className="desktop-detail"><BoothDetail booth={selected} isFavorite={favorites.has(selected.id)} isVisited={visited.has(selected.id)} onToggleFavorite={() => favorites.toggle(selected.id)} onToggleVisited={() => visited.toggle(selected.id)} /></div></div>
        {isNarrow && <BoothBottomSheet booth={selected} isOpen={isSheetOpen} onClose={closeSheet} returnFocusRef={returnFocusRef} isFavorite={favorites.has(selected.id)} isVisited={visited.has(selected.id)} onToggleFavorite={() => favorites.toggle(selected.id)} onToggleVisited={() => visited.toggle(selected.id)} />}
        <FavoritesList booths={project.booths} favoriteIds={favorites.ids} visitedIds={visited.ids} onSelect={selectBooth} onRemove={favorites.toggle} />
      </> : <section className="empty-event"><h2>ブースはまだありません</h2><p>編集モードでマップをクリックして追加できます。</p></section>}
    </main> : <main className="editor-main"><EventEditor project={project} onChange={manager.updateCurrent} onAddProject={manager.add} /></main>}
    <footer><strong>Booth Navi</strong><span>{project.name} · このブラウザに保存</span></footer>
  </div>
}
