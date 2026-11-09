import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const image = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==',
  'base64',
)

test('image-inclusive JSON transfers a logo into a clean browser context', async ({ page, browser }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '編集モード' }).click()
  await page.getByRole('tab', { name: '画像' }).click()
  const logo = page.locator('.image-uploader').filter({ hasText: 'イベントロゴ' })
  await logo.locator('input[type="file"]').setInputFiles({
    name: 'logo.png', mimeType: 'image/png', buffer: image,
  })
  await expect(logo.locator('img')).toBeVisible()
  await page.getByRole('tab', { name: 'データ入出力' }).click()
  const section = page.locator('section.import-box').filter({ hasText: 'JSONの読み込み・書き出し' })
  const downloadEvent = page.waitForEvent('download')
  await section.getByRole('button', { name: '画像付きJSONを書き出す' }).click()
  const download = await downloadEvent
  const document = JSON.parse((await readFile(await download.path())).toString('utf8'))
  expect(document.backupFormat).toBe('booth-navi-images')
  expect(Object.keys(document.images)).toHaveLength(1)

  const otherContext = await browser.newContext()
  try {
    const other = await otherContext.newPage()
    await other.goto('./')
    await other.getByRole('button', { name: '編集モード' }).click()
    await other.getByRole('tab', { name: 'データ入出力' }).click()
    const importer = other.locator('section.import-box').filter({ hasText: 'JSONの読み込み・書き出し' })
    await importer.locator('input[type="file"]').setInputFiles({
      name: 'event-images.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(document), 'utf8'),
    })
    await expect(importer.getByText(/画像付き/)).toBeVisible()
    other.once('dialog', dialog => dialog.accept())
    await importer.getByRole('button', { name: '新しいイベントとして追加' }).click()
    await expect(other.locator('img.brand-logo')).toBeVisible()
    await expect.poll(async () => other.locator('img.brand-logo').evaluate(
      (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
    )).toBe(true)
  } finally {
    await otherContext.close()
  }
})
