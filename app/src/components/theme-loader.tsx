'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

interface ThemeLoaderProps {
  savedTheme: string | null
  savedFontSize: string | null
}

export function ThemeLoader({ savedTheme, savedFontSize }: ThemeLoaderProps) {
  const { setTheme, theme } = useTheme()

  useEffect(() => {
    if (savedTheme && savedTheme !== 'system' && !theme) {
      setTheme(savedTheme)
    }
    if (savedFontSize) {
      const fontSizeMap: Record<string, string> = {
        small: '14px',
        medium: '16px',
        large: '18px',
        'x-large': '20px',
      }
      if (fontSizeMap[savedFontSize]) {
        localStorage.setItem('bible-study-font-size', savedFontSize)
        document.documentElement.style.setProperty('--font-size-base', fontSizeMap[savedFontSize])
      }
    }
  }, [savedTheme, savedFontSize, setTheme, theme])

  return null
}
