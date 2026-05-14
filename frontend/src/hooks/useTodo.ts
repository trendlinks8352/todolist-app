import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { todoAPI } from '@/api/todoAPI'
import { useTodoStore } from '@/store/todoStore'
import type { CreateTodoRequest, UpdateTodoRequest } from '@/types/api'

export function useGetTodos() {
  const filters = useTodoStore((s) => s.filters)

  return useQuery({
    queryKey: ['todos', filters],
    queryFn: () => todoAPI.getTodos(filters),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTodoRequest) => todoAPI.createTodo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

export function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTodoRequest }) =>
      todoAPI.updateTodo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => todoAPI.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

export function useToggleComplete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => todoAPI.toggleComplete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}
