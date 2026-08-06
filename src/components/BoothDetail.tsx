import type { Booth } from '../types/booth'

interface Props {
  booth: Booth
  isFavorite: boolean
  isVisited: boolean
  onToggleFavorite: () => void
  onToggleVisited: () => void
}

export function BoothDetail({ booth, isFavorite, isVisited, onToggleFavorite, onToggleVisited }: Props) {
  return (
    <aside className="detail-card" aria-labelledby="detail-title">
      <div className="detail-hero">
        <div className="poster" aria-label={`${booth.circleName}のお品書き風プレースホルダー`}>
          <span>MENU</span><strong>{booth.boothNumber}</strong><i>{booth.genre}</i>
        </div>
        <div>
          <span className="area-chip">AREA {booth.area}</span>
          <p className="booth-big">{booth.boothNumber}</p>
          <h2 id="detail-title">{booth.circleName}</h2>
          <p className="genre">{booth.genre}</p>
        </div>
      </div>
      <p className="description">{booth.description}</p>
      <div className="action-grid">
        <button type="button" className={isFavorite ? 'active' : ''} onClick={onToggleFavorite} aria-pressed={isFavorite}>
          <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span>{isFavorite ? 'お気に入り解除' : 'お気に入り'}
        </button>
        <button type="button" className={isVisited ? 'visited active' : 'visited'} onClick={onToggleVisited} aria-pressed={isVisited}>
          <span aria-hidden="true">✓</span>{isVisited ? '訪問済みを解除' : '訪問済みにする'}
        </button>
      </div>
      <section className="items" aria-labelledby="items-title">
        <h3 id="items-title">頒布物</h3>
        {booth.items.map((item) => (
          <article key={item.id}>
            <div><span className={`type-chip type-${item.type}`}>{item.type}</span><strong>{item.name}</strong></div>
            <b>¥{item.price.toLocaleString('ja-JP')}</b>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
      <div className="payment"><strong>支払い方法</strong><span>{booth.paymentMethods.join(' / ')}</span></div>
      <div className="external-links">
        <a href={booth.xUrl} target="_blank" rel="noreferrer">𝕏 サークル情報 <span>↗</span></a>
        <a href={booth.shopUrl} target="_blank" rel="noreferrer">通販を見る <span>↗</span></a>
      </div>
    </aside>
  )
}
