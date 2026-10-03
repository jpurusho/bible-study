const BIBLE_REFERENCE_PATTERN = /^[0-9A-Za-z .,:;\-–]+$/
const MAX_REFERENCE_LENGTH = 100

export function normalizeBibleReference(value: string | null): string | null {
  const reference = value?.trim()
  if (!reference || reference.length > MAX_REFERENCE_LENGTH) return null
  return BIBLE_REFERENCE_PATTERN.test(reference) ? reference : null
}
