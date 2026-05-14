import { useThemeStore } from '@/store/themeStore'
import { useUpdatePreferences } from '@/hooks/useUser'
import { useAuthStore } from '@/store/authStore'

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const updatePreferences = useUpdatePreferences()

  function handleToggle() {
    toggleTheme()
    // 로그인 상태면 서버에도 동기화
    if (isAuthenticated) {
      const next = theme === 'light' ? 'dark' : 'light'
      updatePreferences.mutate(next)
    }
  }

  const isDark = theme === 'dark'

  return (
    <button
      className="theme-toggle"
      onClick={handleToggle}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={isDark ? '라이트 모드' : '다크 모드'}
      data-testid="theme-toggle"
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb">
          {isDark ? '🌙' : '☀️'}
        </span>
      </span>
    </button>
  )
}
