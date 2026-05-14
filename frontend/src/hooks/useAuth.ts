import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '@/api/authAPI'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import type { LoginRequest, SignupRequest } from '@/types/api'

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const setTheme = useThemeStore((s) => s.setTheme)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: LoginRequest) => authAPI.login(data),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user)
      // 서버에 저장된 테마로 동기화 (크로스 디바이스 지원)
      if (data.user.theme) {
        setTheme(data.user.theme)
      }
      navigate('/todos')
    },
  })
}

export function useSignup() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: SignupRequest) => authAPI.register(data),
    onSuccess: () => {
      navigate('/login')
    },
  })
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setTheme = useThemeStore((s) => s.setTheme)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      clearAuth()
      // 로그아웃 시 localStorage 테마 초기화 → 로그인 화면은 항상 light
      setTheme('light')
      navigate('/login')
    },
  })
}
