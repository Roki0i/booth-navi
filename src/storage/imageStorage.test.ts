import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { putImage, getImage, deleteImage } from './imageStorage'

// request成功とtransaction確定/中断を別々に発火するIDB境界。
let request: { result?: unknown; error?: Error; onsuccess?: () => void; onerror?: () => void }
let transaction: { error?: Error; oncomplete?: () => void; onabort?: () => void; onerror?: () => void; objectStore: ReturnType<typeof vi.fn>; abort: ReturnType<typeof vi.fn> }
let close: ReturnType<typeof vi.fn>
let start: ReturnType<typeof vi.fn>
beforeEach(() => {
  request = {}
  const store = { put: () => request, get: () => request, delete: () => request }
  transaction = { objectStore: vi.fn(() => store), abort: vi.fn() }
  close = vi.fn()
  start = vi.fn(() => transaction)
  vi.stubGlobal('indexedDB', { open: () => {
    const open = { result: { transaction: start, close }, onsuccess: () => {} }
    queueMicrotask(() => open.onsuccess())
    return open
  } })
})
afterEach(() => vi.unstubAllGlobals())
it.each(['put', 'get', 'delete'])('%sはrequest成功後もtransaction完了まで待つ', async (operation) => {
  const result = operation === 'put' ? putImage('new', new Blob(['new'])) : operation === 'get' ? getImage('old') : deleteImage('old')
  const settled = vi.fn()
  void result.then(settled)
  await new Promise<void>((resolve) => queueMicrotask(resolve))
  request.result = operation === 'get' ? new Blob(['old']) : 'new'
  request.onsuccess?.()
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(settled).not.toHaveBeenCalled()
  transaction.oncomplete?.()
  await expect(result).resolves.toBe(request.result)
  expect(close).toHaveBeenCalledOnce()
})
it('request成功後のabortを保存失敗として返す', async () => {
  const result = putImage('new', new Blob(['new']))
  const assertion = expect(result).rejects.toThrow('aborted')
  await new Promise<void>((resolve) => queueMicrotask(resolve))
  request.onsuccess?.()
  transaction.error = new Error('aborted')
  transaction.onabort?.()
  await assertion
  expect(close).toHaveBeenCalledOnce()
})
it('requestエラーとabortでrejectし接続を閉じる', async () => {
  const result = putImage('new', new Blob())
  const assertion = expect(result).rejects.toThrow('quota')
  await new Promise<void>((resolve) => queueMicrotask(resolve))
  request.error = new Error('quota')
  request.onerror?.()
  transaction.onabort?.()
  await assertion
  expect(close).toHaveBeenCalledOnce()
})
it('transaction作成例外でも接続を閉じる', async () => {
  start.mockImplementation(() => { throw new Error('closed') })
  await expect(getImage('old')).rejects.toThrow('closed')
  expect(close).toHaveBeenCalledOnce()
})

it('エラー情報のないabortもrejectする', async () => {
  const result = deleteImage('old')
  const assertion = expect(result).rejects.toThrow('中断')
  await new Promise<void>((resolve) => queueMicrotask(resolve))
  transaction.onabort?.()
  await assertion
  expect(close).toHaveBeenCalledOnce()
})
it('request作成例外はtransactionを中断して接続を閉じる', async () => {
  transaction.objectStore.mockImplementation(() => { throw new Error('invalid') })
  await expect(putImage('new', new Blob())).rejects.toThrow('invalid')
  expect(transaction.abort).toHaveBeenCalledOnce()
  expect(close).toHaveBeenCalledOnce()
})
