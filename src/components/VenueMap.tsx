import { useCallback, useEffect, useRef, useState } from 'react'
import type { Booth } from '../types/booth'
import type { EventMap } from '../types/event'
import type { MapStyle } from '../types/event'
import { useImageUrl } from '../hooks/useImageStorage'
import { calculateBoothScrollPosition, calculateFitZoom } from '../utils/mapFit'
import { calculateMapPopoverPosition } from '../utils/mapPopover'
import { WorkCategoryBadge } from './WorkCategoryBadge'

interface Props {
  booths: Booth[]
  selectedId: string
  focusRequest?: number
  favoriteIds: string[]
  visitedIds: string[]
  onSelect: (booth: Booth) => void
  map: EventMap
  eventName: string
  mapStyle: MapStyle
}

export function VenueMap({ booths, selectedId, focusRequest = 0, favoriteIds, visitedIds, onSelect, map, eventName, mapStyle }: Props) {
  const [zoom, setZoom] = useState(1)
  const [fitMode, setFitMode] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [previewId, setPreviewId] = useState('')
  const [pinnedId, setPinnedId] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const previousSelectedId = useRef(selectedId)
  const previousFocusRequest = useRef(focusRequest)
  const hasMeasured = useRef(false)

  const fitToContainer = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const element = scroller.current
    if (!element) return
    setZoom(calculateFitZoom(element.clientWidth, element.clientHeight, map.width, map.height))
    setFitMode(true)
    element.scrollTo({ left: 0, top: 0, behavior })
  }, [map.height, map.width])

  useEffect(() => {
    const element = scroller.current
    if (!element) return
    const update = () => {
      if (fitMode) fitToContainer('auto')
      hasMeasured.current = true
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [fitMode, fitToContainer])

  useEffect(() => {
    const selectionChanged = previousSelectedId.current !== selectedId
    const focusRequested = previousFocusRequest.current !== focusRequest
    previousSelectedId.current = selectedId
    previousFocusRequest.current = focusRequest
    if ((!selectionChanged && !focusRequested) || !hasMeasured.current) return
    const booth = booths.find((candidate) => candidate.id === selectedId)
    if (!booth || !scroller.current) return
    const element = scroller.current
    const isMobile = window.matchMedia('(max-width: 600px)').matches
    const targetZoom = isMobile
      ? Math.min(1.25, Math.max(.75, calculateFitZoom(element.clientWidth, element.clientHeight, map.width, map.height) * 1.8))
      : zoom
    requestAnimationFrame(() => {
      if (isMobile) {
        setFitMode(false)
        setZoom(targetZoom)
      }
      requestAnimationFrame(() => {
        const position = calculateBoothScrollPosition(booth, map.width, map.height, targetZoom, element.clientWidth, element.clientHeight)
        element.scrollTo({ ...position, behavior: 'smooth' })
      })
    })
  }, [selectedId, focusRequest, booths, zoom, map])

  useEffect(() => {
    if (!isFullscreen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isFullscreen])
  useEffect(() => {
    const closePopover = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewId('')
        setPinnedId('')
      }
    }
    window.addEventListener('keydown', closePopover)
    return () => window.removeEventListener('keydown', closePopover)
  }, [])
  const mapImage = useImageUrl(map.backgroundImage)
  const popoverBooth = booths.find((booth) => booth.id === (previewId || pinnedId))
  const popoverPosition = popoverBooth ? calculateMapPopoverPosition(popoverBooth, map.width, map.height, zoom) : undefined

  const changeZoom = (amount: number) => {
    setFitMode(false)
    setZoom((value) => Math.max(.25, Math.min(2, value + amount)))
  }

  return (
    <section className={`map-card themed-map map-style-${mapImage ? 'image' : mapStyle} ${isFullscreen ? 'map-fullscreen' : ''}`} aria-labelledby="map-title">
      <div className="map-toolbar">
        <div><p className="eyebrow">VENUE MAP</p><h2 id="map-title">会場マップ</h2></div>
        <div className="map-toolbar-actions">
          <div className="zoom-controls" aria-label="マップ表示倍率">
            <button type="button" onClick={() => changeZoom(-.25)} disabled={zoom <= .25} aria-label="縮小">−</button>
            <output aria-live="polite">{fitMode ? '全体' : `${Math.round(zoom * 100)}%`}</output>
            <button type="button" onClick={() => changeZoom(.25)} disabled={zoom >= 2} aria-label="拡大">＋</button>
            <button type="button" onClick={() => fitToContainer()}>全体表示</button>
          </div>
          <button className="map-fullscreen-toggle" type="button" onClick={() => setIsFullscreen((value) => !value)}>
            {isFullscreen ? '全画面を閉じる' : '全画面で見る'}
          </button>
        </div>
      </div>
      <div className="map-legend" aria-label="凡例">
        <span><i className="legend-selected" />選択中</span>
        <span>★ お気に入り</span>
        <span>✓ 訪問済み</span>
      </div>
      <div className="map-scroller" ref={scroller}>
        <div
          className="map-centerer"
          style={{ minWidth: `${map.width * zoom}px`, minHeight: `${map.height * zoom}px` }}
          onClick={() => {
            setPreviewId('')
            setPinnedId('')
          }}
        >
        <div className="map-surface" style={{ width: `${map.width * zoom}px`, height: `${map.height * zoom}px` }}>
        <svg
          className="venue-map"
          style={{ width: `${map.width * zoom}px`, height: `${map.height * zoom}px` }}
          viewBox={`0 0 ${map.width} ${map.height}`}
          role="img"
          aria-label={`${eventName} 会場図`}
          aria-describedby="venue-desc"
        >
          <desc id="venue-desc">{booths.length}件のブースが配置された会場マップです。</desc>
          {mapImage ? <image href={mapImage} x="0" y="0" width={map.width} height={map.height} preserveAspectRatio="xMidYMid slice" /> : <>
          <rect className="hall" x="20" y="20" width={map.width - 40} height={map.height - 40} rx="24" />
          <path className="aisle" d="M440 40v620M40 340h820" />
          <text className="area-label" x="55" y="75">AREA A</text>
          <text className="area-label" x="470" y="75">AREA B</text>
          <text className="area-label" x="55" y="390">AREA C</text>
          <text className="area-label" x="470" y="390">AREA D</text>
          <g className="facility">
            <rect x="335" y="270" width="210" height="58" rx="12" />
            <text x="440" y="305" textAnchor="middle">☕ 休憩スペース</text>
            <text x="75" y="655">入口 →</text>
            <text x="750" y="655">→ 出口</text>
          </g>
          </>}
          {booths.map((booth) => {
            const x = booth.x / 100 * map.width, y = booth.y / 100 * map.height
            const width = booth.width / 100 * map.width, height = booth.height / 100 * map.height
            const selected = selectedId === booth.id
            const favorite = favoriteIds.includes(booth.id)
            const visited = visitedIds.includes(booth.id)
            return (
              <g
                key={booth.id}
                className={`booth ${selected ? 'is-selected' : ''} ${favorite ? 'is-favorite' : ''} ${visited ? 'is-visited' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`${booth.boothNumber} ${booth.circleName}${favorite ? ' お気に入り' : ''}${visited ? ' 訪問済み' : ''}`}
                aria-pressed={selected}
                aria-describedby={(previewId || pinnedId) === booth.id ? 'map-booth-popover' : undefined}
                onMouseEnter={() => setPreviewId(booth.id)}
                onMouseLeave={(event) => {
                  const next = event.relatedTarget
                  if (!(next instanceof Element && next.closest('#map-booth-popover'))) setPreviewId('')
                }}
                onFocus={() => setPreviewId(booth.id)}
                onBlur={() => setPreviewId('')}
                onClick={(event) => {
                  event.stopPropagation()
                  setPinnedId(booth.id)
                  setPreviewId('')
                  onSelect(booth)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setPinnedId(booth.id)
                    setPreviewId('')
                    onSelect(booth)
                  }
                }}
              >
                <rect x={x} y={y} width={width} height={height} rx="8" />
                <text className="booth-number" x={x + width / 2} y={y + Math.min(25, height * .45)} textAnchor="middle">{booth.boothNumber}</text>
                <text className="booth-state" x={x + width / 2} y={y + Math.min(45, height * .78)} textAnchor="middle">
                  {favorite ? '★' : ''}{visited ? ' ✓' : ''}
                </text>
              </g>
            )
          })}
        </svg>
        {popoverBooth && popoverPosition && <aside
          id="map-booth-popover"
          className={`map-booth-popover is-${popoverPosition.placement}`}
          style={{ left: popoverPosition.left, top: popoverPosition.top, '--popover-arrow-left': `${popoverPosition.arrowLeft}px` } as React.CSSProperties}
          data-testid="map-booth-popover"
          aria-live="polite"
          onMouseEnter={() => setPreviewId(popoverBooth.id)}
          onMouseLeave={(event) => {
            const next = event.relatedTarget
            if (!(next instanceof Element && next.closest('.booth'))) setPreviewId('')
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <strong className="popover-booth-number">{popoverBooth.boothNumber}</strong>
          <h3>{popoverBooth.circleName}</h3>
          <p className="popover-genre">{popoverBooth.genre}</p>
          <WorkCategoryBadge category={popoverBooth.workCategory} compact />
          <p className="popover-item">{popoverBooth.items[0]?.name ?? '商品・配布物情報なし'}</p>
        </aside>}
        </div>
        </div>
      </div>
    </section>
  )
}
