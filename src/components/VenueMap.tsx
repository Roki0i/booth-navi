import { useEffect, useRef, useState } from 'react'
import type { Booth } from '../types/booth'

interface Props {
  booths: Booth[]
  selectedId: string
  favoriteIds: string[]
  visitedIds: string[]
  onSelect: (booth: Booth) => void
}

export function VenueMap({ booths, selectedId, favoriteIds, visitedIds, onSelect }: Props) {
  const [zoom, setZoom] = useState(1)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const booth = booths.find((candidate) => candidate.id === selectedId)
    if (!booth || !scroller.current) return
    const x = booth.x * zoom - scroller.current.clientWidth / 2 + booth.width / 2
    const y = booth.y * zoom - scroller.current.clientHeight / 2 + booth.height / 2
    scroller.current.scrollTo({ left: x, top: y, behavior: 'smooth' })
  }, [selectedId, booths, zoom])

  return (
    <section className="map-card" aria-labelledby="map-title">
      <div className="map-toolbar">
        <div><p className="eyebrow">VENUE MAP</p><h2 id="map-title">会場マップ</h2></div>
        <div className="zoom-controls" aria-label="マップ表示倍率">
          <button type="button" onClick={() => setZoom((value) => Math.max(.75, value - .25))} aria-label="縮小">−</button>
          <output aria-live="polite">{Math.round(zoom * 100)}%</output>
          <button type="button" onClick={() => setZoom((value) => Math.min(1.75, value + .25))} aria-label="拡大">＋</button>
          <button type="button" onClick={() => { setZoom(1); scroller.current?.scrollTo({ left: 0, top: 0, behavior: 'smooth' }) }}>初期位置</button>
        </div>
      </div>
      <div className="map-legend" aria-label="凡例">
        <span><i className="legend-selected" />選択中</span>
        <span>★ お気に入り</span>
        <span>✓ 訪問済み</span>
      </div>
      <div className="map-scroller" ref={scroller}>
        <svg
          className="venue-map"
          style={{ width: `${900 * zoom}px`, height: `${700 * zoom}px` }}
          viewBox="0 0 900 700"
          role="img"
          aria-labelledby="venue-title venue-desc"
        >
          <title id="venue-title">Sample Doujin Event 2026 会場図</title>
          <desc id="venue-desc">AからDまでの4エリアに24のブース、入口、出口、中央通路、休憩スペースがあります。</desc>
          <rect className="hall" x="20" y="20" width="860" height="660" rx="24" />
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
          {booths.map((booth) => {
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
                onClick={() => onSelect(booth)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(booth)
                  }
                }}
              >
                <rect x={booth.x} y={booth.y} width={booth.width} height={booth.height} rx="8" />
                <text className="booth-number" x={booth.x + booth.width / 2} y={booth.y + 25} textAnchor="middle">{booth.boothNumber}</text>
                <text className="booth-state" x={booth.x + booth.width / 2} y={booth.y + 45} textAnchor="middle">
                  {favorite ? '★' : ''}{visited ? ' ✓' : ''}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
