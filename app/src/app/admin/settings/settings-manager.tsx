'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Save, Eye, EyeOff, Key } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  initialSettings: Record<string, string>
}

export function SettingsManager({ initialSettings }: Props) {
  const [anthropicKey, setAnthropicKey] = useState(initialSettings['anthropic_api_key'] || '')
  const [esvKey, setEsvKey] = useState(initialSettings['esv_api_key'] || '')
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)
  const [showEsvKey, setShowEsvKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const aiUsage = initialSettings['ai_usage'] ? JSON.parse(initialSettings['ai_usage']) : null

  async function handleSave() {
    setSaving(true)

    const updates = [
      { key: 'anthropic_api_key', value: JSON.stringify(anthropicKey) },
      { key: 'esv_api_key', value: JSON.stringify(esvKey) },
    ]

    for (const { key, value } of updates) {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() })

      if (error) {
        toast.error(`Failed to save ${key}: ${error.message}`)
        setSaving(false)
        return
      }
    }

    toast.success('Settings saved')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="size-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Configure external service integrations. Keys are stored securely in the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="anthropic_key">Anthropic API Key (for AI content generation)</Label>
            <div className="flex gap-2">
              <Input
                id="anthropic_key"
                type={showAnthropicKey ? 'text' : 'password'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="font-mono text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAnthropicKey(!showAnthropicKey)}
              >
                {showAnthropicKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used for "Generate from Images" feature in the session editor. Get a key from console.anthropic.com.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="esv_key">ESV API Key (for scripture lookups)</Label>
            <div className="flex gap-2">
              <Input
                id="esv_key"
                type={showEsvKey ? 'text' : 'password'}
                value={esvKey}
                onChange={(e) => setEsvKey(e.target.value)}
                placeholder="Token..."
                className="font-mono text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEsvKey(!showEsvKey)}
              >
                {showEsvKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used for scripture reference expansion. Get a key from api.esv.org.
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {aiUsage && (
        <Card>
          <CardHeader>
            <CardTitle>AI Usage</CardTitle>
            <CardDescription>Token consumption for content generation.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{aiUsage.scans || 0}</p>
                <p className="text-xs text-muted-foreground">Generations</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{((aiUsage.input || 0) / 1000).toFixed(1)}k</p>
                <p className="text-xs text-muted-foreground">Input Tokens</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{((aiUsage.output || 0) / 1000).toFixed(1)}k</p>
                <p className="text-xs text-muted-foreground">Output Tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
