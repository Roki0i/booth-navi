import { expect, test } from '@playwright/test'

test('another tab changing the project suspends stale autosaves until reload', async ({ page }) => {
  await page.goto('./')
  const other = await page.context().newPage()
  await other.goto('./')

  await page.getByRole('button', { name: '編集モード' }).click()
  await other.getByRole('button', { name: '編集モード' }).click()

  const eventName = page.getByLabel('イベント名')
  await eventName.fill('Latest change from tab A')
  await expect(page.locator('.save-status')).toHaveText('保存しました')

  await expect(other.getByRole('alert')).toContainText('別のタブでイベントが更新されました')
  await expect(other.locator('.save-status')).toHaveText('他タブで更新されました')

  await other.getByLabel('イベント名').fill('Stale change from tab B')
  await expect(other.locator('.save-status')).toHaveText('他タブで更新されました')
  await other.waitForTimeout(500)

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('booth-navi:event-projects')!))
  expect(stored[0].name).toBe('Latest change from tab A')
  await other.reload()
  await other.getByRole('button', { name: '編集モード' }).click()
  await expect(other.getByLabel('イベント名')).toHaveValue('Latest change from tab A')
  await other.close()
})
