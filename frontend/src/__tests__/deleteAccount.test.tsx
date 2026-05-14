// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useTodoStore } from '@/store/todoStore'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockDeleteAccountMutate = vi.hoisted(() => vi.fn())
const mockDeleteAccountPending = vi.hoisted(() => ({ value: false }))
const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useUser', () => ({
  useDeleteAccount: () => ({
    mutate: mockDeleteAccountMutate,
    get isPending() { return mockDeleteAccountPending.value },
  }),
  useUpdatePreferences: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/useAuth', () => ({
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/useTodo', () => ({
  useGetTodos: () => ({ data: { data: [], pagination: { page: 1, size: 20, total: 0, totalPages: 0 } }, isLoading: false }),
  useCreateTodo: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateTodo: () => ({ mutate: vi.fn(), isPending: false }),
  useToggleComplete: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteTodo: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/useCategory', () => ({
  useGetCategories: () => ({ data: { data: [] } }),
  useCreateCategory: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// ─── Helper ───────────────────────────────────────────────────────────────────

async function renderTodoListPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const { default: TodoListPage } = await import('@/pages/todo/TodoListPage')

  useAuthStore.setState({
    accessToken: 'token',
    user: { id: 'u1', email: 'test@test.com', name: '홍길동', theme: 'light' as const, createdAt: '', updatedAt: '' },
    isAuthenticated: true,
  })

  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TodoListPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDeleteAccountPending.value = false
  useAuthStore.setState({ accessToken: null, user: null, isAuthenticated: false })
  useUIStore.setState({ isModalOpen: false, modalType: null, selectedTodoId: null, toast: null })
  useTodoStore.setState({ filters: {} })
})

// ─── FE-12 완료 조건 테스트 ───────────────────────────────────────────────────

describe('FE-12 회원 탈퇴 — 완료 조건', () => {
  it('확인 Modal 없이 즉시 탈퇴가 불가능하다', async () => {
    await renderTodoListPage()

    // 탈퇴 확인 버튼은 모달이 열리기 전에는 DOM에 없어야 함
    expect(screen.queryByTestId('confirm-delete-account')).not.toBeInTheDocument()

    // 회원 탈퇴 버튼을 클릭해야 모달이 열린다
    await userEvent.click(screen.getByTestId('delete-account-button'))
    expect(screen.getByTestId('confirm-delete-account')).toBeInTheDocument()
  })

  it('탈퇴 성공 시 authStore가 초기화된다 (clearAuth)', async () => {
    mockDeleteAccountMutate.mockImplementation(
      (_: unknown, opts: { onSuccess?: () => void }) => {
        useAuthStore.getState().clearAuth()
        opts?.onSuccess?.()
      }
    )
    await renderTodoListPage()
    await userEvent.click(screen.getByTestId('delete-account-button'))
    await userEvent.click(screen.getByTestId('confirm-delete-account'))

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBeNull()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })

  it('탈퇴 성공 후 뒤로가기 차단 — ProtectedRoute가 /login으로 리다이렉트한다', async () => {
    // authStore를 직접 clearAuth 상태로 설정
    useAuthStore.setState({ accessToken: null, user: null, isAuthenticated: false })

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { ProtectedRoute } = await import('@/routes/ProtectedRoute')

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/todos']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/todos" element={<div data-testid="todos">할일 목록</div>} />
            </Route>
            <Route path="/login" element={<div data-testid="login">로그인</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    // clearAuth 후 /todos 접근 시 /login으로 리다이렉트
    expect(screen.getByTestId('login')).toBeInTheDocument()
    expect(screen.queryByTestId('todos')).not.toBeInTheDocument()
  })

  it('처리 중 로딩 상태가 표시된다', async () => {
    mockDeleteAccountPending.value = true
    await renderTodoListPage()
    await userEvent.click(screen.getByTestId('delete-account-button'))

    const confirmBtn = screen.getByTestId('confirm-delete-account')
    expect(confirmBtn).toBeDisabled()
    expect(confirmBtn).toHaveAttribute('aria-busy', 'true')
  })

  it('실패 시 에러 Toast가 표시된다', async () => {
    mockDeleteAccountMutate.mockImplementation(
      (_: unknown, opts: { onError?: (err: unknown) => void }) => {
        opts?.onError?.({ status: 500, code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', fields: [] })
      }
    )

    await renderTodoListPage()
    await userEvent.click(screen.getByTestId('delete-account-button'))
    await userEvent.click(screen.getByTestId('confirm-delete-account'))

    await waitFor(() => {
      expect(useUIStore.getState().toast?.type).toBe('error')
      expect(useUIStore.getState().toast?.message).toContain('서버 오류가 발생했습니다.')
    })
  })

  it('모달 취소 버튼 클릭 시 탈퇴가 진행되지 않는다', async () => {
    await renderTodoListPage()
    await userEvent.click(screen.getByTestId('delete-account-button'))

    const cancelBtn = screen.getByRole('button', { name: '취소' })
    await userEvent.click(cancelBtn)

    expect(mockDeleteAccountMutate).not.toHaveBeenCalled()
    expect(screen.queryByTestId('confirm-delete-account')).not.toBeInTheDocument()
  })
})

// ─── 회원 탈퇴 버튼 위치 및 메시지 ───────────────────────────────────────────

describe('FE-12 회원 탈퇴 — UI', () => {
  it('헤더에 "회원 탈퇴" 버튼이 있다', async () => {
    await renderTodoListPage()
    expect(screen.getByTestId('delete-account-button')).toBeInTheDocument()
  })

  it('확인 모달에 경고 메시지가 포함된다', async () => {
    await renderTodoListPage()
    await userEvent.click(screen.getByTestId('delete-account-button'))
    expect(screen.getByText(/탈퇴하면 모든 데이터가 즉시 삭제되며 복구할 수 없습니다/)).toBeInTheDocument()
  })

  it('ESC 키로 모달을 닫을 수 있다', async () => {
    const { fireEvent } = await import('@testing-library/react')
    await renderTodoListPage()
    await userEvent.click(screen.getByTestId('delete-account-button'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(mockDeleteAccountMutate).not.toHaveBeenCalled()
  })
})
