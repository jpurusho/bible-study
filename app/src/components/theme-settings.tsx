'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Palette, Type } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

const FONT_SIZE_KEY = 'bible-study-font-size'

type FontSize = 'small' | 'medium' | 'large' | 'x-large'

const fontSizeMap: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
  'x-large': '20px',
}

const fontSizeLabels: Record<FontSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  'x-large': 'X-Large',
}

const themes = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    previewBg: 'bg-white',
    previewText: 'text-gray-900',
    previewAccent: 'bg-indigo-50',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    previewBg: 'bg-gray-900',
    previewText: 'text-gray-100',
    previewAccent: 'bg-indigo-900',
  },
  {
    value: 'sepia',
    label: 'Sepia',
    icon: Palette,
    previewBg: 'bg-amber-50',
    previewText: 'text-amber-950',
    previewAccent: 'bg-amber-100',
  },
  {
    value: 'dark-slate',
    label: 'Slate',
    icon: Moon,
    previewBg: 'bg-slate-900',
    previewText: 'text-sky-100',
    previewAccent: 'bg-sky-900',
  },
  {
    value: 'dark-forest',
    label: 'Forest',
    icon: Moon,
    previewBg: 'bg-emerald-950',
    previewText: 'text-emerald-100',
    previewAccent: 'bg-emerald-900',
  },
  {
    value: 'dark-rose',
    label: 'Rose',
    icon: Moon,
    previewBg: 'bg-rose-950',
    previewText: 'text-rose-100',
    previewAccent: 'bg-rose-900',
  },
  {
    value: 'gradient-sunset',
    label: 'Sunset',
    icon: Palette,
    previewBg: 'bg-gradient-to-br from-orange-950 to-purple-950',
    previewText: 'text-orange-100',
    previewAccent: 'bg-orange-900/50',
  },
  {
    value: 'gradient-ocean',
    label: 'Ocean',
    icon: Palette,
    previewBg: 'bg-gradient-to-br from-blue-950 to-teal-950',
    previewText: 'text-cyan-100',
    previewAccent: 'bg-cyan-900/50',
  },
  {
    value: 'gradient-aurora',
    label: 'Aurora',
    icon: Palette,
    previewBg: 'bg-gradient-to-br from-purple-950 to-green-950',
    previewText: 'text-green-100',
    previewAccent: 'bg-green-900/50',
  },
] as const

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const [fontSize, setFontSize] = useState<FontSize>('medium')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(FONT_SIZE_KEY) as FontSize | null
    if (stored && stored in fontSizeMap) {
      setFontSize(stored)
      document.documentElement.style.setProperty('--font-size-base', fontSizeMap[stored])
    }
  }, [])

  async function saveThemeToProfile(newTheme: string) {
    setTheme(newTheme)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ theme: { mode: newTheme, fontSize } })
        .eq('id', user.id)
    }
  }

  async function handleFontSizeChange(size: FontSize) {
    setFontSize(size)
    localStorage.setItem(FONT_SIZE_KEY, size)
    document.documentElement.style.setProperty('--font-size-base', fontSizeMap[size])

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ theme: { mode: theme || 'system', fontSize: size } })
        .eq('id', user.id)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how the app looks and feels. Your preferences sync across devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <Sun className="size-4" />
            Theme
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {themes.map((t) => {
              const Icon = t.icon
              const isActive = theme === t.value
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => saveThemeToProfile(t.value)}
                  className={cn(
                    'group relative flex flex-col items-center gap-2 rounded-lg border p-3 transition-all',
                    isActive
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-16 w-full flex-col items-start justify-between rounded-md border p-2',
                      t.previewBg
                    )}
                  >
                    <div className={cn('h-1.5 w-8 rounded-full', t.previewAccent)} />
                    <div className="flex w-full flex-col gap-1">
                      <div className={cn('h-1 w-full rounded-full', t.previewAccent)} />
                      <div className={cn('h-1 w-3/4 rounded-full', t.previewAccent)} />
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <Icon className="size-3" />
                    {t.label}
                  </span>
                  {isActive && (
                    <div className="absolute -top-1 -right-1 size-3 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <Type className="size-4" />
            Font Size
          </h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(fontSizeMap) as FontSize[]).map((size) => (
              <Button
                key={size}
                variant={fontSize === size ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFontSizeChange(size)}
              >
                {fontSizeLabels[size]}
              </Button>
            ))}
          </div>
          <div className="rounded-md border bg-muted/50 p-3">
            <p
              className="text-foreground transition-all"
              style={{ fontSize: fontSizeMap[fontSize] }}
            >
              The quick brown fox jumps over the lazy dog.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
