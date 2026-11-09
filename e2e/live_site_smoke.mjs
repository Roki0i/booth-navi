import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const URL = 'https://roki0i.github.io/booth-navi/'
await mkdir('screenshots', { recursive: true })

const browser = await chromium.launch({ headless: true })
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' })
  const page = await desktop.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const response = await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  if (!response || response.status() !== 200) throw Error('Public Booth Navi did not return HTTP 200')
  await page.getByRole('heading', { level: 1, name: 'Sample Doujin Event 2026' }).waitFor({ timeout: 30000 })
  await page.screenshot({ path: 'screenshots/booth-desktop.png', fullPage: true })

  await page.getByLabel('ブース番号、サークル名・出展者名').fill('薄荷ドロップ')
  await page.locator('#search-results').getByRole('button', { name: /薄荷ドロップ/ }).click()
  await page.locator('.desktop-detail').getByRole('heading', { level: 2, name: '薄荷ドロップ' }).waitFor({ timeout: 15000 })
  await page.locator('.desktop-detail').getByRole('button', { name: 'お気に入り', exact: true }).click()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('region', { name: 'お気に入り', exact: true }).getByRole('listitem').first().waitFor({ timeout: 15000 })

  await page.getByRole('button', { name: '編集モード' }).click()
  await page.getByRole('tab', { name: 'データ入出力' }).click()
  await page.getByRole('button', { name: '画像付きJSONを書き出す' }).waitFor({ timeout: 15000 })
  await page.screenshot({ path: 'screenshots/booth-editor.png', fullPage: true })
  if (errors.length) throw Error('Desktop JavaScript errors: ' + errors.join(' / '))
  await desktop.close()

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true, hasTouch: true,
    colorScheme: 'light',
  })
  const mobilePage = await mobile.newPage()
  const mobileErrors = []
  mobilePage.on('pageerror', (error) => mobileErrors.push(error.message))
  await mobilePage.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await mobilePage.getByRole('heading', { level: 1, name: 'Sample Doujin Event 2026' }).waitFor({ timeout: 30000 })
  const overflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (overflow > 12) throw Error('Mobile horizontal overflow: ' + overflow + 'px')
  await mobilePage.screenshot({ path: 'screenshots/booth-mobile.png', fullPage: true })
  if (mobileErrors.length) throw Error('Mobile JavaScript errors: ' + mobileErrors.join(' / '))
  await mobile.close()
  console.log('Booth Navi public desktop/mobile browser checks passed')
} finally {
  await browser.close()
}
