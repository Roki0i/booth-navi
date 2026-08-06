import { useCallback, useEffect, useRef, useState } from 'react'
import type { Booth } from '../../types/booth'
import type { EventMap } from '../../types/event'
import type { ResizeHandle } from '../../types/editor'
import { clampBooth, moveBooth, resizeBooth, snapBooth, type Alignment } from '../../utils/geometry'
import { useImageUrl } from '../../hooks/useImageStorage'
import { calculateFitZoom } from '../../utils/mapFit'

interface Props {
  map: EventMap
  booths: Booth[]
  selectedIds: string[]
  snapEnabled: boolean
  onSelect: (id?: string, additive?: boolean) => void
  onCommit: (booths: Booth[]) => void
  onDuplicate: () => void
  onDelete: () => void
  onSnapSelected: () => void
  onAlign: (alignment: Alignment) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

type Gesture = { id: string; handle?: ResizeHandle; startX: number; startY: number; booth: Booth }
const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const inputFocused = () => {
  const element = document.activeElement
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement
}

export function MapEditor({ map, booths, selectedIds, snapEnabled, onSelect, onCommit, onDuplicate, onDelete, onSnapSelected, onAlign, onUndo, onRedo, canUndo, canRedo }: Props) {
  const [zoom, setZoom] = useState(1)
  const [draftState, setDraft] = useState(booths)
  const [dragging, setDragging] = useState(false)
  const [fitMode, setFitMode] = useState(true)
  const [scrollable, setScrollable] = useState(false)
  const latestDraft = useRef(booths)
  const gesture = useRef<Gesture | undefined>(undefined)
  const canvas = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const backgroundUrl = useImageUrl(map.backgroundImage)
  const draft = dragging ? draftState : booths

  const fitToScreen = useCallback(() => {
    const element = scroller.current
    if (!element) return
    setZoom(calculateFitZoom(element.clientWidth, element.clientHeight, map.width, map.height))
    setFitMode(true)
    element.scrollTo({ left: 0, top: 0 })
  }, [map.height, map.width])

  useEffect(() => {
    const element = scroller.current
    if (!element) return
    const update = () => {
      if (fitMode) setZoom(calculateFitZoom(element.clientWidth, element.clientHeight, map.width, map.height))
      requestAnimationFrame(() => setScrollable(element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [fitMode, map.height, map.width, zoom])

  const changeZoom = (next: (value: number) => number) => {
    setFitMode(false)
    setZoom(next)
  }

  const point = (event: { clientX: number; clientY: number }) => {
    const rect = canvas.current!.getBoundingClientRect()
    return { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 }
  }
  const begin = (event: React.PointerEvent, booth: Booth, handle?: ResizeHandle) => {
    event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId)
    const p = point(event)
    setDraft(booths)
    latestDraft.current = booths
    setDragging(true)
    gesture.current = { id: booth.id, handle, startX: p.x, startY: p.y, booth }
    onSelect(booth.id, event.shiftKey)
  }
  const move = (event: React.PointerEvent) => {
    const current = gesture.current
    if (!current) return
    const p = point(event), dx = p.x - current.startX, dy = p.y - current.startY
    setDraft((all) => {
      const next = all.map((booth) => booth.id === current.id
      ? current.handle
        ? resizeBooth(current.booth, current.handle, dx, dy, map.gridSize, snapEnabled)
        : moveBooth(current.booth, dx, dy, map.gridSize, snapEnabled)
      : booth)
      latestDraft.current = next
      return next
    })
  }
  const end = () => {
    if (!gesture.current) return
    onCommit(latestDraft.current)
    gesture.current = undefined
    setDragging(false)
  }

  return (
    <section className="map-card editor-map-card" aria-label="マップエディター">
      <div className="map-toolbar editor-toolbar">
        <div><p className="eyebrow">MAP EDITOR</p><h2>会場マップ</h2></div>
        <div className="editor-actions">
          <button type="button" disabled={!canUndo} onClick={onUndo}>元に戻す</button><button type="button" disabled={!canRedo} onClick={onRedo}>やり直す</button>
          <button type="button" disabled={selectedIds.length !== 1} onClick={onDuplicate}>複製</button><button type="button" disabled={!selectedIds.length} onClick={onDelete}>削除</button>
          <button type="button" disabled={!selectedIds.length} onClick={onSnapSelected}>選択中をグリッドに合わせる</button>
        </div>
        <div className="zoom-controls"><button type="button" aria-label="縮小" disabled={zoom <= .25} onClick={() => changeZoom((z) => Math.max(.25, z - .25))}>−</button><output>{fitMode ? '全体' : `${Math.round(zoom * 100)}%`}</output><button type="button" aria-label="拡大" disabled={zoom >= 2} onClick={() => changeZoom((z) => Math.min(2, z + .25))}>＋</button><button type="button" onClick={fitToScreen}>全体表示</button></div>
      </div>
      <div className="alignment-toolbar" aria-label="ブースの整列">
        {([['left', '左揃え'], ['right', '右揃え'], ['top', '上揃え'], ['bottom', '下揃え'], ['horizontal', '横方向に等間隔'], ['vertical', '縦方向に等間隔'], ['width', '同じ幅'], ['height', '同じ高さ']] as Array<[Alignment, string]>).map(([action, label]) =>
          <button type="button" key={action} disabled={selectedIds.length < 2} onClick={() => onAlign(action)}>{label}</button>)}
      </div>
      <p className="editor-help">マップ上の空いている場所をクリックすると、ブースを追加できます。ドラッグで移動し、ハンドルでサイズを変更できます。グリッドへのスナップを有効にすると、位置とサイズがグリッドに揃います。</p>
      <p className="editor-help keyboard-help">Shift＋クリック：複数選択 ／ 矢印キー：移動 ／ Shift＋矢印キー：大きく移動 ／ Delete：削除 ／ Esc：選択解除</p>
      <div className={`map-scroller editor-scroller ${scrollable ? 'is-scrollable' : ''}`} ref={scroller}>
        {scrollable && <span className="scroll-hint" aria-hidden="true">↔ スクロールできます ↕</span>}
        <div
          ref={canvas}
          className={`editor-canvas ${map.showGrid ? 'show-grid' : ''}`}
          style={{
            width: `${map.width * zoom}px`, height: `${map.height * zoom}px`,
            backgroundImage: backgroundUrl ? `linear-gradient(rgba(255,255,255,.24),rgba(255,255,255,.24)),url(${backgroundUrl})` : undefined,
            backgroundSize: backgroundUrl ? 'cover' : `${map.gridSize}% ${map.gridSize}%`,
            '--grid-size': `${map.gridSize}%`,
          } as React.CSSProperties}
          tabIndex={0}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return
            const p = point(event)
            const candidate: Booth = { id: crypto.randomUUID(), boothNumber: `NEW${draft.length + 1}`, circleName: '新しい出展者', area: '', genre: '', description: '', workCategory: 'original', sourceMedia: null, sourceTitle: '', x: p.x - 4, y: p.y - 3, width: 8, height: 6, items: [], paymentMethods: [], paymentMethodOther: '', xUrl: '', shopUrl: '' }
            const next = snapEnabled ? snapBooth(candidate, map.gridSize) : clampBooth(candidate)
            onCommit([...draft, next]); onSelect(next.id)
          }}
          onKeyDown={(event) => {
            if (inputFocused()) return
            if (event.key === 'Escape') { onSelect(); return }
            if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIds.length) { event.preventDefault(); onDelete(); return }
            if (!selectedIds.length || !event.key.startsWith('Arrow')) return
            event.preventDefault()
            const amount = snapEnabled ? map.gridSize * (event.shiftKey ? 5 : 1) : event.shiftKey ? 2 : .25
            const dx = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0
            const dy = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0
            onCommit(draft.map((booth) => selectedIds.includes(booth.id) ? moveBooth(booth, dx, dy, map.gridSize, snapEnabled) : booth))
          }}
        >
          {!backgroundUrl && <div className="standard-map-bg"><span>入口</span><strong>EVENT HALL</strong><span>出口</span></div>}
          {draft.map((booth) => <div
            key={booth.id}
            className={`editor-booth ${selectedIds.includes(booth.id) ? 'is-selected' : ''}`}
            style={{ left: `${booth.x}%`, top: `${booth.y}%`, width: `${booth.width}%`, height: `${booth.height}%` }}
            role="button" tabIndex={0} aria-label={`${booth.boothNumber} ${booth.circleName}`}
            onPointerDown={(event) => begin(event, booth)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(booth.id) }}
          >
            <strong>{booth.boothNumber}</strong>
            {selectedIds.length === 1 && selectedIds[0] === booth.id && handles.map((handle) => <i key={handle} className={`resize-handle handle-${handle}`} onPointerDown={(event) => begin(event, booth, handle)} />)}
          </div>)}
        </div>
      </div>
    </section>
  )
}
