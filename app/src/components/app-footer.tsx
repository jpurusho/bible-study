export function AppFooter() {
  return (
    <footer className="border-t py-6 mt-12">
      <div className="w-full max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>Bible Study &copy; {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}
