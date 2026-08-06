import { describe, expect, it } from 'vitest'
import { isValidExternalLink } from './externalLink'

describe('isValidExternalLink', () => {
  it.each([
    '',
    '   ',
    'https://x.com/',
    'https://x.com',
    'https://example.com/',
    'not a url',
    '/relative-path',
    'javascript:alert(1)',
  ])('未登録または利用できないURLを無効と判定する: %s', (value) => {
    expect(isValidExternalLink(value)).toBe(false)
  })

  it.each([
    'https://x.com/example',
    'https://shop.example.com/',
    'http://example.com/',
    ' https://example.com/item/1 ',
  ])('有効な外部URLを有効と判定する: %s', (value) => {
    expect(isValidExternalLink(value)).toBe(true)
  })
})
