import { useCallback, useState } from 'react'
import { applyUiTheme, getInitialUiTheme, saveUiTheme, type UiTheme } from '../utils/uiTheme'

export function useUiTheme() {
  const [theme, setTheme] = useState<UiTheme>(() => getInitialUiTheme({
    storage: window.localStorage,
    matchMedia: window.matchMedia.bind(window),
  }))

  const selectTheme = useCallback((nextTheme: UiTheme) => {
    applyUiTheme(nextTheme, document.documentElement, document.querySelector<HTMLMetaElement>('meta[name="theme-color"]'))
    saveUiTheme(nextTheme, window.localStorage)
    setTheme(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    selectTheme(theme === 'light' ? 'dark' : 'light')
  }, [selectTheme, theme])

  return { theme, toggleTheme }
}
