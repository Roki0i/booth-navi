import { useState } from 'react'
import type { Booth } from '../../types/booth'
import { createCsvTemplate, parseBoothCsv, type CsvResult } from '../../utils/csvImport'
import { downloadText } from '../../utils/projectImportExport'
import { sourceMediaLabel, workCategoryLabel } from '../../utils/boothMetadata'

interface Props { current: Booth[]; onImport: (booths: Booth[]) => void }

export function CsvImporter({ current, onImport }: Props) {
  const [result, setResult] = useState<CsvResult>()
  const [mode, setMode] = useState<'append' | 'replace'>('append')
  return <section className="import-box"><h3>CSVの読み込み</h3>
    <input type="file" accept=".csv,text/csv" onChange={async (event) => {
      const file = event.target.files?.[0]
      if (file) setResult(parseBoothCsv(await file.text()))
    }} />
    <button type="button" onClick={() => downloadText(createCsvTemplate(), 'booth-template.csv', 'text/csv;charset=utf-8')}>CSVテンプレートを保存</button>
    {result && <div className="import-preview">
      {result.missingHeaders.length > 0 && <p className="field-error">不足している項目：{result.missingHeaders.join(', ')}</p>}
      {result.errors.map((error) => <p className="field-error" key={error}>{error}</p>)}
      {result.duplicates.length > 0 && <p className="field-warning">重複しているブース番号：{result.duplicates.join(', ')}</p>}
      <p>読み込めるブース：{result.booths.length}件</p>
      <ul>{result.booths.slice(0, 5).map((booth) => <li key={booth.id}>
        {booth.boothNumber} {booth.circleName} / {workCategoryLabel(booth.workCategory)}
        {booth.sourceMedia && ` / ${sourceMediaLabel(booth.sourceMedia)}`}
        {` / ${booth.paymentMethods.length ? booth.paymentMethods.join('・') : '支払い方法未登録'}`}
      </li>)}</ul>
      <label><input type="radio" checked={mode === 'append'} onChange={() => setMode('append')} />追加</label>
      <label><input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} />すべて置き換える</label>
      <button type="button" disabled={!result.booths.length || result.missingHeaders.length > 0} onClick={() => {
        if (confirm(`${result.booths.length}件を${mode === 'append' ? '追加' : '既存データと置き換え'}しますか？`)) onImport(mode === 'append' ? [...current, ...result.booths] : result.booths)
      }}>CSVを読み込む</button>
    </div>}
  </section>
}
