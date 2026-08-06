import { useRef, useState } from 'react'
import type { ImageReference } from '../../types/booth'
import { useImageStorage, useImageUrl } from '../../hooks/useImageStorage'
import { validateImage } from '../../utils/imageValidation'

interface Props {
  label: string
  value?: ImageReference
  onChange: (value?: ImageReference) => void
}

export function ImageUploader({ label, value, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const url = useImageUrl(value)
  const { save, remove } = useImageStorage()
  const [alt, setAlt] = useState(value?.alt ?? '')
  const [message, setMessage] = useState('')
  return (
    <div className="image-uploader">
      <strong>{label}</strong>
      {url && <img src={url} alt={value?.alt ?? ''} />}
      <input type="file" ref={input} accept="image/png,image/jpeg,image/webp" onChange={async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        const validation = validateImage(file)
        setMessage(validation.error ?? validation.warning ?? '')
        if (!validation.valid) return
        try { onChange(await save(file, alt)) } catch { setMessage('画像を保存できませんでした。画像なしで他の機能は利用できます。') }
      }} />
      <label>代替テキスト<input value={alt} onChange={(event) => {
        setAlt(event.target.value)
        if (value) onChange({ ...value, alt: event.target.value })
      }} /></label>
      {value && <button type="button" className="danger-link" onClick={async () => {
        try { await remove(value.id) } catch { /* IndexedDB unavailable; reference removal still works */ }
        onChange(undefined); if (input.current) input.current.value = ''
      }}>画像を削除</button>}
      {message && <p className={message.includes('のみ') || message.includes('できません') ? 'field-error' : 'field-warning'}>{message}</p>}
    </div>
  )
}
