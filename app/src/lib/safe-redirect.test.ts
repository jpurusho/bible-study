import { describe, expect, it } from 'vitest'
import { safeRedirectPath } from './safe-redirect'

describe('safeRedirectPath', () => {
  it('accepts internal application paths', () => {
    expect(safeRedirectPath('/books/acts?chapter=2')).toBe('/books/acts?chapter=2')
  })

  it.each([
    'https://example.com',
    '//example.com',
    '/\\example.com',
    'javascript:alert(1)',
    null,
  ])('rejects unsafe redirect %s', (value) => {
    expect(safeRedirectPath(value)).toBe('/home')
  })
})
