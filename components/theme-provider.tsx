'use client'

import * as React from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: 'class' | 'data-theme'
  defaultTheme?: Theme
  enableSystem?: boolean
  storageKey?: string
  themes?: Theme[]
  disableTransitionOnChange?: boolean
}

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
  systemTheme: 'light' | 'dark'
  themes: Theme[]
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme, attribute: 'class' | 'data-theme', themes: Theme[]) {
  const root = document.documentElement
  const resolved = theme === 'system' ? getSystemTheme() : theme

  if (attribute === 'class') {
    const classThemes = themes.filter((t) => t !== 'system') as string[]
    root.classList.remove(...classThemes)
    root.classList.add(resolved)
  } else {
    root.setAttribute(attribute, resolved)
  }
}

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  storageKey = 'theme',
  themes = ['light', 'dark', 'system'],
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>(() =>
    typeof window === 'undefined' ? 'light' : getSystemTheme()
  )
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>(() =>
    typeof window === 'undefined' ? 'light' : (defaultTheme === 'system' ? getSystemTheme() : defaultTheme)
  )

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const savedTheme = localStorage.getItem(storageKey) as Theme | null
    const nextTheme = savedTheme || defaultTheme

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemTheme = () => {
      const currentSystemTheme = getSystemTheme()
      setSystemTheme(currentSystemTheme)
    }

    setThemeState(nextTheme)
    media.addEventListener('change', updateSystemTheme)

    return () => media.removeEventListener('change', updateSystemTheme)
  }, [defaultTheme, storageKey])

  React.useEffect(() => {
    const nextResolvedTheme =
      theme === 'system' ? (enableSystem ? systemTheme : 'light') : theme
    setResolvedTheme(nextResolvedTheme)

    applyTheme(theme, attribute, themes)
    try {
      localStorage.setItem(storageKey, theme)
    } catch {
      // ignore write failures
    }
  }, [theme, systemTheme, attribute, storageKey, themes, enableSystem])

  const setTheme = (nextTheme: Theme) => {
    if (nextTheme === 'system' && !enableSystem) {
      setThemeState('light')
      return
    }
    setThemeState(nextTheme)
  }

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      systemTheme,
      themes,
    }),
    [theme, resolvedTheme, systemTheme, themes]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
