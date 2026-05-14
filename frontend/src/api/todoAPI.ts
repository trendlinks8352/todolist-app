import axiosClient from '@/api/axiosClient'
import type { Todo, TodoListResponse } from '@/types/domain'
import type { TodoFilters, CreateTodoRequest, UpdateTodoRequest } from '@/types/api'

export const todoAPI = {
  getTodos: async (filters?: TodoFilters): Promise<TodoListResponse> => {
    const res = await axiosClient.get('/api/todos', { params: filters })
    return res.data
  },

  createTodo: async (data: CreateTodoRequest): Promise<Todo> => {
    const res = await axiosClient.post('/api/todos', data)
    return res.data
  },

  updateTodo: async (id: string, data: UpdateTodoRequest): Promise<Todo> => {
    const res = await axiosClient.put(`/api/todos/${id}`, data)
    return res.data
  },

  toggleComplete: async (id: string): Promise<Todo> => {
    const res = await axiosClient.patch(`/api/todos/${id}/complete`)
    return res.data
  },

  deleteTodo: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/todos/${id}`)
  },
}
