import { expect, test, type Locator, type Page } from '@playwright/test'

const searchLabel = 'ブース番号、サークル名・出展者名'
const targetName = '薄荷ドロップ'
const detail = (page: Page) => page.locator('.desktop-detail')
const undo = (page: Page) => page.getByRole('button', { name: '元に戻す', exact: true })
const canvas = (page: Page) => page.locator('.editor-canvas')
const editorBooths = (page: Page) => canvas(page).getByRole('button')
const saved = (page: Page) => expect(page.locator('.save-status')).toHaveText('保存しました')

async function createEvent(page: Page, name: string) {
  await page.locator('.brand-button').click()
  await page.getByRole('button', { name: '新規作成', exact: true }).click()
  await page.getByLabel('イベント名', { exact: true }).fill(name)
  await saved(page)
}

async function switchEvent(page: Page, name: string) {
  await page.locator('.brand-button').click()
  await page.locator('.event-switcher-list').getByRole('button').filter({
    has: page.getByText(name, { exact: true }),
  }).click()
  await expect(page.getByLabel('イベント名', { exact: true })).toHaveValue(name)
}

async function addBooth(page: Page) {
  const bounds = await canvas(page).boundingBox()
  if (!bounds) throw new Error('マップが表示されていません')
  // The existing decorative background intercepts clicks inside its 5% inset.
  // Use the exposed canvas margin; do not bypass browser hit testing with force/dispatchEvent.
  await canvas(page).click({ position: { x: bounds.width * .3, y: bounds.height * .03 } })
  await expect(editorBooths(page)).toHaveCount(1)
  await expect(page.getByLabel('ブース番号', { exact: true })).toHaveValue('NEW1')
}

async function expectDecodedImage(image: Locator) {
  await expect(image).toBeVisible()
  await expect.poll(() => image.evaluate((element: HTMLImageElement) =>
    element.complete && element.naturalWidth > 0)).toBe(true)
}

test.beforeEach(async ({ page }) => {
  // Playwright creates a fresh context, including localStorage and IndexedDB, per test.
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sample Doujin Event 2026')
})

