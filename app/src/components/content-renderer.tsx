import { cn } from '@/lib/utils'

interface ContentRendererProps {
  html: string
  className?: string
}

function addHeadingIds(html: string): string {
  return html.replace(/<h([1-4])([^>]*)>(.*?)<\/h[1-4]>/gi, (match, level, attrs, content) => {
    const text = content.replace(/<[^>]*>/g, '').trim()
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`
  })
}

export function ContentRenderer({ html, className }: ContentRendererProps) {
  const processedHtml = addHeadingIds(html)

  return (
    <div className="rounded-2xl bg-card/50 border border-border/50 p-6 sm:p-8 shadow-sm">
      <div
        className={cn(
          'prose prose-neutral dark:prose-invert max-w-none',
          // Headings with pastel primary color + scroll offset for sticky header
          'prose-h1:text-primary prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:border-primary/20 prose-h1:pb-3 prose-h1:mb-6 prose-h1:scroll-mt-20',
          'prose-h2:text-primary/90 prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4 prose-h2:scroll-mt-20',
          'prose-h3:text-primary/80 prose-h3:text-lg prose-h3:font-medium prose-h3:mt-8 prose-h3:mb-3 prose-h3:scroll-mt-20',
          'prose-h4:text-primary/70 prose-h4:text-base prose-h4:font-medium prose-h4:mt-6 prose-h4:scroll-mt-20',
          // Body text — generous line height for readability
          'prose-p:leading-8 prose-p:text-foreground/85 prose-p:mb-4',
          'prose-li:text-foreground/85 prose-li:leading-7',
          // Blockquotes styled like scripture passages
          'prose-blockquote:border-l-4 prose-blockquote:border-l-primary/30',
          'prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl',
          'prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:my-6',
          'prose-blockquote:not-italic prose-blockquote:text-foreground/80',
          'prose-blockquote:shadow-sm',
          // Code blocks
          'prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl',
          'prose-code:text-primary prose-code:bg-primary/8 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none',
          // Links
          'prose-a:text-primary prose-a:underline-offset-3 prose-a:decoration-primary/30 hover:prose-a:decoration-primary prose-a:font-medium',
          // Images
          'prose-img:rounded-xl prose-img:shadow-md prose-img:border prose-img:border-border',
          // Horizontal rule
          'prose-hr:border-primary/15 prose-hr:my-8',
          // Strong/emphasis
          'prose-strong:text-foreground prose-strong:font-semibold',
          // Lists
          'prose-ol:pl-5 prose-ul:pl-5',
          className
        )}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    </div>
  )
}
