import axiosClient from '@/api/axiosClient'
import type { AuthResponse } from '@/types/domain'
import type { LoginRequest, SignupRequest } from '@/types/api'

export const authAPI = {
  register: async (data: SignupRequest): Promise<AuthResponse> => {
    const res = await axiosClient.post('/api/auth/register', data)
    return res.data
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await axiosClient.post('/api/auth/login', data)
    return res.data
  },

  logout: async (): Promise<void> => {
    await axiosClient.post('/api/auth/logout')
  },
}
