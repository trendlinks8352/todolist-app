import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import type { ApiError } from '@/types/api'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error.response?.status
    const apiError = error.response?.data?.error

    if (status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }

    const normalized: ApiError = {
      status: status ?? 0,
      code: apiError?.code ?? 'INTERNAL_ERROR',
      message: apiError?.message ?? '알 수 없는 오류가 발생했습니다.',
      fields: apiError?.fields ?? [],
    }

    return Promise.reject(normalized)
  },
)

export default axiosClient
