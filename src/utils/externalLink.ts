const PLACEHOLDER_URLS = new Set([
  'https://x.com/',
  'https://example.com/',
])

export function isValidExternalLink(value: string): boolean {
  const trimmedValue = value.trim()
  if (!trimmedValue) return false

  try {
    const url = new URL(trimmedValue)
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && !PLACEHOLDER_URLS.has(url.href)
  } catch {
    return false
  }
}
