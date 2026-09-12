// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { booths } from '../data/booths'
import { SearchBox } from './SearchBox'

let root: Root
let container: HTMLDivElement
let input: HTMLInputElement
const onSelect = vi.fn()
const target = booths.find((booth) => booth.boothNumber === 'B27')!

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  onSelect.mockClear()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => root.render(<SearchBox booths={booths} selectedBooth={booths[0]} onSelect={onSelect} />))
  input = container.querySelector('input')!
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

function typeQuery(value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(container.querySelectorAll('#search-results li').length).toBeGreaterThan(0)
}

function pressEnter(options: KeyboardEventInit = {}) {
  act(() => { input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', ...options })) })
}

it('IME変換中のEnterでは候補を選択せず検索文字列を維持する', () => {
  act(() => { input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })) })
  typeQuery('薄荷')
  pressEnter({ isComposing: true })
  expect(onSelect).not.toHaveBeenCalled()
  expect(input.value).toBe('薄荷')
})

it('IME処理を示すkeyCode 229のEnterでも候補を選択しない', () => {
  typeQuery('薄荷')
  pressEnter({ isComposing: false, keyCode: 229 })
  expect(onSelect).not.toHaveBeenCalled()
  expect(input.value).toBe('薄荷')
})

it('通常のEnterで先頭候補を一度選択する', () => {
  typeQuery('B27')
  pressEnter()
  expect(onSelect).toHaveBeenCalledExactlyOnceWith(target)
  expect(input.value).toBe(`B27 ${target.circleName}`)
})

it('日本語の変換確定後のEnterで先頭候補を一度選択する', () => {
  act(() => { input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })) })
  typeQuery('薄荷')
  pressEnter({ isComposing: true })
  act(() => { input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '薄荷' })) })
  expect(onSelect).not.toHaveBeenCalled()
  pressEnter({ isComposing: false })
  expect(onSelect).toHaveBeenCalledExactlyOnceWith(target)
  expect(input.value).toBe(`B27 ${target.circleName}`)
})
