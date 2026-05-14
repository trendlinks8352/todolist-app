// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

import { TodoItem } from '@/components/Todo/TodoItem'
import { TodoList } from '@/components/Todo/TodoList'
import { TodoFilters } from '@/components/Todo/TodoFilters'
import { useUIStore } from '@/store/uiStore'
import { useTodoStore } from '@/store/todoStore'
import type { Todo } from '@/types/domain'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockToggleComplete = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))
const mockDeleteTodo = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))
const mockGetCategories = vi.hoisted(() => ({
  data: { data: [
    { id: 'cat-1', userId: null, name: '일반', isDefault: true, createdAt: '' },
    { id: 'cat-2', userId: null, name: '업무', isDefault: true, createdAt: '' },
  ]},
  isLoading: false,
}))
const mockGetTodos = vi.hoisted(() => ({
  data: undefined as { data: Todo[]; pagination: { page: number; size: number; total: number; totalPages: number } } | undefined,
  isLoading: false,
}))
const mockLogout = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))
const mockDeleteAccount = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))

vi.mock('@/hooks/useTodo', () => ({
  useToggleComplete: () => mockToggleComplete,
  useDeleteTodo: () => mockDeleteTodo,
  useGetTodos: () => mockGetTodos,
  useCreateTodo: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateTodo: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useCategory', () => ({
  useGetCategories: () => mockGetCategories,
  useCreateCategory: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useLogout: () => mockLogout,
}))

vi.mock('@/hooks/useUser', () => ({
  useDeleteAccount: () => mockDeleteAccount,
  useUpdatePreferences: () => ({ mutate: vi.fn(), isPending: false }),
}))

// ─── Test helpers ─────────────────────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

const mockTodo: Todo = {
  id: 'todo-1',
  userId: 'user-1',
  categoryId: 'cat-2',
  title: '프로젝트 기획서 작성',
  description: null,
  dueDate: '2026-05-30',
  isCompleted: false,
  completedAt: null,
  createdAt: '2026-05-14T00:00:00.000Z',
  updatedAt: '2026-05-14T00:00:00.000Z',
  category: { id: 'cat-2', name: '업무', isDefault: true },
}

const mockCompletedTodo: Todo = {
  ...mockTodo,
  id: 'todo-2',
  title: '완료된 할일',
  isCompleted: true,
  completedAt: '2026-05-14T10:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  useUIStore.setState({ isModalOpen: false, modalType: null, selectedTodoId: null, toast: null })
  useTodoStore.setState({ filters: {} })
})

// ─── TodoItem ─────────────────────────────────────────────────────────────────

