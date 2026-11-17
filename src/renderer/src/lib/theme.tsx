import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export type ColorTheme = 'default' | 'cappuccino' | 'night-sands' | 'amber-obsidian' | 'magma-obsidian'

export interface ColorThemeOption {
  id: ColorTheme
  label: string
  /** Ba màu đại diện hiển thị trong bộ chọn. */
  swatch: [string, string, string]
  /** Màu nền thanh tiêu đề theo chế độ sáng/tối. */
  titleBar: { light: string; dark: string }
}

export const COLOR_THEMES: ColorThemeOption[] = [
  {
    id: 'default',
    label: 'Mặc định',
    swatch: ['#f5f5f5', '#a3a3a3', '#171717'],
    titleBar: { light: '#ffffff', dark: '#0f0f0f' }
  },
  {
    id: 'cappuccino',
    label: 'Cappuccino',
    swatch: ['#705e46', '#a98a5c', '#d6b588'],
    titleBar: { light: '#fbfbfb', dark: '#1a1a1a' }
  },
  {
    id: 'night-sands',
    label: 'Night sands',
    swatch: ['#574a24', '#8a7c3f', '#fae8b4'],
    titleBar: { light: '#fbfbfb', dark: '#1a1a1a' }
  },
  {
    id: 'amber-obsidian',
    label: 'Amber obsidian',
    swatch: ['#691f0c', '#b8442a', '#e0795b'],
    titleBar: { light: '#fbfbfb', dark: '#1a1a1a' }
  },
  {
    id: 'magma-obsidian',
    label: 'Magma obsidian',
    swatch: ['#3c3c4c', '#9da1aa', '#b7b6ac'],
    titleBar: { light: '#fbfbfb', dark: '#1a1a1a' }
  }
]

const THEME_KEY = 'clo-theme'
const PALETTE_KEY = 'clo-color-theme'

function readTheme(): Theme {
  try {
    return window.localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function readPalette(): ColorTheme {
  try {
    const saved = window.localStorage.getItem(PALETTE_KEY)
    return COLOR_THEMES.some((option) => option.id === saved) ? (saved as ColorTheme) : 'default'
  } catch {
    return 'default'
  }
}

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  colorTheme: ColorTheme
  setColorTheme: (t: ColorTheme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Provider đổi chế độ sáng/tối và bảng màu; ghi nhớ qua localStorage. */
export function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [theme, setThemeState] = useState<Theme>(readTheme)
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(readPalette)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    if (colorTheme === 'default') root.removeAttribute('data-theme')
    else root.dataset.theme = colorTheme

    const palette = COLOR_THEMES.find((option) => option.id === colorTheme) ?? COLOR_THEMES[0]
    void window.api?.setTitleBarTheme?.(theme, palette.titleBar[theme])
    try {
      window.localStorage.setItem(THEME_KEY, theme)
      window.localStorage.setItem(PALETTE_KEY, colorTheme)
    } catch {
      // localStorage không khả dụng — bỏ qua
    }
  }, [theme, colorTheme])

  const setTheme = (t: Theme): void => setThemeState(t)
  const setColorTheme = (t: ColorTheme): void => setColorThemeState(t)

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme phải nằm trong <ThemeProvider>')
  return ctx
}

export function hasBridge(): boolean {
  return typeof window !== 'undefined' && 'api' in window
}
