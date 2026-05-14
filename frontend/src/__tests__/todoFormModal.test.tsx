// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

import { TodoFormModal } from '@/components/Todo/TodoFormModal'
import { useUIStore } from '@/store/uiStore'
import type { Todo } from '@/types/domain'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockCreateTodo = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))
const mockUpdateTodo = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))
const mockCreateCategory = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))
const mockCategories = vi.hoisted(() => ({
  data: {
    data: [
      { id: 'cat-1', userId: null, name: '일반', isDefault: true, createdAt: '' },
      { id: 'cat-2', userId: null, name: '업무', isDefault: true, createdAt: '' },
    ],
  },
}))

vi.mock('@/hooks/useTodo', () => ({
  useCreateTodo: () => mockCreateTodo,
  useUpdateTodo: () => mockUpdateTodo,
  useGetTodos: () => ({ data: undefined, isLoading: false }),
  useDeleteTodo: () => ({ mutate: vi.fn(), isPending: false }),
  useToggleComplete: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useCategory', () => ({
  useGetCategories: () => mockCategories,
  useCreateCategory: () => mockCreateCategory,
}))

// ─── Helper ───────────────────────────────────────────────────────────────────

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
  title: '기존 할일 제목',
  description: '기존 설명',
  dueDate: '2099-12-31',
  isCompleted: false,
  completedAt: null,
  createdAt: '2026-05-14T00:00:00.000Z',
  updatedAt: '2026-05-14T00:00:00.000Z',
  category: { id: 'cat-2', name: '업무', isDefault: true },
}

const noop = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  useUIStore.setState({ isModalOpen: false, modalType: null, selectedTodoId: null, toast: null })
})

// ─── 등록 모드 ────────────────────────────────────────────────────────────────

describe('TodoFormModal — 등록 모드 (create)', () => {
  const Wrapper = createWrapper()

  it('제목·설명·카테고리·종료예정일 필드가 렌더링된다', () => {
    render(<TodoFormModal isOpen onClose={noop} />, { wrapper: Wrapper })
    expect(screen.getByTestId('title-input')).toBeInTheDocument()
    expect(screen.getByTestId('description-input')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByTestId('due-date-input')).toBeInTheDocument()
  })

  it('모달 제목이 "새로운 할일"이다', () => {
    render(<TodoFormModal isOpen onClose={noop} />, { wrapper: Wrapper })
    expect(screen.getByText('새로운 할일')).toBeInTheDocument()
  })

  it('제목 빈값 제출 시 에러가 표시된다', async () => {
    render(<TodoFormModal isOpen onClose={noop} />, { wrapper: Wrapper })
    await userEvent.selectOptions(screen.getByRole('combobox'), 'cat-1')
    await userEvent.click(screen.getByTestId('form-submit'))
    expect(screen.getByRole('alert')).toHaveTextContent('제목을 입력해주세요.')
  })

  it('카테고리 미선택 시 에러가 표시된다', async () => {
    render(<TodoFormModal isOpen onClose={noop} />, { wrapper: Wrapper })
    await userEvent.type(screen.getByTestId('title-input'), '할일 제목')
    await userEvent.click(screen.getByTestId('form-submit'))
    expect(screen.getByTestId('category-error')).toHaveTextContent('카테고리를 선택해주세요.')
  })

  it('유효한 입력으로 제출 시 createTodo.mutate가 호출된다', async () => {
    render(<TodoFormModal isOpen onClose={noop} />, { wrapper: Wrapper })
    await userEvent.type(screen.getByTestId('title-input'), '새 할일')
    await userEvent.selectOptions(screen.getByRole('combobox'), 'cat-1')
    await userEvent.click(screen.getByTestId('form-submit'))

    expect(mockCreateTodo.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ title: '새 할일', categoryId: 'cat-1' }),
      expect.any(Object),
    )
  })

  it('등록 성공 시 성공 Toast가 표시된다', async () => {
    mockCreateTodo.mutate.mockImplementation(
      (_data: unknown, opts: { onSuccess?: () => void }) => opts.onSuccess?.()
    )
    render(<TodoFormModal isOpen onClose={noop} />, { wrapper: Wrapper })
    await userEvent.type(screen.getByTestId('title-input'), '새 할일')
    await userEvent.selectOptions(screen.getByRole('combobox'), 'cat-1')
    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(useUIStore.getState().toast?.message).toBe('할일이 등록되었습니다.')
      expect(useUIStore.getState().toast?.type).toBe('success')
    })
  })

  it('등록 성공 시 onClose가 호출된다', async () => {
    const onClose = vi.fn()
    mockCreateTodo.mutate.mockImplementation(
      (_data: unknown, opts: { onSuccess?: () => void }) => opts.onSuccess?.()
    )
    render(<TodoFormModal isOpen onClose={onClose} />, { wrapper: Wrapper })
    await userEvent.type(screen.getByTestId('title-input'), '새 할일')
    await userEvent.selectOptions(screen.getByRole('combobox'), 'cat-1')
    await userEvent.click(screen.getByTestId('form-submit'))
    expect(onClose).toHaveBeenCalled()
  })

  it('API 에러 시 에러 Toast가 표시된다', async () => {
    mockCreateTodo.mutate.mockImplementation(
      (_data: unknown, opts: { onError?: (err: unknown) => void }) =>
        opts.onError?.({ status: 422, code: 'VALIDATION_ERROR', message: '유효하지 않습니다.', fields: [] })
    )
    render(<TodoFormModal isOpen onClose={noop} />, { wrapper: Wrapper })
    await userEvent.type(screen.getByTestId('title-input'), '새 할일')
    await userEvent.selectOptions(screen.getByRole('combobox'), 'cat-1')
    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(useUIStore.getState().toast?.type).toBe('error')
    })
  })

  it('종료예정일 입력 필드의 min 속성이 오늘 날짜다', () => {
    render(<TodoFormModal isOpen onClose={noop} />, { wrapper: Wrapper })
    const today = new Date().toISOString().split('T')[0]
    expect(screen.getByTestId('due-date-input')).toHaveAttribute('min', today)
  })
})

