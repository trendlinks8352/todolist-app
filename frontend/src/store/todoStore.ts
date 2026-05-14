import { create } from 'zustand'
import type { TodoFilters } from '@/types/api'

interface TodoState {
  filters: TodoFilters
  setFilter: (partial: Partial<TodoFilters>) => void
  resetFilters: () => void
}

export const useTodoStore = create<TodoState>((set) => ({
  filters: {},
  setFilter: (partial) => set((state) => ({ filters: { ...state.filters, ...partial } })),
  resetFilters: () => set({ filters: {} }),
}))
