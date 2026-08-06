import type { UiTheme } from '../utils/uiTheme'

interface UiThemeSwitchProps {
  theme: UiTheme
  onToggle: () => void
}

export function UiThemeSwitch({ theme, onToggle }: UiThemeSwitchProps) {
  const isDark = theme === 'dark'
  const label = isDark ? 'ライトテーマへ切り替える' : 'ダークテーマへ切り替える'

  return (
    <button
      className="ui-theme-toggle"
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      title={label}
      onClick={onToggle}
    >
      <span className="ui-theme-icon ui-theme-moon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M15.8 17.7A7.5 7.5 0 0 1 7 8.2a7.6 7.6 0 1 0 8.8 9.5Z" />
          <path className="theme-star" d="m16.8 4 .7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7.7-1.7Zm3.1 6.2.4 1 .9.4-.9.4-.4 1-.4-1-.9-.4.9-.4.4-1Z" />
        </svg>
      </span>
      <span className="ui-theme-icon ui-theme-sun" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9 7 7m10 10 2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
        </svg>
      </span>
      <span className="ui-theme-thumb" aria-hidden="true" />
    </button>
  )
}
