import axiosClient from '@/api/axiosClient'
import type { Category, CategoryListResponse } from '@/types/domain'
import type { CreateCategoryRequest } from '@/types/api'

export const categoryAPI = {
  getCategories: async (): Promise<CategoryListResponse> => {
    const res = await axiosClient.get('/api/categories')
    return res.data
  },

  createCategory: async (data: CreateCategoryRequest): Promise<Category> => {
    const res = await axiosClient.post('/api/categories', data)
    return res.data
  },
}
