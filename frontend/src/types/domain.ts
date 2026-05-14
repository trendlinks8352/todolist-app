export type Theme = 'light' | 'dark'

export interface User {
  id: string
  email: string
  name: string
  theme: Theme
  createdAt: string
  updatedAt: string
}

export interface CategorySummary {
  id: string
  name: string
  isDefault: boolean
}

export interface Category {
  id: string
  userId: string | null
  name: string
  isDefault: boolean
  createdAt: string
}

export interface Todo {
  id: string
  userId: string
  categoryId: string
  title: string
  description: string | null
  dueDate: string | undefined
  isCompleted: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
  category: CategorySummary
}

export interface Pagination {
  page: number
  size: number
  total: number
  totalPages: number
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface TodoListResponse {
  data: Todo[]
  pagination: Pagination
}

export interface CategoryListResponse {
  data: Category[]
}
