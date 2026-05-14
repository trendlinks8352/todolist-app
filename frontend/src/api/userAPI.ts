import axiosClient from '@/api/axiosClient'
import type { User, Theme } from '@/types/domain'

export const userAPI = {
  getMe: async (): Promise<User> => {
    const res = await axiosClient.get('/api/users/me')
    return res.data
  },

  updatePreferences: async (theme: Theme): Promise<{ theme: Theme }> => {
    const res = await axiosClient.patch('/api/users/me/preferences', { theme })
    return res.data
  },

  deleteMe: async (): Promise<void> => {
    await axiosClient.delete('/api/users/me')
  },
}
