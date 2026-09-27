import { createClient } from '@/lib/supabase/server'
import { SettingsManager } from './settings-manager'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['anthropic_api_key', 'esv_api_key', 'ai_usage'])

  const settingsMap: Record<string, string> = {}
  for (const s of settings ?? []) {
    settingsMap[s.key] = typeof s.value === 'string' ? s.value.replace(/"/g, '') : JSON.stringify(s.value)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Configure API keys and integrations.</p>
      </div>
      <SettingsManager
        aiUsage={settingsMap.ai_usage ? JSON.parse(settingsMap.ai_usage) : null}
        configured={{
          anthropic: Boolean(process.env.ANTHROPIC_API_KEY || settingsMap.anthropic_api_key),
          esv: Boolean(process.env.ESV_API_KEY || settingsMap.esv_api_key),
        }}
      />
    </div>
  )
}