// ─── 수정 모드 ────────────────────────────────────────────────────────────────

describe('TodoFormModal — 수정 모드 (edit)', () => {
  const Wrapper = createWrapper()

  it('모달 제목이 "할일 수정"이다', () => {
    render(<TodoFormModal isOpen onClose={noop} editTodo={mockTodo} />, { wrapper: Wrapper })
    expect(screen.getByText('할일 수정')).toBeInTheDocument()
  })

  it('기존 데이터가 프리필된다 (제목)', () => {
    render(<TodoFormModal isOpen onClose={noop} editTodo={mockTodo} />, { wrapper: Wrapper })
    expect(screen.getByTestId('title-input')).toHaveValue('기존 할일 제목')
  })

  it('기존 데이터가 프리필된다 (설명)', () => {
    render(<TodoFormModal isOpen onClose={noop} editTodo={mockTodo} />, { wrapper: Wrapper })
    expect(screen.getByTestId('description-input')).toHaveValue('기존 설명')
  })

  it('기존 데이터가 프리필된다 (dueDate)', () => {
    render(<TodoFormModal isOpen onClose={noop} editTodo={mockTodo} />, { wrapper: Wrapper })
    expect(screen.getByTestId('due-date-input')).toHaveValue('2099-12-31')
  })

  it('기존 데이터가 프리필된다 (categoryId)', () => {
    render(<TodoFormModal isOpen onClose={noop} editTodo={mockTodo} />, { wrapper: Wrapper })
    expect(screen.getByRole('combobox')).toHaveValue('cat-2')
  })

  it('수정 제출 시 updateTodo.mutate가 호출된다', async () => {
    render(<TodoFormModal isOpen onClose={noop} editTodo={mockTodo} />, { wrapper: Wrapper })
    await userEvent.clear(screen.getByTestId('title-input'))
    await userEvent.type(screen.getByTestId('title-input'), '수정된 제목')
    await userEvent.click(screen.getByTestId('form-submit'))

    expect(mockUpdateTodo.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'todo-1',
        data: expect.objectContaining({ title: '수정된 제목' }),
      }),
      expect.any(Object),
    )
  })

  it('수정 성공 시 성공 Toast가 표시된다', async () => {
    mockUpdateTodo.mutate.mockImplementation(
      (_data: unknown, opts: { onSuccess?: () => void }) => opts.onSuccess?.()
    )
    render(<TodoFormModal isOpen onClose={noop} editTodo={mockTodo} />, { wrapper: Wrapper })
    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(useUIStore.getState().toast?.message).toBe('할일이 수정되었습니다.')
    })
  })

  it('isOpen 변경 시 폼이 초기화된다 (등록 모드로 전환)', () => {
    const { rerender } = render(
      <TodoFormModal isOpen onClose={noop} editTodo={mockTodo} />,
      { wrapper: Wrapper }
    )
    expect(screen.getByTestId('title-input')).toHaveValue('기존 할일 제목')

    rerender(<TodoFormModal isOpen={false} onClose={noop} />)
    rerender(<TodoFormModal isOpen onClose={noop} />)
    expect(screen.getByTestId('title-input')).toHaveValue('')
  })
})

