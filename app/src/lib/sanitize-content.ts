import sanitizeHtml from 'sanitize-html'

const allowedTags = [
  'h1', 'h2', 'h3', 'h4', 'p', 'blockquote', 'strong', 'em', 'ul', 'ol', 'li',
  'br', 'hr', 'a', 'img', 'code', 'pre', 'span', 'table', 'thead', 'tbody', 'tr',
  'th', 'td',
]

export function sanitizeContentHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      '*': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {}),
        },
      }),
    },
  })
}
