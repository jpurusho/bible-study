export function safeRedirectPath(value: string | null | undefined, fallback = '/home') {
  if (!value) return fallback
  try {
    const decoded = decodeURIComponent(value)
    if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\') || /\s/.test(decoded)) {
      return fallback
    }
    return decoded
  } catch {
    return fallback
  }
}
