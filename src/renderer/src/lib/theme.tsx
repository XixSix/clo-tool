import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'clo-theme'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Provider đổi theme Light/Dark — lớp .dark trên <html>, nhớ trong localStorage */
export function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    window.document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // localStorage không khả dụng — bỏ qua
    }
  }, [theme])

  const setTheme = (t: Theme): void => setThemeState(t)
  const toggle = (): void => setThemeState(theme === 'dark' ? 'light' : 'dark')

  return <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme phải nằm trong <ThemeProvider>')
  return ctx
}

export function hasBridge(): boolean {
  return typeof window !== 'undefined' && 'api' in window
}
