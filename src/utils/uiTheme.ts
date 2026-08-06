export const UI_THEME_STORAGE_KEY = 'booth-navi-ui-theme'

export type UiTheme = 'light' | 'dark'

export interface ThemeEnvironment {
  storage?: Pick<Storage, 'getItem' | 'setItem'>
  matchMedia?: (query: string) => Pick<MediaQueryList, 'matches'>
}

export const isUiTheme = (value: unknown): value is UiTheme =>
  value === 'light' || value === 'dark'

export function getInitialUiTheme(environment: ThemeEnvironment = {}): UiTheme {
  try {
    const saved = environment.storage?.getItem(UI_THEME_STORAGE_KEY)
    if (isUiTheme(saved)) return saved
  } catch {
    // Storage can be unavailable in privacy modes; the OS preference remains usable.
  }
  return environment.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyUiTheme(
  theme: UiTheme,
  root: Pick<HTMLElement, 'dataset'>,
  themeColor?: Pick<HTMLMetaElement, 'content'> | null,
): void {
  root.dataset.uiTheme = theme
  if (themeColor) themeColor.content = theme === 'dark' ? '#17171b' : '#f7f5ef'
}

export function saveUiTheme(theme: UiTheme, storage?: Pick<Storage, 'setItem'>): void {
  try {
    storage?.setItem(UI_THEME_STORAGE_KEY, theme)
  } catch {
    // The selected theme still applies for the current page when storage is blocked.
  }
}
