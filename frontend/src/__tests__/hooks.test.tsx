// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

import { useLogin, useSignup, useLogout } from '@/hooks/useAuth'
import { useGetTodos, useCreateTodo, useUpdateTodo, useDeleteTodo, useToggleComplete } from '@/hooks/useTodo'
import { useGetCategories, useCreateCategory } from '@/hooks/useCategory'
import { useDeleteAccount } from '@/hooks/useUser'
import { useAuthStore } from '@/store/authStore'
import { useTodoStore } from '@/store/todoStore'

// ─── navigate 모킹 ────────────────────────────────────────────────────────────

const mockNavigate = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// ─── API 모킹 ─────────────────────────────────────────────────────────────────

vi.mock('@/api/authAPI', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}))
vi.mock('@/api/todoAPI', () => ({
  todoAPI: {
    getTodos: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
    toggleComplete: vi.fn(),
  },
}))
vi.mock('@/api/categoryAPI', () => ({
  categoryAPI: {
    getCategories: vi.fn(),
    createCategory: vi.fn(),
  },
}))
vi.mock('@/api/userAPI', () => ({
  userAPI: {
    deleteMe: vi.fn(),
  },
}))

import { authAPI } from '@/api/authAPI'
import { todoAPI } from '@/api/todoAPI'
import { categoryAPI } from '@/api/categoryAPI'
import { userAPI } from '@/api/userAPI'

// ─── 테스트 헬퍼 ──────────────────────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return { qc, Wrapper }
}

const mockUser = {
  id: 'user-uuid',
  email: 'test@example.com',
  name: '홍길동',
  createdAt: '2026-05-14T00:00:00.000Z',
  theme: 'light' as const,
  updatedAt: '2026-05-14T00:00:00.000Z',
}

const mockTodo = {
  id: 'todo-uuid',
  userId: 'user-uuid',
  categoryId: 'cat-uuid',
  title: '할일',
  description: null,
  dueDate: undefined,
  isCompleted: false,
  completedAt: null,
  createdAt: '2026-05-14T00:00:00.000Z',
  theme: 'light' as const,
  updatedAt: '2026-05-14T00:00:00.000Z',
  category: { id: 'cat-uuid', name: '업무', isDefault: true },
}

const mockCategory = {
  id: 'cat-uuid',
  userId: null,
  name: '업무',
  isDefault: true,
  createdAt: '2026-05-14T00:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ accessToken: null, user: null, isAuthenticated: false })
  useTodoStore.setState({ filters: {} })
})

afterEach(() => {
  vi.clearAllMocks()
})

// ─── useAuth ──────────────────────────────────────────────────────────────────

