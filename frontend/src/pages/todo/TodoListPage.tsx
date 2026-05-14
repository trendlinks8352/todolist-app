import { useState } from 'react'
import { useGetTodos } from '@/hooks/useTodo'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useLogout } from '@/hooks/useAuth'
import { useDeleteAccount } from '@/hooks/useUser'
import type { ApiError } from '@/types/api'
import { TodoFilters } from '@/components/Todo/TodoFilters'
import { TodoList } from '@/components/Todo/TodoList'
import { TodoFormModal } from '@/components/Todo/TodoFormModal'
import { Button } from '@/components/Common/Button'
import { Modal } from '@/components/Common/Modal'
import { ThemeToggle } from '@/components/Common/ThemeToggle'

export default function TodoListPage() {
  const user = useAuthStore((s) => s.user)
  const { isModalOpen, modalType, selectedTodoId, openCreateModal, closeModal, showToast } = useUIStore()
  const logout = useLogout()
  const deleteAccount = useDeleteAccount()
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const { data, isLoading } = useGetTodos()

  const editTodo = selectedTodoId
    ? data?.data.find((t) => t.id === selectedTodoId)
    : undefined

  return (
    <div className="todo-list-page">
      <header className="todo-header">
        <h1 className="todo-header-title">TodoListApp</h1>
        <div className="todo-header-right">
          <ThemeToggle />
          {user && (
            <span className="todo-header-name" data-testid="user-name">
              {user.name}
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => logout.mutate()}
            loading={logout.isPending}
            data-testid="logout-button"
          >
            로그아웃
          </Button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowDeleteAccountModal(true)}
            data-testid="delete-account-button"
          >
            회원 탈퇴
          </button>
        </div>
      </header>

      <main className="todo-main">
        <section className="todo-section">
          <h2 className="todo-section-title">📋 할일 관리</h2>
          <TodoFilters />
          <TodoList todos={data?.data ?? []} isLoading={isLoading} />
        </section>
        <Button
          variant="primary"
          onClick={openCreateModal}
          data-testid="add-todo-button"
          className="todo-add-btn"
        >
          + 새로운 할일 등록
        </Button>
      </main>

      <Modal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        title="회원 탈퇴"
      >
        <p>탈퇴하면 모든 데이터가 즉시 삭제되며 복구할 수 없습니다. 탈퇴하시겠습니까?</p>
        <div className="modal-footer">
          <Button
            variant="danger"
            onClick={() =>
              deleteAccount.mutate(undefined, {
                onError: (error: unknown) => {
                  showToast(
                    (error as ApiError)?.message ?? '탈퇴 처리 중 오류가 발생했습니다.',
                    'error',
                  )
                },
              })
            }
            loading={deleteAccount.isPending}
            data-testid="confirm-delete-account"
          >
            탈퇴 확인
          </Button>
          <Button variant="secondary" onClick={() => setShowDeleteAccountModal(false)}>
            취소
          </Button>
        </div>
      </Modal>

      <TodoFormModal
        isOpen={isModalOpen && (modalType === 'create' || modalType === 'edit')}
        onClose={closeModal}
        editTodo={editTodo}
      />
    </div>
  )
}
