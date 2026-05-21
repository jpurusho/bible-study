export function AppFooter() {
  return (
    <footer className="border-t border-border/50 py-8 pb-20 sm:pb-8 mt-auto">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
        <p className="text-sm italic text-muted-foreground">
          &ldquo;I rejoice in your word like one who discovers a great treasure.&rdquo;
        </p>
        <p className="text-xs text-muted-foreground/70">
          Psalm 119:162 &middot; CCI San Ramon Bible Study &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
