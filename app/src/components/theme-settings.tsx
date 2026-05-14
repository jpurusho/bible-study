'use client'

/**
 * Theme Settings Component
 *
 * CSS to add to src/app/globals.css for sepia support:
 *
 * .sepia {
 *   --background: 44 30% 96%;
 *   --foreground: 30 20% 15%;
 *   --card: 40 33% 94%;
 *   --card-foreground: 30 20% 15%;
 *   --popover: 40 33% 94%;
 *   --popover-foreground: 30 20% 15%;
 *   --primary: 30 60% 40%;
 *   --primary-foreground: 44 30% 96%;
 *   --secondary: 35 25% 88%;
 *   --secondary-foreground: 30 20% 20%;
 *   --muted: 38 20% 90%;
 *   --muted-foreground: 30 15% 40%;
 *   --accent: 35 25% 88%;
 *   --accent-foreground: 30 20% 20%;
 *   --destructive: 0 72% 51%;
 *   --border: 35 20% 82%;
 *   --input: 35 20% 82%;
 *   --ring: 30 60% 40%;
 * }
 */

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Palette, Type } from 'lucide-react'

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

  // Persist font size changes
  function handleFontSizeChange(size: FontSize) {
    setFontSize(size)
    localStorage.setItem(FONT_SIZE_KEY, size)
    document.documentElement.style.setProperty('--font-size-base', fontSizeMap[size])
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how the app looks and feels.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
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
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'group relative flex flex-col items-center gap-2 rounded-lg border p-3 transition-all',
                    isActive
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {/* Preview Card */}
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
                  {/* Label */}
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <Icon className="size-3" />
                    {t.label}
                  </span>
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 size-3 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Font Size Selection */}
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
          {/* Font size preview */}
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