// ─── UC-09 새 카테고리 추가 ────────────────────────────────────────────────────

describe('TodoFormModal — 새 카테고리 추가 (UC-09)', () => {
  const Wrapper = createWrapper()

  it('"+ 새 카테고리 추가" 버튼이 표시된다', () => {
    render(<TodoFormModal isOpen onClose={noop} />, { wrapper: Wrapper })
    expect(screen.getByTestId('add-category-toggle')).toBeInTheDocument()
  })

  it('버튼 클릭 시 입력 폼이 표시된다', async () => {
    render(<TodoFormModal isOpen onClose={noop} />, { wrapper: Wrapper })
    await userEvent.click(screen.getByTestId('add-category-toggle'))
    expect(screen.getByTestId('new-category-form')).toBeInTheDocument()
    expect(screen.getByTestId('new-category-input')).toBeInTheDocument()
  })

  it('빈 이름으로 추가 시 에러가 표시된다', async () => {
    render(<TodoFormModal isOpen onClose={noop} />, { wrapper: Wrapper })
    await userEvent.click(screen.getByTestId('add-category-toggle'))
    await userEvent.click(screen.getByTestId('create-category-submit'))
    expect(screen.getAllByRole('alert').some(
      (a) => a.textContent?.includes('카테고리 이름을 입력해주세요.')
    )).toBe(true)
  })

  it('이름 입력 후 추가 시 createCategory.mutate가 호출된다', async () => {
    render(<TodoFormModal isOpen onClose={noop} />, { wrapper: Wrapper })
    await userEvent.click(screen.getByTestId('add-category-toggle'))
    await userEvent.type(screen.getByTestId('new-category-input'), '새 카테고리')
    await userEvent.click(screen.getByTestId('create-category-submit'))
    expect(mockCreateCategory.mutate).toHaveBeenCalledWith(
      { name: '새 카테고리' },
      expect.any(Object),
    )
  })

  it('409 에러 시 중복 에러 메시지가 표시된다', async () => {
    mockCreateCategory.mutate.mockImplementation(
      (_data: unknown, opts: { onError?: (err: unknown) => void }) =>
        opts.onError?.({ status: 409, code: 'CONFLICT', message: '중복', fields: [] })
    )
    render(<TodoFormModal isOpen onClose={noop} />, { wrapper: Wrapper })
    await userEvent.click(screen.getByTestId('add-category-toggle'))
    await userEvent.type(screen.getByTestId('new-category-input'), '업무')
    await userEvent.click(screen.getByTestId('create-category-submit'))

    await waitFor(() => {
      expect(screen.getAllByRole('alert').some(
        (a) => a.textContent?.includes('이미 존재하는 카테고리명입니다.')
      )).toBe(true)
    })
  })

  it('카테고리 성공 생성 후 폼이 닫히고 카테고리가 선택된다', async () => {
    mockCreateCategory.mutate.mockImplementation(
      (_data: unknown, opts: { onSuccess?: (data: { id: string }) => void }) =>
        opts.onSuccess?.({ id: 'new-cat-id' })
    )
    render(<TodoFormModal isOpen onClose={noop} />, { wrapper: Wrapper })
    await userEvent.click(screen.getByTestId('add-category-toggle'))
    await userEvent.type(screen.getByTestId('new-category-input'), '신규')
    await userEvent.click(screen.getByTestId('create-category-submit'))

    await waitFor(() => {
      expect(screen.queryByTestId('new-category-form')).not.toBeInTheDocument()
    })
  })
})
