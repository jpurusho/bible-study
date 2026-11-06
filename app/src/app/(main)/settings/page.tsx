import { ThemeSettings } from '@/components/theme-settings'
import { Breadcrumbs } from '@/components/breadcrumbs'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Settings' }]} />
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Customize your reading experience.</p>
      </div>
      <ThemeSettings />

      <div className="rounded-xl border border-border/50 bg-card/50 p-4">
        <p className="text-sm font-medium text-muted-foreground">App Version</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">
          v{process.env.NEXT_PUBLIC_APP_VERSION ?? '—'}
        </p>
      </div>
    </div>
  )
}
