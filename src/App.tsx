import { useState } from 'react'
import { BoothDetail } from './components/BoothDetail'
import { FavoritesList } from './components/FavoritesList'
import { SearchBox } from './components/SearchBox'
import { VenueMap } from './components/VenueMap'
import { booths } from './data/booths'
import { usePersistentSet } from './hooks/usePersistentSet'
import type { Booth } from './types/booth'

export default function App() {
  const [selected, setSelected] = useState<Booth>(booths[8])
  const favorites = usePersistentSet('booth-navi:favorites')
  const visited = usePersistentSet('booth-navi:visited')

  const selectBooth = (booth: Booth) => {
    setSelected(booth)
    window.setTimeout(() => document.getElementById('map-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href={import.meta.env.BASE_URL} aria-label="Booth Navi ホーム">
            <span className="brand-mark" aria-hidden="true">BN</span>
            <span><strong>Booth Navi</strong><small>迷わず、会いに行こう。</small></span>
          </a>
          <div className="event-info">
            <span className="event-live">● 開催中</span>
            <strong>Sample Doujin Event 2026</strong>
          </div>
          <dl className="stats">
            <div><dt>ブース</dt><dd>{booths.length}</dd></div>
            <div><dt>お気に入り</dt><dd>{favorites.ids.length}</dd></div>
            <div><dt>訪問済み</dt><dd>{visited.ids.length}</dd></div>
          </dl>
        </div>
      </header>
      <main>
        <section className="intro">
          <p className="eyebrow">YOUR EVENT COMPANION</p>
          <h1>会いたいブースへ、<br /><span>まっすぐ。</span></h1>
          <p>番号やサークル名から検索して、会場マップ上の場所と頒布情報をすぐに確認できます。</p>
        </section>
        <SearchBox booths={booths} selectedBooth={selected} onSelect={selectBooth} />
        <div className="workspace">
          <VenueMap booths={booths} selectedId={selected.id} favoriteIds={favorites.ids} visitedIds={visited.ids} onSelect={setSelected} />
          <BoothDetail booth={selected} isFavorite={favorites.has(selected.id)} isVisited={visited.has(selected.id)} onToggleFavorite={() => favorites.toggle(selected.id)} onToggleVisited={() => visited.toggle(selected.id)} />
        </div>
        <FavoritesList booths={booths} favoriteIds={favorites.ids} visitedIds={visited.ids} onSelect={selectBooth} onRemove={favorites.toggle} />
      </main>
      <footer><strong>Booth Navi</strong><span>Sample Doujin Event 2026 · 架空のデモイベント</span></footer>
    </>
  )
}
