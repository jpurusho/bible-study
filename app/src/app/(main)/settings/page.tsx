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
    </div>
  )
}