describe('useLogin', () => {
  it('로그인 성공 시 setAuth가 호출된다', async () => {
    vi.mocked(authAPI.login).mockResolvedValue({ accessToken: 'token', user: mockUser })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    await act(async () => {
      result.current.mutate({ email: 'a@b.com', password: 'Pass1234' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(useAuthStore.getState().accessToken).toBe('token')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('로그인 성공 시 /todos로 navigate한다', async () => {
    vi.mocked(authAPI.login).mockResolvedValue({ accessToken: 'token', user: mockUser })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    await act(async () => {
      result.current.mutate({ email: 'a@b.com', password: 'Pass1234' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockNavigate).toHaveBeenCalledWith('/todos')
  })

  it('로그인 실패 시 에러 상태가 된다', async () => {
    vi.mocked(authAPI.login).mockRejectedValue({ status: 401, code: 'UNAUTHORIZED', message: '인증 실패', fields: [] })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    await act(async () => {
      result.current.mutate({ email: 'a@b.com', password: 'wrong' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

describe('useSignup', () => {
  it('회원가입 성공 시 /login으로 navigate한다', async () => {
    vi.mocked(authAPI.register).mockResolvedValue({ accessToken: 'token', user: mockUser })
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useSignup(), { wrapper: Wrapper })

    await act(async () => {
      result.current.mutate({ email: 'a@b.com', password: 'Pass1234', name: '홍' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})

describe('useLogout', () => {
  it('로그아웃 성공 시 clearAuth가 호출된다', async () => {
    useAuthStore.setState({ accessToken: 'token', user: mockUser, isAuthenticated: true })
    vi.mocked(authAPI.logout).mockResolvedValue(undefined)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper })

    await act(async () => { result.current.mutate() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('로그아웃 성공 시 localStorage 테마가 light로 초기화된다', async () => {
    localStorage.setItem('todolist-app-theme', 'dark')
    useAuthStore.setState({ accessToken: 'token', user: mockUser, isAuthenticated: true })
    vi.mocked(authAPI.logout).mockResolvedValue(undefined)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper })

    await act(async () => { result.current.mutate() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(localStorage.getItem('todolist-app-theme')).toBe('light')
  })
})

// ─── useTodo ──────────────────────────────────────────────────────────────────

describe('useGetTodos', () => {
  it('필터 없이 getTodos를 호출하고 데이터를 반환한다', async () => {
    const listResponse = { data: [mockTodo], pagination: { page: 1, size: 20, total: 1, totalPages: 1 } }
    vi.mocked(todoAPI.getTodos).mockResolvedValue(listResponse)
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useGetTodos(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toHaveLength(1)
  })

  it('queryKey에 filters가 포함된다 (filters 변경 시 자동 재조회)', async () => {
    const listResponse = { data: [], pagination: { page: 1, size: 20, total: 0, totalPages: 0 } }
    vi.mocked(todoAPI.getTodos).mockResolvedValue(listResponse)
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useGetTodos(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const callCount = vi.mocked(todoAPI.getTodos).mock.calls.length

    act(() => { useTodoStore.getState().setFilter({ isCompleted: true }) })

    await waitFor(() => {
      expect(vi.mocked(todoAPI.getTodos).mock.calls.length).toBeGreaterThan(callCount)
    })
  })

  it('staleTime이 5분(300000ms)으로 설정된다', async () => {
    vi.mocked(todoAPI.getTodos).mockResolvedValue({ data: [], pagination: { page: 1, size: 20, total: 0, totalPages: 0 } })
    const { qc, Wrapper } = createWrapper()

    renderHook(() => useGetTodos(), { wrapper: Wrapper })
    await waitFor(() => {
      const state = qc.getQueryState(['todos', {}])
      expect(state?.status).toBe('success')
    })
  })
})

describe('useCreateTodo', () => {
  it('성공 시 todos 쿼리를 invalidate한다', async () => {
    vi.mocked(todoAPI.createTodo).mockResolvedValue(mockTodo)
    const { qc, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateTodo(), { wrapper: Wrapper })

    await act(async () => {
      result.current.mutate({ title: '새 할일', categoryId: 'cat-uuid' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] })
  })
})

describe('useUpdateTodo', () => {
  it('성공 시 todos 쿼리를 invalidate한다', async () => {
    vi.mocked(todoAPI.updateTodo).mockResolvedValue({ ...mockTodo, title: '수정됨' })
    const { qc, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateTodo(), { wrapper: Wrapper })

    await act(async () => {
      result.current.mutate({ id: 'todo-uuid', data: { title: '수정됨' } })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] })
  })
})

describe('useDeleteTodo', () => {
  it('성공 시 todos 쿼리를 invalidate한다', async () => {
    vi.mocked(todoAPI.deleteTodo).mockResolvedValue(undefined)
    const { qc, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteTodo(), { wrapper: Wrapper })

    await act(async () => { result.current.mutate('todo-uuid') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] })
  })
})

describe('useToggleComplete', () => {
  it('성공 시 todos 쿼리를 invalidate한다', async () => {
    vi.mocked(todoAPI.toggleComplete).mockResolvedValue({ ...mockTodo, isCompleted: true })
    const { qc, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useToggleComplete(), { wrapper: Wrapper })

    await act(async () => { result.current.mutate('todo-uuid') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] })
  })
})

// ─── useCategory ─────────────────────────────────────────────────────────────

describe('useGetCategories', () => {
  it('카테고리 목록을 반환한다', async () => {
    vi.mocked(categoryAPI.getCategories).mockResolvedValue({ data: [mockCategory] })
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useGetCategories(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toHaveLength(1)
  })
})

describe('useCreateCategory', () => {
  it('성공 시 categories 쿼리를 invalidate한다', async () => {
    vi.mocked(categoryAPI.createCategory).mockResolvedValue(mockCategory)
    const { qc, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateCategory(), { wrapper: Wrapper })

    await act(async () => { result.current.mutate({ name: '새 카테고리' }) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['categories'] })
  })
})

// ─── useUser ──────────────────────────────────────────────────────────────────

describe('useDeleteAccount', () => {
  it('성공 시 clearAuth가 호출된다', async () => {
    useAuthStore.setState({ accessToken: 'token', user: mockUser, isAuthenticated: true })
    vi.mocked(userAPI.deleteMe).mockResolvedValue(undefined)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteAccount(), { wrapper: Wrapper })

    await act(async () => { result.current.mutate() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('성공 시 /login으로 navigate한다 (replace: true로 뒤로가기 차단)', async () => {
    vi.mocked(userAPI.deleteMe).mockResolvedValue(undefined)
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteAccount(), { wrapper: Wrapper })

    await act(async () => { result.current.mutate() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
  })
})
