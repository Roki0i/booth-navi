import { useCallback, useEffect, useRef, useState } from 'react'
import type { Booth } from '../../types/booth'
import type { EventMap } from '../../types/event'
import type { ResizeHandle } from '../../types/editor'
import { clampBooth, moveBooth, resizeBooth } from '../../utils/geometry'
import { useImageUrl } from '../../hooks/useImageStorage'
import { calculateFitZoom } from '../../utils/mapFit'

interface Props {
  map: EventMap
  booths: Booth[]
  selectedId?: string
  snapEnabled: boolean
  onSelect: (id?: string) => void
  onCommit: (booths: Booth[]) => void
  onDuplicate: () => void
  onDelete: () => void
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

export function MapEditor({ map, booths, selectedId, snapEnabled, onSelect, onCommit, onDuplicate, onDelete, onUndo, onRedo, canUndo, canRedo }: Props) {
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
    onSelect(booth.id)
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
          <button type="button" disabled={!selectedId} onClick={onDuplicate}>複製</button><button type="button" disabled={!selectedId} onClick={onDelete}>削除</button>
        </div>
        <div className="zoom-controls"><button type="button" aria-label="縮小" disabled={zoom <= .25} onClick={() => changeZoom((z) => Math.max(.25, z - .25))}>−</button><output>{fitMode ? 'フィット' : `${Math.round(zoom * 100)}%`}</output><button type="button" aria-label="拡大" disabled={zoom >= 2} onClick={() => changeZoom((z) => Math.min(2, z + .25))}>＋</button><button type="button" onClick={fitToScreen}>全体表示</button></div>
      </div>
      <p className="editor-help">空白をクリックして追加。ドラッグで移動、ハンドルでサイズ変更。矢印 / Shift+矢印 / Delete / Escにも対応。</p>
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
            const next: Booth = clampBooth({ id: crypto.randomUUID(), boothNumber: `NEW${draft.length + 1}`, circleName: '新しい出展者', area: '', genre: '', description: '', x: p.x - 4, y: p.y - 3, width: 8, height: 6, items: [], paymentMethods: ['現金'], xUrl: '', shopUrl: '' })
            onCommit([...draft, next]); onSelect(next.id)
          }}
          onKeyDown={(event) => {
            if (inputFocused()) return
            if (event.key === 'Escape') { onSelect(); return }
            if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) { event.preventDefault(); onDelete(); return }
            if (!selectedId || !event.key.startsWith('Arrow')) return
            event.preventDefault()
            const amount = event.shiftKey ? 2 : .25
            const dx = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0
            const dy = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0
            onCommit(draft.map((booth) => booth.id === selectedId ? moveBooth(booth, dx, dy) : booth))
          }}
        >
          {!backgroundUrl && <div className="standard-map-bg"><span>入口</span><strong>EVENT HALL</strong><span>出口</span></div>}
          {draft.map((booth) => <div
            key={booth.id}
            className={`editor-booth ${selectedId === booth.id ? 'is-selected' : ''}`}
            style={{ left: `${booth.x}%`, top: `${booth.y}%`, width: `${booth.width}%`, height: `${booth.height}%` }}
            role="button" tabIndex={0} aria-label={`${booth.boothNumber} ${booth.circleName}`}
            onPointerDown={(event) => begin(event, booth)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(booth.id) }}
          >
            <strong>{booth.boothNumber}</strong>
            {selectedId === booth.id && handles.map((handle) => <i key={handle} className={`resize-handle handle-${handle}`} onPointerDown={(event) => begin(event, booth, handle)} />)}
          </div>)}
        </div>
      </div>
    </section>
  )
}
