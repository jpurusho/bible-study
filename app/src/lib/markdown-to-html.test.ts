import { describe, it, expect } from 'vitest'
import { markdownToHtml } from './markdown-to-html'

describe('markdownToHtml', () => {
  describe('ordered lists', () => {
    it('converts ordered list items to <ol><li> elements', () => {
      const result = markdownToHtml('1. First\n2. Second')
      expect(result).toContain('<ol><li>First</li><li>Second</li></ol>')
      expect(result).not.toContain('<ul>')
    })

    it('wraps a single ordered item in <ol>', () => {
      const result = markdownToHtml('1. Only item')
      expect(result).toContain('<ol><li>Only item</li></ol>')
    })
  })

  describe('unordered lists', () => {
    it('converts dash-prefixed lines to <ul><li> elements', () => {
      const result = markdownToHtml('- Item\n- Item 2')
      expect(result).toContain('<ul><li>Item</li><li>Item 2</li></ul>')
      expect(result).not.toContain('<ol>')
    })

    it('converts asterisk-prefixed lines to <ul><li> elements', () => {
      const result = markdownToHtml('* Alpha\n* Beta')
      expect(result).toContain('<ul><li>Alpha</li><li>Beta</li></ul>')
    })
  })

  describe('mixed content', () => {
    it('handles ordered list followed by paragraph followed by unordered list', () => {
      const input = '1. Step one\n2. Step two\n\nSome prose here.\n\n- Bullet A\n- Bullet B'
      const result = markdownToHtml(input)
      expect(result).toContain('<ol><li>Step one</li><li>Step two</li></ol>')
      expect(result).toContain('<ul><li>Bullet A</li><li>Bullet B</li></ul>')
      expect(result).toContain('<p>Some prose here.</p>')
      // ordered list must not appear inside a <ul>
      const olIndex = result.indexOf('<ol>')
      const ulIndex = result.indexOf('<ul>')
      expect(olIndex).toBeGreaterThan(-1)
      expect(ulIndex).toBeGreaterThan(-1)
      expect(olIndex).toBeLessThan(ulIndex)
    })
  })

  describe('headers', () => {
    it('converts # to <h1>', () => {
      expect(markdownToHtml('# Title')).toContain('<h1>Title</h1>')
    })

    it('converts ## to <h2>', () => {
      expect(markdownToHtml('## Sub')).toContain('<h2>Sub</h2>')
    })

    it('converts ### to <h3>', () => {
      expect(markdownToHtml('### Minor')).toContain('<h3>Minor</h3>')
    })
  })

  describe('inline formatting', () => {
    it('converts **text** to <strong>', () => {
      expect(markdownToHtml('**bold**')).toContain('<strong>bold</strong>')
    })

    it('converts *text* to <em>', () => {
      expect(markdownToHtml('*italic*')).toContain('<em>italic</em>')
    })
  })

  describe('blockquotes', () => {
    it('converts > text to blockquote', () => {
      expect(markdownToHtml('> A quote')).toContain('<blockquote><p>A quote</p></blockquote>')
    })
  })

  describe('horizontal rules', () => {
    it('converts --- to <hr>', () => {
      expect(markdownToHtml('---')).toContain('<hr>')
    })
  })

  describe('paragraphs', () => {
    it('wraps plain text in <p>', () => {
      expect(markdownToHtml('Hello world')).toContain('<p>Hello world</p>')
    })
  })
})
