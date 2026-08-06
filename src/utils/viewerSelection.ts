export interface ViewerSelection {
  selectedId: string
  isSheetOpen: boolean
}

export function selectViewerBooth(boothId: string, isNarrow: boolean): ViewerSelection {
  return { selectedId: boothId, isSheetOpen: isNarrow }
}

export function closeViewerSheet(selectedId: string): ViewerSelection {
  return { selectedId, isSheetOpen: false }
}

export function isSheetCloseKey(key: string) {
  return key === 'Escape'
}
