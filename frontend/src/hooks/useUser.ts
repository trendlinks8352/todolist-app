import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { userAPI } from '@/api/userAPI'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import type { Theme } from '@/types/domain'

export function useUpdatePreferences() {
  const setTheme = useThemeStore((s) => s.setTheme)

  return useMutation({
    mutationFn: (theme: Theme) => userAPI.updatePreferences(theme),
    onSuccess: (data) => {
      setTheme(data.theme)
    },
  })
}

export function useDeleteAccount() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setTheme = useThemeStore((s) => s.setTheme)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => userAPI.deleteMe(),
    onSuccess: () => {
      clearAuth()
      setTheme('light')
      navigate('/login', { replace: true })
    },
  })
}
