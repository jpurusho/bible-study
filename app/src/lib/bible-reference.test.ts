import { describe, expect, it } from 'vitest'
import { normalizeBibleReference } from './bible-reference'

describe('normalizeBibleReference', () => {
  it.each([
    'Acts 24',
    'Psalm 119:105',
    '2 Corinthians 4:7-9',
    'Acts 24:14-16; 26:6-8',
    'Romans 8:28–30',
  ])('accepts %s', (reference) => {
    expect(normalizeBibleReference(reference)).toBe(reference)
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeBibleReference('  Acts 24  ')).toBe('Acts 24')
  })

  it.each([
    null,
    '',
    '   ',
    'Acts 24?redirect=https://example.com',
    'Acts 24\nInjected',
    `Acts ${'2'.repeat(101)}`,
  ])('rejects an invalid reference', (reference) => {
    expect(normalizeBibleReference(reference)).toBeNull()
  })
})
