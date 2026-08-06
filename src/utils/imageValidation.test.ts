import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_SIZE, validateImage } from './imageValidation'

describe('画像検証', () => {
  it('PNG/JPEG/WebPを許可する', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) expect(validateImage({ type, size: 10 }).valid).toBe(true)
  })
  it('対応外形式を拒否する', () => expect(validateImage({ type: 'image/gif', size: 10 }).valid).toBe(false))
  it('サイズ超過を警告する', () => expect(validateImage({ type: 'image/png', size: MAX_IMAGE_SIZE + 1 }).warning).toBeTruthy())
})
