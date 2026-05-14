import { create } from 'zustand'
import type { Theme } from '@/types/domain'

const STORAGE_KEY = 'todolist-app-theme'

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {}
  return 'light'
}

function applyThemeToDom(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    try { localStorage.setItem(STORAGE_KEY, theme) } catch {}
    applyThemeToDom(theme)
    set({ theme })
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light'
    get().setTheme(next)
  },
}))

// 앱 시작 시 저장된 테마를 즉시 DOM에 적용 (FODT 방지)
applyThemeToDom(getInitialTheme())
