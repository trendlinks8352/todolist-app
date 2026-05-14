import { describe, it, expect } from 'vitest'
import type {
  User,
  Category,
  CategorySummary,
  Todo,
  Pagination,
  AuthResponse,
  TodoListResponse,
  CategoryListResponse,
} from '@/types/domain'
import type {
  ApiError,
  ApiErrorField,
  ApiResponse,
  LoginRequest,
  SignupRequest,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoFilters,
  CreateCategoryRequest,
} from '@/types/api'

describe('domain 타입 — 런타임 형태 검증', () => {
  it('User 객체가 필수 필드를 가진다', () => {
    const user: User = {
      id: 'uuid-1',
      email: 'test@example.com',
      name: '홍길동',
      createdAt: '2026-05-14T00:00:00.000Z',
      theme: 'light' as const,
  updatedAt: '2026-05-14T00:00:00.000Z',
    }
    expect(user.id).toBeDefined()
    expect(user.email).toBeDefined()
    expect(user.name).toBeDefined()
    expect(user.createdAt).toBeDefined()
    expect(user.updatedAt).toBeDefined()
  })

  it('Category.userId는 null 또는 string이다', () => {
    const defaultCat: Category = {
      id: 'uuid-1',
      userId: null,
      name: '일반',
      isDefault: true,
      createdAt: '2026-05-14T00:00:00.000Z',
    }
    const userCat: Category = {
      id: 'uuid-2',
      userId: 'user-uuid',
      name: '커스텀',
      isDefault: false,
      createdAt: '2026-05-14T00:00:00.000Z',
    }
    expect(defaultCat.userId).toBeNull()
    expect(userCat.userId).toBe('user-uuid')
  })

  it('Todo.categoryId는 필수 필드다 (BR-05)', () => {
    const categorySummary: CategorySummary = { id: 'cat-uuid', name: '업무', isDefault: true }
    const todo: Todo = {
      id: 'todo-uuid',
      userId: 'user-uuid',
      categoryId: 'cat-uuid',
      title: '할일 제목',
      description: null,
      dueDate: undefined,
      isCompleted: false,
      completedAt: null,
      createdAt: '2026-05-14T00:00:00.000Z',
      updatedAt: '2026-05-14T00:00:00.000Z',
      category: categorySummary,
    }
    expect(todo.categoryId).toBeDefined()
    expect(todo.categoryId).toBe('cat-uuid')
  })

  it('Todo.dueDate는 undefined 또는 string이다', () => {
    const categorySummary: CategorySummary = { id: 'cat-uuid', name: '업무', isDefault: true }
    const todoWithDate: Todo = {
      id: 'todo-1',
      userId: 'user-uuid',
      categoryId: 'cat-uuid',
      title: '할일',
      description: null,
      dueDate: '2026-05-30',
      isCompleted: false,
      completedAt: null,
      createdAt: '2026-05-14T00:00:00.000Z',
      updatedAt: '2026-05-14T00:00:00.000Z',
      category: categorySummary,
    }
    const todoWithoutDate: Todo = {
      ...todoWithDate,
      id: 'todo-2',
      dueDate: undefined,
    }
    expect(todoWithDate.dueDate).toBe('2026-05-30')
    expect(todoWithoutDate.dueDate).toBeUndefined()
  })

  it('Pagination 객체가 네 개의 필드를 가진다', () => {
    const pagination: Pagination = { page: 1, size: 20, total: 42, totalPages: 3 }
    expect(pagination.page).toBe(1)
    expect(pagination.size).toBe(20)
    expect(pagination.total).toBe(42)
    expect(pagination.totalPages).toBe(3)
  })

  it('AuthResponse는 accessToken과 user를 가진다', () => {
    const auth: AuthResponse = {
      accessToken: 'token-string',
      user: {
        id: 'uuid',
        email: 'a@b.com',
        name: '홍',
        theme: 'light' as const,
        createdAt: '',
        updatedAt: '',
      },
    }
    expect(auth.accessToken).toBeDefined()
    expect(auth.user).toBeDefined()
  })

  it('TodoListResponse는 data 배열과 pagination을 가진다', () => {
    const res: TodoListResponse = { data: [], pagination: { page: 1, size: 20, total: 0, totalPages: 0 } }
    expect(Array.isArray(res.data)).toBe(true)
    expect(res.pagination).toBeDefined()
  })

  it('CategoryListResponse는 data 배열을 가진다', () => {
    const res: CategoryListResponse = { data: [] }
    expect(Array.isArray(res.data)).toBe(true)
  })
})

describe('api 타입 — 런타임 형태 검증', () => {
  it('ApiError는 status, code, message, fields를 가진다', () => {
    const err: ApiError = {
      status: 422,
      code: 'VALIDATION_ERROR',
      message: '입력값이 유효하지 않습니다.',
      fields: [{ field: 'title', message: '제목은 필수입니다.' }],
    }
    expect(err.status).toBe(422)
    expect(err.fields).toHaveLength(1)
  })

  it('ApiErrorField는 field와 message를 가진다', () => {
    const f: ApiErrorField = { field: 'email', message: '이메일 형식 오류' }
    expect(f.field).toBe('email')
    expect(f.message).toBeDefined()
  })

  it('ApiResponse<T>는 data 필드를 가진다', () => {
    const res: ApiResponse<string> = { data: 'hello' }
    expect(res.data).toBe('hello')
  })

  it('LoginRequest는 email과 password를 가진다', () => {
    const req: LoginRequest = { email: 'a@b.com', password: 'Pass1234' }
    expect(req.email).toBeDefined()
    expect(req.password).toBeDefined()
  })

  it('SignupRequest는 email, password, name을 가진다', () => {
    const req: SignupRequest = { email: 'a@b.com', password: 'Pass1234', name: '홍길동' }
    expect(req.name).toBeDefined()
  })

  it('CreateTodoRequest는 title과 categoryId가 필수다', () => {
    const req: CreateTodoRequest = { title: '제목', categoryId: 'uuid' }
    expect(req.title).toBeDefined()
    expect(req.categoryId).toBeDefined()
    expect(req.description).toBeUndefined()
    expect(req.dueDate).toBeUndefined()
  })

  it('UpdateTodoRequest는 모든 필드가 optional이다', () => {
    const req: UpdateTodoRequest = {}
    expect(req.title).toBeUndefined()
  })

  it('TodoFilters는 모든 필드가 optional이다', () => {
    const filters: TodoFilters = {}
    expect(filters.categoryId).toBeUndefined()
    expect(filters.isCompleted).toBeUndefined()
  })

  it('CreateCategoryRequest는 name을 가진다', () => {
    const req: CreateCategoryRequest = { name: '새 카테고리' }
    expect(req.name).toBe('새 카테고리')
  })
})
