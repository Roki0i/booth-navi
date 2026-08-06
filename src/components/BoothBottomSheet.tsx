import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Booth } from '../types/booth'
import { isSheetCloseKey } from '../utils/viewerSelection'
import { BoothDetail } from './BoothDetail'

interface Props {
  booth: Booth
  isOpen: boolean
  isFavorite: boolean
  isVisited: boolean
  onClose: () => void
  onToggleFavorite: () => void
  onToggleVisited: () => void
  returnFocusRef: RefObject<HTMLElement | SVGElement | null>
}

const focusableSelector = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function BoothBottomSheet({ booth, isOpen, isFavorite, isVisited, onClose, onToggleFavorite, onToggleVisited, returnFocusRef }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<number | null>(null)
  const [expanded, setExpanded] = useState(false)
  const close = useCallback(() => {
    setExpanded(false)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    const returnFocusTarget = returnFocusRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => sheetRef.current?.querySelector<HTMLElement>('.sheet-close')?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (isSheetCloseKey(event.key)) {
        event.preventDefault()
        close()
        return
      }
      if (event.key !== 'Tab' || !sheetRef.current) return
      const focusable = [...sheetRef.current.querySelectorAll<HTMLElement>(focusableSelector)]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      if (returnFocusTarget?.isConnected) requestAnimationFrame(() => returnFocusTarget.focus())
    }
  }, [close, isOpen, returnFocusRef])

  if (!isOpen) return null
  return (
    <div className="sheet-layer" data-testid="booth-bottom-sheet">
      <button className="sheet-backdrop" type="button" onClick={close} aria-label="ブース詳細を閉じる" />
      <div
        ref={sheetRef}
        className={`bottom-sheet ${expanded ? 'is-expanded' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onPointerDown={(event) => { dragStart.current = event.clientY }}
        onPointerUp={(event) => {
          if (dragStart.current === null) return
          const distance = event.clientY - dragStart.current
          if (distance < -35) setExpanded(true)
          if (distance > 55) {
            if (expanded) setExpanded(false)
            else close()
          }
          dragStart.current = null
        }}
      >
        <div className="sheet-header">
          <button className="sheet-handle" type="button" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? '簡易表示に戻す' : '詳細を展開する'} aria-expanded={expanded}><span /></button>
          <h2 id="sheet-title" className="sr-only">{booth.circleName}のブース詳細</h2>
          <button className="sheet-close" type="button" onClick={close} aria-label="閉じる">×</button>
        </div>
        <div className="sheet-scroll">
          <BoothDetail booth={booth} isFavorite={isFavorite} isVisited={isVisited} onToggleFavorite={onToggleFavorite} onToggleVisited={onToggleVisited} compact={!expanded} />
          {!expanded && <button className="sheet-expand" type="button" onClick={() => setExpanded(true)}>詳細を見る</button>}
        </div>
      </div>
    </div>
  )
}
