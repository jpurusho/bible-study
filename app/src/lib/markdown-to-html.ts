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
  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>')
  // Paragraphs (lines that aren't already tagged)
  html = html.replace(/^(?!<[hbulo]|<li|<hr)(.+)$/gm, '<p>$1</p>')
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '')
  return html
}
