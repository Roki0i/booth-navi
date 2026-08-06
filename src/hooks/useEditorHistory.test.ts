import { describe, expect, it } from 'vitest'
import { historyRedo, historyUndo } from './useEditorHistory'

describe('編集履歴', () => {
  it('undoできる', () => expect(historyUndo([[1]], [2], []).present).toEqual([1]))
  it('redoできる', () => expect(historyRedo([[1]], [2], [[3]]).present).toEqual([3]))
})
