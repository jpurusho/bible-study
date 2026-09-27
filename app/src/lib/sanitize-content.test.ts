import { describe, expect, it } from 'vitest'
import { sanitizeContentHtml } from './sanitize-content'

describe('sanitizeContentHtml', () => {
  it('preserves study formatting', () => {
    const html = '<h2>Grace</h2><blockquote><p><strong>Truth</strong></p></blockquote>'
    expect(sanitizeContentHtml(html)).toBe(html)
  })

  it('removes scripts, event handlers, unsafe links, and iframes', () => {
    const html = '<script>alert(1)</script><img src="https://example.com/a.jpg" onerror="alert(1)"><a href="javascript:alert(1)">bad</a><iframe src="https://evil.example"></iframe>'
    const result = sanitizeContentHtml(html)

    expect(result).not.toContain('<script')
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('javascript:')
    expect(result).not.toContain('<iframe')
    expect(result).toContain('https://example.com/a.jpg')
  })
})
