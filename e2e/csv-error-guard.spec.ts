import { expect, test } from '@playwright/test'

const header = 'boothNumber,circleName,area,genre,description,x,y,width,height,xUrl,shopUrl'
const valid = 'A01,サークルA,A,イラスト,紹介文,10,20,8,5,,'
const invalid = 'A02,,A,イラスト,紹介文,20,20,8,5,,'

test('CSV errors block append and replacement until every row is valid', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '編集モード' }).click()
  await page.getByRole('tab', { name: 'データ入出力' }).click()

  const importer = page.locator('section.import-box').filter({
    has: page.getByRole('heading', { name: 'CSVの読み込み' }),
  })
  const uploader = importer.locator('input[type="file"]')
  const importButton = importer.getByRole('button', { name: 'CSVを読み込む' })

  await uploader.setInputFiles({
    name: 'mixed.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from([header, valid, invalid].join('\n'), 'utf8'),
  })
  await expect(importer.getByText('読み込めるブース：1件')).toBeVisible()
  await expect(importer.getByText(/3行目: 必須項目/)).toBeVisible()
  await expect(importer.getByRole('alert')).toContainText('CSVを修正')
  await expect(importButton).toBeDisabled()

  await importer.getByRole('radio', { name: 'すべて置き換える' }).check()
  await expect(importButton).toBeDisabled()

  await uploader.setInputFiles({
    name: 'valid.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from([header, valid].join('\n'), 'utf8'),
  })
  await expect(importer.getByText('読み込めるブース：1件')).toBeVisible()
  await expect(importer.getByRole('alert')).toHaveCount(0)
  await expect(importButton).toBeEnabled()
})
