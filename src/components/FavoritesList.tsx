import type { Booth } from '../types/booth'
import { sortByBoothNumber } from '../utils/search'

interface Props {
  booths: Booth[]
  favoriteIds: string[]
  visitedIds: string[]
  onSelect: (booth: Booth) => void
  onRemove: (id: string) => void
}

export function FavoritesList({ booths, favoriteIds, visitedIds, onSelect, onRemove }: Props) {
  const favorites = sortByBoothNumber(booths.filter((booth) => favoriteIds.includes(booth.id)))
  return (
    <section className="favorites-card" aria-labelledby="favorites-title">
      <div className="section-heading">
        <div><p className="eyebrow">MY LIST</p><h2 id="favorites-title">お気に入り</h2></div>
        <span className="count-badge">{favorites.length} ブース</span>
      </div>
      {favorites.length === 0 ? (
        <div className="empty-state"><span aria-hidden="true">☆</span><strong>お気に入りはまだありません</strong><p>気になるブースを登録すると、ここからすぐにマップへ移動できます。</p></div>
      ) : (
        <ul className="favorite-list">
          {favorites.map((booth) => (
            <li key={booth.id}>
              <button className="favorite-select" type="button" onClick={() => onSelect(booth)}>
                <strong>{booth.boothNumber}</strong><span>{booth.circleName}<small>{booth.genre}</small></span>
                {visitedIds.includes(booth.id) && <em>✓ 訪問済み</em>}
              </button>
              <button className="remove-button" type="button" onClick={() => onRemove(booth.id)} aria-label={`${booth.boothNumber}をお気に入りから解除`}>×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