test('検索から詳細を開き、お気に入りが再読み込み後も維持される', async ({ page }) => {
  await page.getByLabel(searchLabel).fill(targetName)
  await page.locator('#search-results').getByRole('button', { name: new RegExp(targetName) }).click()
  await expect(detail(page).getByRole('heading', { level: 2 })).toHaveText(targetName)
  await detail(page).getByRole('button', { name: 'お気に入り', exact: true }).click()
  await expect(detail(page).getByRole('button', { name: 'お気に入り解除', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  const favorites = page.getByRole('region', { name: 'お気に入り', exact: true })
  await expect(favorites.getByRole('listitem')).toHaveCount(1)
  await favorites.getByRole('button', { name: new RegExp(targetName) }).click()
  await expect(detail(page).getByRole('heading', { level: 2 })).toHaveText(targetName)
  await expect(detail(page).getByRole('button', { name: 'お気に入り解除', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('追加したブースをドラッグし、Undoで移動前に戻せる', async ({ page }) => {
  await page.getByRole('button', { name: '編集モード', exact: true }).click()
  await createEvent(page, '移動テスト')
  await addBooth(page)
  const booth = editorBooths(page)
  const originalStyle = await booth.getAttribute('style')
  const bounds = await booth.boundingBox()
  if (!bounds) throw new Error('追加したブースが表示されていません')
  const x = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 70, y + 45, { steps: 8 })
  await page.mouse.up()
  await expect(booth).not.toHaveAttribute('style', originalStyle!)
  await undo(page).click()
  await expect(editorBooths(page)).toHaveCount(1)
  await expect(booth).toHaveAttribute('style', originalStyle!)
  await undo(page).click()
  await expect(editorBooths(page)).toHaveCount(0)
  await expect(undo(page)).toBeDisabled()
})

test('イベントを切り替えるとUndo履歴が分離され、BをAのデータで上書きしない', async ({ page }) => {
  await page.getByRole('button', { name: '編集モード', exact: true }).click()
  await createEvent(page, 'イベントB')
  await addBooth(page)
  await page.getByLabel('ブース番号', { exact: true }).fill('B-ONLY')
  await createEvent(page, 'イベントA')
  await addBooth(page)
  await page.getByLabel('ブース番号', { exact: true }).fill('A-ONLY')
  await expect(undo(page)).toBeEnabled()
  await switchEvent(page, 'イベントB')
  await expect(undo(page)).toBeDisabled()
  await expect(editorBooths(page)).toHaveCount(1)
  const boothB = editorBooths(page).filter({ hasText: 'B-ONLY' })
  await expect(boothB).toBeVisible()
  // Create a real B-only undo entry, then exercise the enabled Undo button.
  await boothB.focus()
  await boothB.press('Enter')
  await page.getByLabel('ブース番号', { exact: true }).fill('B-EDITED')
  await undo(page).click()
  await expect(boothB).toBeVisible()
  await expect(undo(page)).toBeDisabled()
  await saved(page)
  await page.reload()
  await page.getByRole('button', { name: '編集モード', exact: true }).click()
  await expect(page.getByLabel('イベント名', { exact: true })).toHaveValue('イベントB')
  await expect(editorBooths(page)).toHaveCount(1)
  await expect(boothB).toBeVisible()
  await switchEvent(page, 'イベントA')
  await expect(editorBooths(page)).toHaveCount(1)
  await expect(editorBooths(page).filter({ hasText: 'A-ONLY' })).toBeVisible()
})

test('画像付きイベントの複製先で画像を削除しても元画像が再読み込み後に表示される', async ({ page }) => {
  await page.getByRole('button', { name: '編集モード', exact: true }).click()
  await createEvent(page, '画像元イベント')
  await page.getByRole('tab', { name: '画像', exact: true }).click()
  const uploader = page.locator('.image-uploader').filter({ has: page.getByText('イベントロゴ', { exact: true }) })
  await uploader.getByLabel('代替テキスト').fill('元イベントのロゴ')
  // A real 1x1 PNG, uploaded through the browser and persisted in IndexedDB.
  await uploader.locator('input[type=file]').setInputFiles({
    name: 'logo.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64'),
  })
  await expectDecodedImage(uploader.getByRole('img', { name: '元イベントのロゴ' }))
  await saved(page)
  await page.locator('.brand-button').click()
  await page.locator('.event-switcher-actions').getByRole('button', { name: '複製', exact: true }).click()
  await expect(page.getByLabel('イベント名', { exact: true })).toHaveValue('画像元イベント のコピー')
  await page.getByRole('tab', { name: '画像', exact: true }).click()
  await expectDecodedImage(uploader.getByRole('img', { name: '元イベントのロゴ' }))
  await uploader.getByRole('button', { name: '画像を削除', exact: true }).click()
  await expect(uploader.locator('img')).toHaveCount(0)
  await saved(page)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('画像元イベント のコピー')
  await expect(page.locator('.brand-logo')).toHaveCount(0)
  await page.getByRole('button', { name: '編集モード', exact: true }).click()
  await switchEvent(page, '画像元イベント')
  await saved(page)
  await page.reload()
  await expectDecodedImage(page.locator('.brand-logo'))
  await expect(page.locator('.brand-logo')).toHaveAttribute('alt', '元イベントのロゴ')
})

for (const [kind, content, message] of [
  ['構文エラー', '{broken', 'JSONの構文が不正です。'],
  ['スキーマエラー', '{"schemaVersion":999}', 'schemaVersionは1〜2の整数である必要があります。'],
] as const) {
  test(`不正JSON（${kind}）を取り込んでも正常データを維持する`, async ({ page }) => {
    await page.getByRole('button', { name: '編集モード', exact: true }).click()
    await page.getByLabel('イベント名', { exact: true }).fill('保持するイベント')
    await saved(page)
    const snapshot = await page.evaluate(() => localStorage.getItem('booth-navi:event-projects'))
    expect(snapshot).not.toBeNull()
    await page.getByRole('tab', { name: 'データ入出力', exact: true }).click()
    const importer = page.locator('.import-box').filter({ has: page.getByRole('heading', { name: 'JSONの読み込み・書き出し' }) })
    // First load a valid candidate, ensuring a subsequent failure clears stale overwrite actions.
    const validProject = JSON.parse(snapshot!)[0]
    await importer.locator('input[type=file]').setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(validProject)) })
    await expect(importer.getByRole('button', { name: '現在のイベントを上書き', exact: true })).toBeVisible()
    await importer.locator('input[type=file]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(content) })
    await expect(importer.getByText(message, { exact: true })).toBeVisible()
    await expect(importer.getByRole('button', { name: '現在のイベントを上書き', exact: true })).toHaveCount(0)
    await expect(importer.getByRole('button', { name: '新しいイベントとして追加', exact: true })).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('保持するイベント')
    expect(await page.evaluate(() => localStorage.getItem('booth-navi:event-projects'))).toBe(snapshot)
    await page.getByLabel(searchLabel).fill(targetName)
    await page.getByLabel(searchLabel).press('Enter')
    await expect(detail(page).getByRole('heading', { level: 2 })).toHaveText(targetName)
  })
}

for (const ime of ['isComposing', 'keyCode229'] as const) {
  test(`IME相当のEnter（${ime}）では選択せず、通常Enterで選択する`, async ({ page }) => {
    const heading = detail(page).getByRole('heading', { level: 2 })
    const originalName = await heading.textContent()
    expect(originalName).not.toBe(targetName)
    const input = page.getByLabel(searchLabel)
    await input.fill(targetName)
    await input.dispatchEvent('compositionstart', { data: '' })
    await input.dispatchEvent('keydown', {
      key: 'Enter', code: 'Enter', bubbles: true,
      isComposing: ime === 'isComposing', keyCode: ime === 'keyCode229' ? 229 : 13,
    })
    await expect(heading).toHaveText(originalName!)
    await expect(input).toHaveValue(targetName)
    await input.dispatchEvent('compositionend', { data: targetName })
    await input.press('Enter')
    await expect(heading).toHaveText(targetName)
    await expect(input).toHaveValue(`B27 ${targetName}`)
  })
}
