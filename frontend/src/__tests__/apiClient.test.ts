// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import axiosClient from '@/api/axiosClient'
import { authAPI } from '@/api/authAPI'
import { todoAPI } from '@/api/todoAPI'
import { categoryAPI } from '@/api/categoryAPI'
import { userAPI } from '@/api/userAPI'
import { useAuthStore } from '@/store/authStore'

let mock: AxiosMockAdapter

const mockUser = {
  id: 'user-uuid',
  email: 'test@example.com',
  name: '홍길동',
  createdAt: '2026-05-14T00:00:00.000Z',
  theme: 'light' as const,
  updatedAt: '2026-05-14T00:00:00.000Z',
}

const mockCategory = {
  id: 'cat-uuid',
  userId: null,
  name: '업무',
  isDefault: true,
  createdAt: '2026-05-14T00:00:00.000Z',
}

const mockTodo = {
  id: 'todo-uuid',
  userId: 'user-uuid',
  categoryId: 'cat-uuid',
  title: '할일 제목',
  description: null,
  dueDate: undefined,
  isCompleted: false,
  completedAt: null,
  createdAt: '2026-05-14T00:00:00.000Z',
  theme: 'light' as const,
  updatedAt: '2026-05-14T00:00:00.000Z',
  category: { id: 'cat-uuid', name: '업무', isDefault: true },
}

beforeEach(() => {
  mock = new AxiosMockAdapter(axiosClient)
  vi.stubGlobal('location', { href: '' })
  useAuthStore.setState({ accessToken: 'test-token', isAuthenticated: true })
})

afterEach(() => {
  mock.restore()
  vi.unstubAllGlobals()
})

// ─── authAPI ──────────────────────────────────────────────────────────────────

describe('authAPI.register', () => {
  it('POST /api/auth/register를 호출하고 AuthResponse를 반환한다', async () => {
    const authResponse = { accessToken: 'new-token', user: mockUser }
    mock.onPost('/api/auth/register').reply(201, authResponse)

    const result = await authAPI.register({ email: 'a@b.com', password: 'Pass1234', name: '홍길동' })
    expect(result.accessToken).toBe('new-token')
    expect(result.user).toEqual(mockUser)
  })

  it('요청 본문에 email, password, name이 포함된다', async () => {
    let capturedBody: unknown
    mock.onPost('/api/auth/register').reply((config) => {
      capturedBody = JSON.parse(config.data as string)
      return [201, { accessToken: 'token', user: mockUser }]
    })

    await authAPI.register({ email: 'a@b.com', password: 'Pass1234', name: '홍' })
    expect(capturedBody).toMatchObject({ email: 'a@b.com', password: 'Pass1234', name: '홍' })
  })
})

describe('authAPI.login', () => {
  it('POST /api/auth/login을 호출하고 AuthResponse를 반환한다', async () => {
    mock.onPost('/api/auth/login').reply(200, { accessToken: 'token', user: mockUser })

    const result = await authAPI.login({ email: 'a@b.com', password: 'Pass1234' })
    expect(result.accessToken).toBe('token')
  })
})

describe('authAPI.logout', () => {
  it('POST /api/auth/logout을 호출하고 void를 반환한다', async () => {
    mock.onPost('/api/auth/logout').reply(200, { message: '로그아웃되었습니다.' })
    await expect(authAPI.logout()).resolves.toBeUndefined()
  })
})

// ─── todoAPI ──────────────────────────────────────────────────────────────────

describe('todoAPI.getTodos', () => {
  const listResponse = { data: [mockTodo], pagination: { page: 1, size: 20, total: 1, totalPages: 1 } }

  it('GET /api/todos를 호출하고 TodoListResponse를 반환한다', async () => {
    mock.onGet('/api/todos').reply(200, listResponse)
    const result = await todoAPI.getTodos()
    expect(result.data).toHaveLength(1)
    expect(result.pagination.total).toBe(1)
  })

  it('filters 파라미터를 쿼리스트링으로 전달한다', async () => {
    let capturedParams: Record<string, unknown> = {}
    mock.onGet('/api/todos').reply((config) => {
      capturedParams = config.params as Record<string, unknown>
      return [200, listResponse]
    })

    await todoAPI.getTodos({ isCompleted: true, categoryId: 'cat-1' })
    expect(capturedParams.isCompleted).toBe(true)
    expect(capturedParams.categoryId).toBe('cat-1')
  })

  it('filters 없이 호출 가능하다', async () => {
    mock.onGet('/api/todos').reply(200, listResponse)
    await expect(todoAPI.getTodos()).resolves.toBeDefined()
  })
})

describe('todoAPI.createTodo', () => {
  it('POST /api/todos를 호출하고 Todo를 반환한다', async () => {
    mock.onPost('/api/todos').reply(201, mockTodo)
    const result = await todoAPI.createTodo({ title: '새 할일', categoryId: 'cat-uuid' })
    expect(result.id).toBe('todo-uuid')
    expect(result.title).toBe('할일 제목')
  })

  it('요청 본문에 title과 categoryId가 포함된다', async () => {
    let capturedBody: unknown
    mock.onPost('/api/todos').reply((config) => {
      capturedBody = JSON.parse(config.data as string)
      return [201, mockTodo]
    })

    await todoAPI.createTodo({ title: '제목', categoryId: 'cat-uuid', dueDate: '2026-06-01' })
    expect(capturedBody).toMatchObject({ title: '제목', categoryId: 'cat-uuid' })
  })
})

