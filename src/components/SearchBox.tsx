import { useId, useMemo, useRef, useState } from 'react'
import type { Booth } from '../types/booth'
import { searchBooths } from '../utils/search'

interface Props {
  booths: Booth[]
  selectedBooth: Booth
  onSelect: (booth: Booth) => void
}

export function SearchBox({ booths, selectedBooth, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const results = useMemo(() => searchBooths(booths, query).slice(0, 8), [booths, query])
  const hasQuery = query.trim().length > 0

  const select = (booth: Booth) => {
    onSelect(booth)
    setQuery(`${booth.boothNumber} ${booth.circleName}`)
  }

  return (
    <section className="search-panel" aria-labelledby="search-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">FIND A BOOTH</p>
          <h2 id="search-title">ブースを探す</h2>
        </div>
        <span className="key-hint" aria-hidden="true">番号 / 名前</span>
      </div>
      <label htmlFor={inputId} className="sr-only">ブース番号またはサークル名</label>
      <div className="search-input-wrap">
        <span aria-hidden="true">⌕</span>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && results[0]) select(results[0])
          }}
          placeholder="例：B27、薄荷ドロップ"
          autoComplete="off"
          aria-controls="search-results"
          aria-expanded={hasQuery}
        />
        {query && (
          <button
            className="clear-button"
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="検索内容を削除"
          >
            ×
          </button>
        )}
      </div>
      <div className="result-status" aria-live="polite">
        {hasQuery ? (results.length ? `${results.length}件の候補` : '一致するブースが見つかりません') : '番号のハイフン・空白・全角半角は問いません'}
      </div>
      {hasQuery && results.length === 0 && selectedBooth && (
        <p className="search-mismatch">現在表示中のブースは検索条件と一致していません</p>
      )}
      {hasQuery && results.length > 0 && (
        <ul id="search-results" className="search-results">
          {results.map((booth) => (
            <li key={booth.id}>
              <button type="button" onClick={() => select(booth)}>
                <strong>{booth.boothNumber}</strong>
                <span>{booth.circleName}<small>{booth.genre}</small></span>
                <span aria-hidden="true">→</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
