# Booth Navi

イベント会場のブースを検索し、位置・頒布物を確認できるWebアプリです。お気に入り・訪問済みの管理と、主催者向けの会場編集にも対応します。

**[会場マップを試す](https://roki0i.github.io/booth-navi/)**（サンプル24ブースは架空のデータ）

## 主な機能

- サークル名・ブース番号・頒布物の検索と会場図での位置確認
- 画像なしの会場でブースを追加する場合は、装飾背景の外周余白から追加
- ブースの配置・移動、CSV一括読み込みと事前プレビュー
- ブラウザ内保存、画像付きJSONバックアップ・復元
- 別タブでの変更を検知した場合は自動保存を停止

**技術**：React / TypeScript / Vite / Tailwind CSS / Vitest / Playwright

## 起動・テスト

Node.js 24を使用します。

```bash
npm ci
npm run dev
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

[CI](https://github.com/Roki0i/booth-navi/actions/workflows/ci.yml) · [公開ワークフロー](https://github.com/Roki0i/booth-navi/actions/workflows/deploy-pages.yml)

## データ・制約

- イベント情報はブラウザに保存され、サイトデータを消すと失われます。端末移行には編集画面の「データ入出力」から画像付きJSONを保存してください。
- 画像付きバックアップは1画像20MB・画像合計64MB・読み込みファイル96MBまで。PNG / JPEG / WebPは使用許可を確認してください。
- 複数タブでの同時編集は完全排他ではありません。競合を検知した場合はJSONへ退避し、ページを再読み込みしてください。
- サーバー同期・共同編集・イベントの公開URL自動発行には未対応です。