describe('todoAPI.updateTodo', () => {
  it('PUT /api/todos/:id를 호출하고 수정된 Todo를 반환한다', async () => {
    mock.onPut('/api/todos/todo-uuid').reply(200, { ...mockTodo, title: '수정된 제목' })
    const result = await todoAPI.updateTodo('todo-uuid', { title: '수정된 제목' })
    expect(result.title).toBe('수정된 제목')
  })
})

describe('todoAPI.toggleComplete', () => {
  it('PATCH /api/todos/:id/complete를 호출한다 (완료 조건)', async () => {
    let capturedMethod = ''
    let capturedUrl = ''
    mock.onPatch('/api/todos/todo-uuid/complete').reply((config) => {
      capturedMethod = config.method?.toUpperCase() ?? ''
      capturedUrl = config.url ?? ''
      return [200, { ...mockTodo, isCompleted: true }]
    })

    const result = await todoAPI.toggleComplete('todo-uuid')
    expect(capturedMethod).toBe('PATCH')
    expect(capturedUrl).toBe('/api/todos/todo-uuid/complete')
    expect(result.isCompleted).toBe(true)
  })

  it('PUT이 아닌 PATCH 메서드를 사용한다', async () => {
    let usedMethod = ''
    mock.onAny('/api/todos/todo-uuid/complete').reply((config) => {
      usedMethod = config.method?.toUpperCase() ?? ''
      return [200, mockTodo]
    })

    await todoAPI.toggleComplete('todo-uuid')
    expect(usedMethod).toBe('PATCH')
    expect(usedMethod).not.toBe('PUT')
  })
})

describe('todoAPI.deleteTodo', () => {
  it('DELETE /api/todos/:id를 호출하고 void를 반환한다', async () => {
    mock.onDelete('/api/todos/todo-uuid').reply(204)
    await expect(todoAPI.deleteTodo('todo-uuid')).resolves.toBeUndefined()
  })
})

// ─── categoryAPI ─────────────────────────────────────────────────────────────

describe('categoryAPI.getCategories', () => {
  it('GET /api/categories를 호출하고 CategoryListResponse를 반환한다', async () => {
    mock.onGet('/api/categories').reply(200, { data: [mockCategory] })
    const result = await categoryAPI.getCategories()
    expect(result.data).toHaveLength(1)
    expect(result.data[0].name).toBe('업무')
  })
})

describe('categoryAPI.createCategory', () => {
  it('POST /api/categories를 호출하고 Category를 반환한다', async () => {
    const newCat = { ...mockCategory, id: 'new-cat', name: '신규', userId: 'user-uuid', isDefault: false }
    mock.onPost('/api/categories').reply(201, newCat)

    const result = await categoryAPI.createCategory({ name: '신규' })
    expect(result.id).toBe('new-cat')
    expect(result.isDefault).toBe(false)
  })

  it('요청 본문에 name이 포함된다', async () => {
    let capturedBody: unknown
    mock.onPost('/api/categories').reply((config) => {
      capturedBody = JSON.parse(config.data as string)
      return [201, mockCategory]
    })

    await categoryAPI.createCategory({ name: '새 카테고리' })
    expect(capturedBody).toEqual({ name: '새 카테고리' })
  })
})

// ─── userAPI ─────────────────────────────────────────────────────────────────

describe('userAPI.getMe', () => {
  it('GET /api/users/me를 호출하고 User를 반환한다', async () => {
    mock.onGet('/api/users/me').reply(200, mockUser)
    const result = await userAPI.getMe()
    expect(result.id).toBe('user-uuid')
    expect(result.email).toBe('test@example.com')
  })

  it('응답에 password 필드가 없다', async () => {
    mock.onGet('/api/users/me').reply(200, mockUser)
    const result = await userAPI.getMe()
    expect((result as unknown as Record<string, unknown>).password).toBeUndefined()
  })
})

describe('userAPI.deleteMe', () => {
  it('DELETE /api/users/me를 호출하고 void를 반환한다', async () => {
    mock.onDelete('/api/users/me').reply(204)
    await expect(userAPI.deleteMe()).resolves.toBeUndefined()
  })
})

// ─── 공통: axiosClient 사용 검증 ─────────────────────────────────────────────

describe('공통 — axiosClient 사용 검증', () => {
  it('모든 API는 Authorization 헤더를 자동으로 포함한다', async () => {
    let capturedAuth: string | undefined
    mock.onGet('/api/users/me').reply((config) => {
      capturedAuth = config.headers?.['Authorization'] as string
      return [200, mockUser]
    })

    await userAPI.getMe()
    expect(capturedAuth).toBe('Bearer test-token')
  })
})
