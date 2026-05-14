// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/store/authStore'
import { useTodoStore } from '@/store/todoStore'
import { useUIStore } from '@/store/uiStore'
import type { User } from '@/types/domain'

const mockUser: User = {
  id: 'user-uuid',
  email: 'test@example.com',
  name: '홍길동',
  createdAt: '2026-05-14T00:00:00.000Z',
  theme: 'light' as const,
  updatedAt: '2026-05-14T00:00:00.000Z',
}

// ─── authStore ───────────────────────────────────────────────────────────────

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, isAuthenticated: false })
  })

  it('초기 상태: accessToken=null, isAuthenticated=false', () => {
    const { accessToken, user, isAuthenticated } = useAuthStore.getState()
    expect(accessToken).toBeNull()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })

  it('setAuth 호출 시 isAuthenticated가 true로 전환된다', () => {
    useAuthStore.getState().setAuth('my-token', mockUser)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('setAuth 호출 시 accessToken과 user가 저장된다', () => {
    useAuthStore.getState().setAuth('my-token', mockUser)
    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('my-token')
    expect(state.user).toEqual(mockUser)
  })

  it('clearAuth 호출 시 accessToken이 null로 전환된다', () => {
    useAuthStore.getState().setAuth('my-token', mockUser)
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('clearAuth 호출 시 isAuthenticated가 false로 전환된다', () => {
    useAuthStore.getState().setAuth('my-token', mockUser)
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('clearAuth 호출 시 user가 null로 초기화된다', () => {
    useAuthStore.getState().setAuth('my-token', mockUser)
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('persist 미들웨어 미사용 — localStorage에 저장되지 않는다', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    useAuthStore.getState().setAuth('token', mockUser)
    expect(setItemSpy).not.toHaveBeenCalled()
    setItemSpy.mockRestore()
  })

  it('persist 미들웨어 미사용 — sessionStorage에 저장되지 않는다', () => {
    const setItemSpy = vi.spyOn(globalThis, 'sessionStorage', 'get')
    useAuthStore.getState().setAuth('token', mockUser)
    expect(setItemSpy).not.toHaveBeenCalled()
    setItemSpy.mockRestore()
  })
})

// ─── todoStore ───────────────────────────────────────────────────────────────

describe('todoStore', () => {
  beforeEach(() => {
    useTodoStore.setState({ filters: {} })
  })

  it('초기 상태: filters가 빈 객체다', () => {
    expect(useTodoStore.getState().filters).toEqual({})
  })

  it('setFilter로 특정 필터를 설정한다', () => {
    useTodoStore.getState().setFilter({ isCompleted: true })
    expect(useTodoStore.getState().filters.isCompleted).toBe(true)
  })

  it('setFilter는 기존 필터를 유지하면서 병합된다', () => {
    useTodoStore.getState().setFilter({ categoryId: 'cat-1' })
    useTodoStore.getState().setFilter({ isCompleted: false })
    const { filters } = useTodoStore.getState()
    expect(filters.categoryId).toBe('cat-1')
    expect(filters.isCompleted).toBe(false)
  })

  it('setFilter로 categoryId를 설정한다', () => {
    useTodoStore.getState().setFilter({ categoryId: 'uuid-cat' })
    expect(useTodoStore.getState().filters.categoryId).toBe('uuid-cat')
  })

  it('setFilter로 dueDate 범위 필터를 설정한다', () => {
    useTodoStore.getState().setFilter({ dueDateFrom: '2026-05-01', dueDateTo: '2026-05-31' })
    const { filters } = useTodoStore.getState()
    expect(filters.dueDateFrom).toBe('2026-05-01')
    expect(filters.dueDateTo).toBe('2026-05-31')
  })

  it('setFilter로 page와 size를 설정한다', () => {
    useTodoStore.getState().setFilter({ page: 2, size: 10 })
    expect(useTodoStore.getState().filters.page).toBe(2)
    expect(useTodoStore.getState().filters.size).toBe(10)
  })

  it('resetFilters 호출 시 filters가 빈 객체로 초기화된다', () => {
    useTodoStore.getState().setFilter({ isCompleted: true, categoryId: 'cat-1' })
    useTodoStore.getState().resetFilters()
    expect(useTodoStore.getState().filters).toEqual({})
  })
})

// ─── uiStore ─────────────────────────────────────────────────────────────────

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      isModalOpen: false,
      modalType: null,
      selectedTodoId: null,
      toast: null,
    })
  })

  it('초기 상태: isModalOpen=false, modalType=null, selectedTodoId=null, toast=null', () => {
    const state = useUIStore.getState()
    expect(state.isModalOpen).toBe(false)
    expect(state.modalType).toBeNull()
    expect(state.selectedTodoId).toBeNull()
    expect(state.toast).toBeNull()
  })

  it('openCreateModal 호출 시 isModalOpen=true, modalType="create"', () => {
    useUIStore.getState().openCreateModal()
    const state = useUIStore.getState()
    expect(state.isModalOpen).toBe(true)
    expect(state.modalType).toBe('create')
    expect(state.selectedTodoId).toBeNull()
  })

  it('openEditModal 호출 시 selectedTodoId가 설정된다', () => {
    useUIStore.getState().openEditModal('todo-123')
    const state = useUIStore.getState()
    expect(state.isModalOpen).toBe(true)
    expect(state.modalType).toBe('edit')
    expect(state.selectedTodoId).toBe('todo-123')
  })

  it('closeModal 호출 시 모달 관련 상태가 초기화된다', () => {
    useUIStore.getState().openEditModal('todo-123')
    useUIStore.getState().closeModal()
    const state = useUIStore.getState()
    expect(state.isModalOpen).toBe(false)
    expect(state.modalType).toBeNull()
    expect(state.selectedTodoId).toBeNull()
  })

  it('showToast 호출 시 toast 상태가 설정된다', () => {
    useUIStore.getState().showToast('저장되었습니다.', 'success')
    const { toast } = useUIStore.getState()
    expect(toast).not.toBeNull()
    expect(toast?.message).toBe('저장되었습니다.')
    expect(toast?.type).toBe('success')
    expect(toast?.duration).toBe(3000)
  })

  it('showToast duration 기본값은 3000ms이다', () => {
    useUIStore.getState().showToast('메시지', 'info')
    expect(useUIStore.getState().toast?.duration).toBe(3000)
  })

  it('showToast에 커스텀 duration을 지정할 수 있다', () => {
    useUIStore.getState().showToast('오류!', 'error', 5000)
    expect(useUIStore.getState().toast?.duration).toBe(5000)
  })

  it('hideToast 호출 시 toast가 null이 된다', () => {
    useUIStore.getState().showToast('메시지', 'success')
    useUIStore.getState().hideToast()
    expect(useUIStore.getState().toast).toBeNull()
  })

  it('showToast는 고유한 id를 생성한다', () => {
    useUIStore.getState().showToast('첫 번째', 'info')
    const id1 = useUIStore.getState().toast?.id
    useUIStore.getState().showToast('두 번째', 'info')
    const id2 = useUIStore.getState().toast?.id
    expect(id1).toBeDefined()
    expect(id2).toBeDefined()
  })
})
