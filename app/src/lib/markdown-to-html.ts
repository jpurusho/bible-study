/**
 * Group consecutive list lines into proper <ol> or <ul> blocks.
 * Ordered list lines (e.g. "1. text") become <ol>, unordered ("- text" / "* text") become <ul>.
 * Non-list lines pass through unchanged.
 */
function groupLines(lines: string[]): string {
  const result: string[] = []
  let i = 0
  while (i < lines.length) {
    if (/^\d+\.\s/.test(lines[i])) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`<li>${lines[i].replace(/^\d+\.\s/, '')}</li>`)
        i++
      }
      result.push(`<ol>${items.join('')}</ol>`)
    } else if (/^[-*]\s/.test(lines[i])) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(`<li>${lines[i].replace(/^[-*]\s/, '')}</li>`)
        i++
      }
      result.push(`<ul>${items.join('')}</ul>`)
    } else {
      result.push(lines[i])
      i++
    }
  }
  return result.join('\n')
}

export function markdownToHtml(md: string): string {
  let html = md
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>')
  // Lists: use the state-machine grouper so ordered lists become <ol>
  html = groupLines(html.split('\n'))
  // Paragraphs (lines that aren't already tagged)
  html = html.replace(/^(?!<[hbulo]|<li|<hr)(.+)$/gm, '<p>$1</p>')
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '')
  return html
}
