import type { Booth } from '../types/booth'
import { useImageUrl } from '../hooks/useImageStorage'
import { isValidExternalLink } from '../utils/externalLink'
import { shouldShowSourceFields, sourceMediaLabel } from '../utils/boothMetadata'
import { WorkCategoryBadge } from './WorkCategoryBadge'

interface Props {
  booth: Booth
  isFavorite: boolean
  isVisited: boolean
  onToggleFavorite: () => void
  onToggleVisited: () => void
  compact?: boolean
}

export function BoothDetail({ booth, isFavorite, isVisited, onToggleFavorite, onToggleVisited, compact = false }: Props) {
  const menuUrl = useImageUrl(booth.menuImage)
  const hasXUrl = isValidExternalLink(booth.xUrl)
  const hasShopUrl = isValidExternalLink(booth.shopUrl)
  return (
    <aside className={`detail-card ${compact ? 'detail-compact' : ''}`} aria-labelledby="detail-title">
      <div className="detail-hero">
        <div className="poster" aria-label={`${booth.circleName}のお品書き`}>
          {menuUrl ? <img src={menuUrl} alt={booth.menuImage?.alt ?? ''} /> : <>
          <span>MENU</span><strong>{booth.boothNumber}</strong><i>{booth.genre}</i>
          </>}
        </div>
        <div>
          <span className="area-chip">AREA {booth.area}</span>
          <p className="booth-big">{booth.boothNumber}</p>
          <h2 id="detail-title">{booth.circleName}</h2>
          <p className="genre">{booth.genre}</p>
        </div>
      </div>
      <p className="description detail-extended">{booth.description}</p>
      <dl className="work-metadata">
        <div><dt>作品区分</dt><dd><WorkCategoryBadge category={booth.workCategory} /></dd></div>
        {shouldShowSourceFields(booth.workCategory) && (booth.sourceMedia || booth.sourceTitle) && <div>
          <dt>原作</dt>
          <dd>{sourceMediaLabel(booth.sourceMedia)}{booth.sourceTitle && <>「{booth.sourceTitle}」</>}</dd>
        </div>}
      </dl>
      <div className="action-grid">
        <button type="button" className={isFavorite ? 'active' : ''} onClick={onToggleFavorite} aria-pressed={isFavorite}>
          <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span>{isFavorite ? 'お気に入り解除' : 'お気に入り'}
        </button>
        <button type="button" className={isVisited ? 'visited active' : 'visited'} onClick={onToggleVisited} aria-pressed={isVisited}>
          <span aria-hidden="true">✓</span>{isVisited ? '訪問済みを解除' : '訪問済みにする'}
        </button>
      </div>
      <section className="items detail-extended" aria-labelledby="items-title">
        <h3 id="items-title">商品・配布物</h3>
        {!booth.items.length && <p className="items-empty">商品・配布物はまだ登録されていません。</p>}
        {booth.items.map((item) => (
          <article key={item.id}>
            <div><span className={`type-chip type-${item.type}`}>{item.type}</span><strong>{item.name}</strong></div>
            <b>¥{item.price.toLocaleString('ja-JP')}</b>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
      <div className="payment"><strong>支払い方法</strong>{booth.paymentMethods.length
        ? <span className="payment-tags">{booth.paymentMethods.map((method) => (
          <span className="metadata-tag payment-tag" key={method}>
            {method === 'その他' && booth.paymentMethodOther ? `その他（${booth.paymentMethodOther}）` : method}
          </span>
        ))}</span>
        : <span className="payment-unregistered">未登録</span>}</div>
      <div className="external-links detail-extended">
        {hasXUrl
          ? <a href={booth.xUrl.trim()} target="_blank" rel="noopener noreferrer">𝕏 サークル情報 <span aria-hidden="true">↗</span></a>
          : <p>Xのリンクは未登録です</p>}
        {hasShopUrl
          ? <a href={booth.shopUrl.trim()} target="_blank" rel="noopener noreferrer">通販を見る <span aria-hidden="true">↗</span></a>
          : <p>通販ページは未登録です</p>}
      </div>
    </aside>
  )
}
