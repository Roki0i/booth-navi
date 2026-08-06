import type { Booth } from './booth'

export type AppMode = 'view' | 'edit'
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
export type EditorAction =
  | { type: 'move'; before: Booth[]; after: Booth[] }
  | { type: 'resize'; before: Booth[]; after: Booth[] }
  | { type: 'change'; before: Booth[]; after: Booth[] }
