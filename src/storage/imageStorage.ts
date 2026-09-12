const DB_NAME = 'booth-navi-images'
const STORE_NAME = 'images'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('IndexedDBを利用できません。'))
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function transact<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode)
      let request: IDBRequest<T>
      let failure: DOMException | null = null
      // request成功では確定していない。abort時は参照を呼び出し元へ返さない。
      transaction.oncomplete = () => resolve(request.result)
      transaction.onabort = () => reject(transaction.error ?? failure ?? new Error('画像の保存処理が中断されました。'))
      transaction.onerror = () => { failure = transaction.error ?? failure }
      try {
        request = action(transaction.objectStore(STORE_NAME))
        request.onerror = () => { failure = request.error }
      } catch (error) {
        transaction.abort()
        reject(error)
      }
    })
  } finally {
    db.close()
  }
}

export const putImage = (id: string, blob: Blob) => transact('readwrite', (store) => store.put(blob, id))
export const getImage = (id: string) => transact<Blob | undefined>('readonly', (store) => store.get(id))
export const deleteImage = (id: string) => transact('readwrite', (store) => store.delete(id))
