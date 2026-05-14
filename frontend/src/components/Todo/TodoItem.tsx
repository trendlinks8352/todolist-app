import { useState } from 'react'
import type { Todo } from '@/types/domain'
import { useToggleComplete, useDeleteTodo } from '@/hooks/useTodo'
import { useUIStore } from '@/store/uiStore'
import { Checkbox } from '@/components/Common/Checkbox'
import { Modal } from '@/components/Common/Modal'
import { Button } from '@/components/Common/Button'

interface TodoItemProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const toggleComplete = useToggleComplete()
  const deleteTodo = useDeleteTodo()
  const openEditModal = useUIStore((s) => s.openEditModal)
  const showToast = useUIStore((s) => s.showToast)

  function handleToggle() {
    toggleComplete.mutate(todo.id)
  }

  function handleDeleteConfirm() {
    deleteTodo.mutate(todo.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false)
        showToast('할일이 삭제되었습니다.', 'success')
      },
    })
  }

  return (
    <div className="todo-card" data-testid={`todo-item-${todo.id}`}>
      <Checkbox
        checked={todo.isCompleted}
        onChange={handleToggle}
        id={`todo-check-${todo.id}`}
        aria-label={`${todo.title} 완료 토글`}
      />
      <div className="todo-content">
        <span
          className={`todo-title${todo.isCompleted ? ' completed' : ''}`}
          data-testid="todo-title"
        >
          {todo.title}
        </span>
        <div className="todo-meta">
          <span className="todo-category-label" data-testid="todo-category">
            {todo.category.name}
          </span>
          {todo.dueDate && (
            <span className="todo-tag tag-date" data-testid="todo-due-date">
              {todo.dueDate}
            </span>
          )}
        </div>
      </div>
      <div className="todo-actions">
        <button
          onClick={() => openEditModal(todo.id)}
          aria-label={`${todo.title} 수정`}
          className="btn btn-secondary btn-sm"
          data-testid="edit-button"
        >
          수정
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          aria-label={`${todo.title} 삭제`}
          className="btn btn-danger btn-sm"
          data-testid="delete-button"
        >
          삭제
        </button>
      </div>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="할일 삭제"
      >
        <p>정말로 이 할일을 삭제하시겠습니까?</p>
        <div className="modal-footer">
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            loading={deleteTodo.isPending}
            data-testid="confirm-delete-button"
          >
            삭제 확인
          </Button>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            취소
          </Button>
        </div>
      </Modal>
    </div>
  )
}
