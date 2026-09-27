import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CheckCircle2, Key, XCircle } from 'lucide-react'

interface Props {
  configured: { anthropic: boolean; esv: boolean }
  aiUsage: { input?: number; output?: number; scans?: number } | null
}

export function SettingsManager({ configured, aiUsage }: Props) {
  const integrations = [
    ['Anthropic', configured.anthropic],
    ['ESV API', configured.esv],
  ] as const

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="size-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Secret values are hidden from the browser. Configure ANTHROPIC_API_KEY and ESV_API_KEY in the deployment environment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map(([name, ready]) => (
            <div key={name} className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm font-medium">{name}</span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                {ready ? <CheckCircle2 className="size-4 text-green-600" /> : <XCircle className="size-4 text-destructive" />}
                {ready ? 'Configured' : 'Not configured'}
              </span>
            </div>
          ))}
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
