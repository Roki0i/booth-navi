import type { EventTheme } from '../../types/event'
import { isValidColor } from '../../utils/eventValidation'

interface Props { theme: EventTheme; onChange: (theme: EventTheme) => void }

export function ThemeEditor({ theme, onChange }: Props) {
  const colors: Array<[keyof EventTheme, string]> = [
    ['primaryColor', 'メインカラー'], ['backgroundColor', '背景色'], ['surfaceColor', 'サーフェス色'],
    ['textColor', '文字色'], ['mutedTextColor', '補助文字色'],
  ]
  return (
    <fieldset className="form-section">
      <legend>テーマ</legend>
      {colors.map(([key, label]) => {
        const value = String(theme[key])
        return <label key={key}>{label}<span className="color-field"><input type="color" value={isValidColor(value) && value.startsWith('#') ? value : '#000000'} onChange={(event) => onChange({ ...theme, [key]: event.target.value })} /><input value={value} onChange={(event) => { if (isValidColor(event.target.value)) onChange({ ...theme, [key]: event.target.value }) }} /></span>{!isValidColor(value) && <small className="field-error">有効な色を入力してください</small>}</label>
      })}
      <label>フォントスタイル<select value={theme.fontStyle} onChange={(event) => onChange({ ...theme, fontStyle: event.target.value as EventTheme['fontStyle'] })}><option value="sans">ゴシック</option><option value="serif">明朝</option><option value="rounded">丸ゴシック</option></select></label>
    </fieldset>
  )
}
