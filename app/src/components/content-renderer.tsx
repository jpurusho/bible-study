import { cn } from '@/lib/utils'

interface ContentRendererProps {
  html: string
  className?: string
}

export function ContentRenderer({ html, className }: ContentRendererProps) {
  return (
    <div
      className={cn(
        'prose prose-neutral dark:prose-invert max-w-none',
        // Pastel-themed headings
        'prose-h1:text-primary prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:border-primary/20 prose-h1:pb-2 prose-h1:mb-4',
        'prose-h2:text-primary/90 prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3',
        'prose-h3:text-primary/80 prose-h3:text-lg prose-h3:font-medium prose-h3:mt-6 prose-h3:mb-2',
        'prose-h4:text-primary/70 prose-h4:text-base prose-h4:font-medium',
        // Body text
        'prose-p:leading-7 prose-p:text-foreground/90',
        'prose-li:text-foreground/90',
        // Blockquote styling (scripture-like)
        'prose-blockquote:border-l-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic',
        'prose-blockquote:text-foreground/80',
        // Code blocks
        'prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl',
        'prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none',
        // Links
        'prose-a:text-primary prose-a:underline-offset-2 prose-a:decoration-primary/40 hover:prose-a:decoration-primary',
        // Images
        'prose-img:rounded-xl prose-img:shadow-sm prose-img:border prose-img:border-border',
        // Horizontal rule
        'prose-hr:border-primary/20',
        // Strong/emphasis
        'prose-strong:text-foreground prose-strong:font-semibold',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
