import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryAPI } from '@/api/categoryAPI'
import type { CreateCategoryRequest } from '@/types/api'

export function useGetCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getCategories(),
    staleTime: 1000 * 60 * 10,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoryAPI.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