describe('TodoItem', () => {
  const Wrapper = createWrapper()

  it('제목을 렌더링한다', () => {
    render(<TodoItem todo={mockTodo} />, { wrapper: Wrapper })
    expect(screen.getByTestId('todo-title')).toHaveTextContent('프로젝트 기획서 작성')
  })

  it('카테고리 이름을 표시한다', () => {
    render(<TodoItem todo={mockTodo} />, { wrapper: Wrapper })
    expect(screen.getByTestId('todo-category')).toHaveTextContent('업무')
  })

  it('dueDate가 있으면 표시한다', () => {
    render(<TodoItem todo={mockTodo} />, { wrapper: Wrapper })
    expect(screen.getByTestId('todo-due-date')).toHaveTextContent('2026-05-30')
  })

  it('dueDate가 없으면 표시하지 않는다', () => {
    render(<TodoItem todo={{ ...mockTodo, dueDate: undefined }} />, { wrapper: Wrapper })
    expect(screen.queryByTestId('todo-due-date')).not.toBeInTheDocument()
  })

  it('완료된 할일에 completed 클래스가 적용된다', () => {
    render(<TodoItem todo={mockCompletedTodo} />, { wrapper: Wrapper })
    expect(screen.getByTestId('todo-title')).toHaveClass('completed')
  })

  it('미완료 할일에 completed 클래스가 없다', () => {
    render(<TodoItem todo={mockTodo} />, { wrapper: Wrapper })
    expect(screen.getByTestId('todo-title')).not.toHaveClass('completed')
  })

  it('체크박스 클릭 시 toggleComplete가 호출된다', async () => {
    render(<TodoItem todo={mockTodo} />, { wrapper: Wrapper })
    const checkbox = screen.getByRole('checkbox')
    await userEvent.click(checkbox)
    expect(mockToggleComplete.mutate).toHaveBeenCalledWith('todo-1')
  })

  it('수정 버튼 클릭 시 openEditModal이 호출된다', async () => {
    render(<TodoItem todo={mockTodo} />, { wrapper: Wrapper })
    await userEvent.click(screen.getByTestId('edit-button'))
    expect(useUIStore.getState().selectedTodoId).toBe('todo-1')
    expect(useUIStore.getState().modalType).toBe('edit')
  })

  it('삭제 버튼 클릭 시 확인 모달이 표시된다', async () => {
    render(<TodoItem todo={mockTodo} />, { wrapper: Wrapper })
    await userEvent.click(screen.getByTestId('delete-button'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('정말로 이 할일을 삭제하시겠습니까?')).toBeInTheDocument()
  })

  it('삭제 확인 클릭 시 deleteTodo.mutate가 호출된다', async () => {
    render(<TodoItem todo={mockTodo} />, { wrapper: Wrapper })
    await userEvent.click(screen.getByTestId('delete-button'))
    await userEvent.click(screen.getByTestId('confirm-delete-button'))
    expect(mockDeleteTodo.mutate).toHaveBeenCalledWith('todo-1', expect.any(Object))
  })

  it('삭제 모달에서 취소 클릭 시 모달이 닫힌다', async () => {
    render(<TodoItem todo={mockTodo} />, { wrapper: Wrapper })
    await userEvent.click(screen.getByTestId('delete-button'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await userEvent.click(screen.getByText('취소'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// ─── TodoList ─────────────────────────────────────────────────────────────────

describe('TodoList', () => {
  const Wrapper = createWrapper()

  it('isLoading=true 시 Spinner를 표시한다', () => {
    render(<TodoList todos={[]} isLoading={true} />, { wrapper: Wrapper })
    expect(screen.getByTestId('todo-loading')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('todos가 빈 배열이면 빈 상태 메시지를 표시한다', () => {
    render(<TodoList todos={[]} isLoading={false} />, { wrapper: Wrapper })
    expect(screen.getByTestId('todo-empty')).toHaveTextContent('등록된 할일이 없습니다.')
  })

  it('todos가 있으면 TodoItem들을 렌더링한다', () => {
    render(<TodoList todos={[mockTodo, mockCompletedTodo]} isLoading={false} />, { wrapper: Wrapper })
    expect(screen.getByTestId('todo-list')).toBeInTheDocument()
    expect(screen.getByTestId('todo-item-todo-1')).toBeInTheDocument()
    expect(screen.getByTestId('todo-item-todo-2')).toBeInTheDocument()
  })

  it('todos 개수만큼 아이템이 렌더링된다', () => {
    render(<TodoList todos={[mockTodo, mockCompletedTodo]} isLoading={false} />, { wrapper: Wrapper })
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })
})

// ─── TodoFilters ──────────────────────────────────────────────────────────────

describe('TodoFilters', () => {
  const Wrapper = createWrapper()

  it('카테고리 드롭다운에 카테고리 목록이 표시된다', () => {
    render(<TodoFilters />, { wrapper: Wrapper })
    expect(screen.getByText('일반')).toBeInTheDocument()
    expect(screen.getByText('업무')).toBeInTheDocument()
  })

  it('완료여부 드롭다운에 전체/미완료/완료 옵션이 있다', () => {
    render(<TodoFilters />, { wrapper: Wrapper })
    expect(screen.getByText('전체')).toBeInTheDocument()
    expect(screen.getByText('미완료')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()
  })

  it('완료여부 필터 변경 시 todoStore의 isCompleted가 업데이트된다', async () => {
    render(<TodoFilters />, { wrapper: Wrapper })
    const selects = screen.getAllByRole('combobox')
    const completionSelect = selects[1]
    await userEvent.selectOptions(completionSelect, 'true')
    expect(useTodoStore.getState().filters.isCompleted).toBe(true)
  })

  it('카테고리 필터 변경 시 todoStore의 categoryId가 업데이트된다', async () => {
    render(<TodoFilters />, { wrapper: Wrapper })
    const selects = screen.getAllByRole('combobox')
    await userEvent.selectOptions(selects[0], 'cat-1')
    expect(useTodoStore.getState().filters.categoryId).toBe('cat-1')
  })

  it('시작일 입력 시 todoStore의 dueDateFrom이 업데이트된다', () => {
    render(<TodoFilters />, { wrapper: Wrapper })
    const fromInput = screen.getByTestId('filter-date-from')
    fireEvent.change(fromInput, { target: { value: '2026-05-01' } })
    expect(useTodoStore.getState().filters.dueDateFrom).toBe('2026-05-01')
  })

  it('종료일 입력 시 todoStore의 dueDateTo가 업데이트된다', () => {
    render(<TodoFilters />, { wrapper: Wrapper })
    const toInput = screen.getByTestId('filter-date-to')
    fireEvent.change(toInput, { target: { value: '2026-05-31' } })
    expect(useTodoStore.getState().filters.dueDateTo).toBe('2026-05-31')
  })

  it('startDate > endDate 이면 오류 메시지가 표시된다', () => {
    useTodoStore.setState({ filters: { dueDateFrom: '2026-05-31', dueDateTo: '2026-05-01' } })
    render(<TodoFilters />, { wrapper: Wrapper })
    expect(screen.getByTestId('date-range-error')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('시작일은 종료일보다 빠르거나 같아야 합니다.')
  })

  it('startDate <= endDate 이면 오류 메시지가 없다', () => {
    useTodoStore.setState({ filters: { dueDateFrom: '2026-05-01', dueDateTo: '2026-05-31' } })
    render(<TodoFilters />, { wrapper: Wrapper })
    expect(screen.queryByTestId('date-range-error')).not.toBeInTheDocument()
  })

  it('필터 초기화 버튼 클릭 시 todoStore filters가 초기화된다', async () => {
    useTodoStore.setState({ filters: { isCompleted: true, categoryId: 'cat-1' } })
    render(<TodoFilters />, { wrapper: Wrapper })
    await userEvent.click(screen.getByTestId('reset-filters'))
    expect(useTodoStore.getState().filters).toEqual({})
  })
})

// ─── TodoListPage 통합 테스트 ─────────────────────────────────────────────────

describe('TodoListPage', () => {
  async function renderPage(todos: Todo[] = []) {
    mockGetTodos.data = {
      data: todos,
      pagination: { page: 1, size: 20, total: todos.length, totalPages: 1 },
    }

    const { useAuthStore } = await import('@/store/authStore')
    useAuthStore.setState({
      accessToken: 'token',
      user: { id: 'u1', email: 'test@test.com', name: '홍길동', theme: 'light' as const, createdAt: '', updatedAt: '' },
      isAuthenticated: true,
    })

    const { default: TodoListPage } = await import('@/pages/todo/TodoListPage')
    return render(<TodoListPage />, { wrapper: createWrapper() })
  }

  it('헤더에 사용자 이름이 표시된다', async () => {
    await renderPage()
    expect(screen.getByTestId('user-name')).toHaveTextContent('홍길동')
  })

  it('로그아웃 버튼이 있다', async () => {
    await renderPage()
    expect(screen.getByTestId('logout-button')).toBeInTheDocument()
  })

  it('로그아웃 버튼 클릭 시 logout.mutate가 호출된다', async () => {
    await renderPage()
    await userEvent.click(screen.getByTestId('logout-button'))
    expect(mockLogout.mutate).toHaveBeenCalled()
  })

  it('회원 탈퇴 버튼 클릭 시 확인 모달이 표시된다', async () => {
    await renderPage()
    await userEvent.click(screen.getByTestId('delete-account-button'))
    expect(screen.getByText('탈퇴하면 모든 데이터가 즉시 삭제되며 복구할 수 없습니다. 탈퇴하시겠습니까?')).toBeInTheDocument()
  })

  it('탈퇴 확인 버튼 클릭 시 deleteAccount.mutate가 호출된다', async () => {
    await renderPage()
    await userEvent.click(screen.getByTestId('delete-account-button'))
    await userEvent.click(screen.getByTestId('confirm-delete-account'))
    expect(mockDeleteAccount.mutate).toHaveBeenCalled()
  })

  it('새로운 할일 등록 버튼 클릭 시 openCreateModal이 호출된다', async () => {
    await renderPage()
    await userEvent.click(screen.getByTestId('add-todo-button'))
    expect(useUIStore.getState().isModalOpen).toBe(true)
    expect(useUIStore.getState().modalType).toBe('create')
  })

  it('할일이 없으면 빈 상태 메시지가 표시된다', async () => {
    await renderPage([])
    await waitFor(() => {
      expect(screen.getByTestId('todo-empty')).toBeInTheDocument()
    })
  })

  it('할일이 있으면 목록이 표시된다', async () => {
    await renderPage([mockTodo])
    await waitFor(() => {
      expect(screen.getByTestId('todo-list')).toBeInTheDocument()
    })
  })
})
