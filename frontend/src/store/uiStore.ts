import { create } from 'zustand'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
  duration: number
}

interface UIState {
  isModalOpen: boolean
  modalType: 'create' | 'edit' | null
  selectedTodoId: string | null
  toast: Toast | null
  openCreateModal: () => void
  openEditModal: (todoId: string) => void
  closeModal: () => void
  showToast: (message: string, type: Toast['type'], duration?: number) => void
  hideToast: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isModalOpen: false,
  modalType: null,
  selectedTodoId: null,
  toast: null,
  openCreateModal: () => set({ isModalOpen: true, modalType: 'create', selectedTodoId: null }),
  openEditModal: (todoId) => set({ isModalOpen: true, modalType: 'edit', selectedTodoId: todoId }),
  closeModal: () => set({ isModalOpen: false, modalType: null, selectedTodoId: null }),
  showToast: (message, type, duration = 3000) =>
    set({ toast: { id: Date.now(), message, type, duration } }),
  hideToast: () => set({ toast: null }),
}))
