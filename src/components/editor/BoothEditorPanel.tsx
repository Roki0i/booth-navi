import type { Booth, DistributionItem, ItemType } from '../../types/booth'
import { findDuplicateBoothNumbers } from '../../utils/eventValidation'
import { clampBooth } from '../../utils/geometry'
import { ImageUploader } from './ImageUploader'

interface Props { booth?: Booth; booths: Booth[]; onChange: (booth: Booth) => void; onSelect: (id: string) => void }

export function BoothEditorPanel({ booth, booths, onChange, onSelect }: Props) {
  const [query, setQuery] = useState('')
  if (!booth) {
    const normalized = query.trim().toLocaleLowerCase()
    const matches = booths.filter((candidate) => !normalized || `${candidate.boothNumber} ${candidate.circleName}`.toLocaleLowerCase().includes(normalized))
    return <aside className="editor-panel booth-editor-panel empty-editor">
      <div className="panel-fixed-header"><div className="panel-heading"><h2>ブース</h2><span className="count-badge">{booths.length}件</span></div></div>
      <div className="panel-scroll-body">
        <p className="empty-editor-guide">マップの空白をクリックすると、新しいブースを追加できます。</p>
        <label className="booth-search">ブース番号・サークル名を検索<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例: A01、サークル名" /></label>
        <div className="booth-list" aria-label="ブース一覧">{matches.map((candidate) =>
          <button type="button" key={candidate.id} onClick={() => onSelect(candidate.id)}><strong>{candidate.boothNumber}</strong><span>{candidate.circleName}</span></button>)}
          {!matches.length && <p className="empty-list">一致するブースはありません。</p>}
        </div>
      </div>
    </aside>
  }
  const duplicate = findDuplicateBoothNumbers(booths).includes(booth.boothNumber.trim().toUpperCase())
  const missing = !booth.boothNumber.trim() || !booth.circleName.trim()
  const set = <K extends keyof Booth>(key: K, value: Booth[K]) => onChange(key === 'x' || key === 'y' || key === 'width' || key === 'height' ? clampBooth({ ...booth, [key]: value }) : { ...booth, [key]: value })
  const updateItem = (index: number, update: Partial<DistributionItem>) => set('items', booth.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...update } : item))
  const moveItem = (index: number, offset: number) => {
    const items = [...booth.items], target = index + offset
    if (target < 0 || target >= items.length) return
    ;[items[index], items[target]] = [items[target], items[index]]
    set('items', items)
  }
  return <aside className="editor-panel booth-editor-panel">
    <div className="panel-fixed-header"><h2>ブース編集</h2></div>
    <div className="panel-scroll-body">
    {duplicate && <p className="field-warning">ブース番号が重複しています。</p>}
    {missing && <p className="field-error">ブース番号と出展者名は必須です。</p>}
    <div className="form-section compact-form">
      <label>ブース番号<input required value={booth.boothNumber} onChange={(event) => set('boothNumber', event.target.value)} /></label>
      <label>サークル名 / 出展者名<input required value={booth.circleName} onChange={(event) => set('circleName', event.target.value)} /></label>
      <label>エリア<input value={booth.area} onChange={(event) => set('area', event.target.value)} /></label>
      <label>ジャンル<input value={booth.genre} onChange={(event) => set('genre', event.target.value)} /></label>
      <label>紹介文<textarea value={booth.description} onChange={(event) => set('description', event.target.value)} /></label>
      <label>XのURL<input type="url" value={booth.xUrl} onChange={(event) => set('xUrl', event.target.value)} /></label>
      <label>通販URL<input type="url" value={booth.shopUrl} onChange={(event) => set('shopUrl', event.target.value)} /></label>
      <label>支払い方法<input value={booth.paymentMethods.join(', ')} onChange={(event) => set('paymentMethods', event.target.value.split(',').map((value) => value.trim()).filter(Boolean))} /></label>
      <div className="coordinate-grid">{(['x', 'y', 'width', 'height'] as const).map((key) => <label key={key}>{key}<input type="number" min="0" max="100" step=".25" value={Number(booth[key].toFixed(2))} onChange={(event) => set(key, Number(event.target.value))} /></label>)}</div>
    </div>
    <details><summary>お品書き画像</summary><ImageUploader label="ブースのお品書き" value={booth.menuImage} onChange={(menuImage) => set('menuImage', menuImage)} /></details>
    <section className="item-editor"><div className="panel-heading"><h3>頒布物</h3><button type="button" onClick={() => set('items', [...booth.items, { id: crypto.randomUUID(), name: '新しい頒布物', price: 0, type: '新刊', description: '' }])}>追加</button></div>
      {booth.items.map((item, index) => <div className="item-form" key={item.id}>
        <div className="item-actions"><strong>{index + 1}</strong><button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0}>↑</button><button type="button" onClick={() => moveItem(index, 1)} disabled={index === booth.items.length - 1}>↓</button><button type="button" onClick={() => set('items', booth.items.filter((candidate) => candidate.id !== item.id))}>削除</button></div>
        <label>名前<input value={item.name} onChange={(event) => updateItem(index, { name: event.target.value })} /></label>
        <label>価格<input type="number" min="0" value={item.price} onChange={(event) => updateItem(index, { price: Number(event.target.value) })} /></label>
        <label>種類<select value={item.type} onChange={(event) => updateItem(index, { type: event.target.value as ItemType })}><option>新刊</option><option>既刊</option><option>グッズ</option></select></label>
        <label>説明<textarea value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} /></label>
      </div>)}
    </section>
    </div>
  </aside>
}
import { useState } from 'react'
