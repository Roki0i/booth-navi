import type { Booth, DistributionItem, ItemType } from '../../types/booth'
import { findDuplicateBoothNumbers } from '../../utils/eventValidation'
import { clampBooth, MIN_BOOTH_SIZE, snapBooth } from '../../utils/geometry'
import { useState } from 'react'
import { ImageUploader } from './ImageUploader'
import { UI_TEXT } from '../../utils/uiText'
import { PAYMENT_METHODS, shouldShowSourceFields, SOURCE_MEDIA, togglePaymentMethod, WORK_CATEGORIES } from '../../utils/boothMetadata'

interface Props { booth?: Booth; booths: Booth[]; gridSize: number; snapEnabled: boolean; onChange: (booth: Booth) => void; onSelect: (id: string) => void }

export function BoothEditorPanel({ booth, booths, gridSize, snapEnabled, onChange, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [coordinateWarning, setCoordinateWarning] = useState<string>()
  if (!booth) {
    const normalized = query.trim().toLocaleLowerCase()
    const matches = booths.filter((candidate) => !normalized || `${candidate.boothNumber} ${candidate.circleName}`.toLocaleLowerCase().includes(normalized))
    return <aside className="editor-panel booth-editor-panel empty-editor">
      <div className="panel-fixed-header"><div className="panel-heading"><h2>ブース</h2><span className="count-badge">{booths.length}件</span></div></div>
      <div className="panel-scroll-body">
        <p className="empty-editor-guide">{UI_TEXT.addBoothGuide}</p>
        <label className="booth-search">ブース番号・サークル名・出展者名を検索<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例：A01、サークル名" /></label>
        <div className="booth-list" aria-label="ブース一覧">{matches.map((candidate) =>
          <button type="button" key={candidate.id} onClick={() => onSelect(candidate.id)}><strong>{candidate.boothNumber}</strong><span>{candidate.circleName}</span></button>)}
          {!matches.length && <p className="empty-list">一致するブースはありません。</p>}
        </div>
      </div>
    </aside>
  }
  const duplicate = findDuplicateBoothNumbers(booths).includes(booth.boothNumber.trim().toUpperCase())
  const missing = !booth.boothNumber.trim() || !booth.circleName.trim()
  const set = <K extends keyof Booth>(key: K, value: Booth[K]) => {
    if (key === 'x' || key === 'y' || key === 'width' || key === 'height') {
      const changed = { ...booth, [key]: value }
      onChange(snapEnabled ? snapBooth(changed, gridSize) : clampBooth(changed))
    } else onChange({ ...booth, [key]: value })
  }
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
      <label>{UI_TEXT.circleNameLabel}<input required value={booth.circleName} onChange={(event) => set('circleName', event.target.value)} /></label>
      <label>エリア<input value={booth.area} onChange={(event) => set('area', event.target.value)} /></label>
      <label>ジャンル<input value={booth.genre} onChange={(event) => set('genre', event.target.value)} /></label>
      <label>作品区分<select value={booth.workCategory} onChange={(event) => set('workCategory', event.target.value as Booth['workCategory'])}>
        {WORK_CATEGORIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      {shouldShowSourceFields(booth.workCategory) && <>
        <label>原作メディア<select value={booth.sourceMedia ?? ''} onChange={(event) => set('sourceMedia', event.target.value ? event.target.value as NonNullable<Booth['sourceMedia']> : null)}>
          <option value="">未登録</option>
          {SOURCE_MEDIA.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        <label>原作・作品名<input value={booth.sourceTitle} onChange={(event) => set('sourceTitle', event.target.value)} /></label>
      </>}
      <label>紹介文<textarea value={booth.description} onChange={(event) => set('description', event.target.value)} /></label>
      <label>{UI_TEXT.xLinkLabel}<input type="url" value={booth.xUrl} onChange={(event) => set('xUrl', event.target.value)} /></label>
      <label>{UI_TEXT.shopLinkLabel}<input type="url" value={booth.shopUrl} onChange={(event) => set('shopUrl', event.target.value)} /></label>
      <fieldset className="payment-method-editor"><legend>支払い方法（複数選択可）</legend>
        <div className="checkbox-grid">{PAYMENT_METHODS.map((method) => <label key={method}>
          <input type="checkbox" checked={booth.paymentMethods.includes(method)} onChange={() => set('paymentMethods', togglePaymentMethod(booth.paymentMethods, method))} />
          <span>{method}</span>
        </label>)}</div>
        {booth.paymentMethods.includes('その他') && <label>その他の支払い方法<input value={booth.paymentMethodOther} onChange={(event) => set('paymentMethodOther', event.target.value)} /></label>}
      </fieldset>
      <div className="coordinate-grid">{(['x', 'y', 'width', 'height'] as const).map((key) => {
        const min = key === 'width' || key === 'height' ? MIN_BOOTH_SIZE : 0
        const invalid = coordinateWarning === key
        return <label key={key}>{key}（%）<input type="number" min={min} max="100" step={snapEnabled ? gridSize : .25} value={Number(booth[key].toFixed(4))} aria-invalid={invalid} onChange={(event) => {
          const value = Number(event.target.value)
          if (!Number.isFinite(value) || value < min || value > 100) {
            setCoordinateWarning(key)
            return
          }
          setCoordinateWarning(undefined)
          set(key, value)
        }} />{invalid && <small className="field-error">指定できる範囲は{min}〜100%です。</small>}</label>
      })}</div>
    </div>
    <details><summary>お品書き画像</summary><ImageUploader label="ブースのお品書き" value={booth.menuImage} onChange={(menuImage) => set('menuImage', menuImage)} /></details>
    <section className="item-editor"><div className="panel-heading"><h3>商品・配布物</h3><button type="button" onClick={() => set('items', [...booth.items, { id: crypto.randomUUID(), name: '新しい商品・配布物', price: 0, type: '新刊', description: '' }])}>追加</button></div>
      {!booth.items.length && <p className="empty-list">商品・配布物はまだ登録されていません。「追加」から登録できます。</p>}
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
