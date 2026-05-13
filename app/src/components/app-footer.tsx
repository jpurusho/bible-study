export function AppFooter() {
  return (
    <footer className="border-t border-border/50 py-8 mt-auto">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
        <p>Bible Study &copy; {new Date().getFullYear()} &middot; Built with love for the community</p>
      </div>
    </footer>
  )
}
