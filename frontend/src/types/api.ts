export interface ApiErrorField {
  field: string
  message: string
}

export interface ApiError {
  status: number
  code: string
  message: string
  fields: ApiErrorField[]
}

export interface ApiResponse<T> {
  data: T
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  name: string
}

export interface CreateTodoRequest {
  title: string
  description?: string | null
  dueDate?: string | null
  categoryId: string
}

export interface UpdateTodoRequest {
  title?: string
  description?: string | null
  dueDate?: string | null
  categoryId?: string
}

export interface TodoFilters {
  categoryId?: string
  isCompleted?: boolean
  dueDateFrom?: string
  dueDateTo?: string
  page?: number
  size?: number
}

export interface CreateCategoryRequest {
  name: string
}
