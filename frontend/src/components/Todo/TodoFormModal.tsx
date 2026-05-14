import { useState, useEffect } from 'react'
import { Modal } from '@/components/Common/Modal'
import { Input } from '@/components/Common/Input'
import { Dropdown } from '@/components/Common/Dropdown'
import { Button } from '@/components/Common/Button'
import { useCreateTodo, useUpdateTodo } from '@/hooks/useTodo'
import { useGetCategories, useCreateCategory } from '@/hooks/useCategory'
import { useUIStore } from '@/store/uiStore'
import { TODO_CONSTANTS } from '@/constants/constants'
import type { Todo } from '@/types/domain'
import type { ApiError } from '@/types/api'

interface TodoFormModalProps {
  isOpen: boolean
  onClose: () => void
  editTodo?: Todo
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function validateTitle(v: string): string | undefined {
  if (!v.trim()) return '제목을 입력해주세요.'
  if (v.trim().length > TODO_CONSTANTS.MAX_TITLE_LENGTH)
    return `제목은 ${TODO_CONSTANTS.MAX_TITLE_LENGTH}자 이하여야 합니다.`
}

function validateDueDate(v: string): string | undefined {
  if (!v) return undefined
  if (v < getTodayString()) return '종료예정일은 오늘 이후여야 합니다.'
}

function validateCategory(v: string): string | undefined {
  if (!v) return '카테고리를 선택해주세요.'
}

export function TodoFormModal({ isOpen, onClose, editTodo }: TodoFormModalProps) {
  const isEditMode = !!editTodo
  const showToast = useUIStore((s) => s.showToast)
  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()
  const createCategory = useCreateCategory()
  const { data: categoryData } = useGetCategories()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [errors, setErrors] = useState<{
    title?: string
    dueDate?: string
    categoryId?: string
    newCategory?: string
  }>({})

  useEffect(() => {
    if (!isOpen) return
    if (editTodo) {
      setTitle(editTodo.title)
      setDescription(editTodo.description ?? '')
      setDueDate(editTodo.dueDate ?? '')
      setCategoryId(editTodo.categoryId)
    } else {
      setTitle('')
      setDescription('')
      setDueDate('')
      setCategoryId('')
    }
    setErrors({})
    setShowNewCategory(false)
    setNewCategoryName('')
  }, [isOpen, editTodo])

  const categoryOptions =
    categoryData?.data.map((c) => ({ value: c.id, label: c.name })) ?? []

  function handleAddNewCategory() {
    if (!newCategoryName.trim()) {
      setErrors((prev) => ({ ...prev, newCategory: '카테고리 이름을 입력해주세요.' }))
      return
    }
    createCategory.mutate(
      { name: newCategoryName.trim() },
      {
        onSuccess: (data) => {
          setCategoryId(data.id)
          setShowNewCategory(false)
          setNewCategoryName('')
          setErrors((prev) => ({ ...prev, newCategory: undefined }))
        },
        onError: (error: unknown) => {
          const err = error as ApiError
          if (err?.status === 409) {
            setErrors((prev) => ({ ...prev, newCategory: '이미 존재하는 카테고리명입니다.' }))
          } else {
            showToast(err?.message ?? '카테고리 생성 중 오류가 발생했습니다.', 'error')
          }
        },
      },
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const titleErr = validateTitle(title)
    const dueDateErr = validateDueDate(dueDate)
    const categoryErr = validateCategory(categoryId)

    if (titleErr || dueDateErr || categoryErr) {
      setErrors({ title: titleErr, dueDate: dueDateErr, categoryId: categoryErr })
      return
    }

    setErrors({})

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      dueDate: dueDate || null,
      categoryId,
    }

    if (isEditMode && editTodo) {
      updateTodo.mutate(
        { id: editTodo.id, data: payload },
        {
          onSuccess: () => {
            showToast('할일이 수정되었습니다.', 'success')
            onClose()
          },
          onError: (error: unknown) => {
            showToast((error as ApiError)?.message ?? '수정 중 오류가 발생했습니다.', 'error')
          },
        },
      )
    } else {
      createTodo.mutate(payload, {
        onSuccess: () => {
          showToast('할일이 등록되었습니다.', 'success')
          onClose()
        },
        onError: (error: unknown) => {
          showToast((error as ApiError)?.message ?? '등록 중 오류가 발생했습니다.', 'error')
        },
      })
    }
  }

  const isPending = createTodo.isPending || updateTodo.isPending
  const today = getTodayString()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? '할일 수정' : '새로운 할일'}>
      <form onSubmit={handleSubmit} noValidate data-testid="todo-form">
        <Input
          label="제목 *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          placeholder="할일 제목 (최대 200자)"
          data-testid="title-input"
        />
        <Input
          label="설명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="설명 (선택)"
          data-testid="description-input"
        />

        <div className="form-group">
          <label htmlFor="category-select">카테고리 *</label>
          <Dropdown
            id="category-select"
            options={categoryOptions}
            value={categoryId}
            onChange={(v) => setCategoryId(v)}
            placeholder="카테고리 선택"
          />
          {errors.categoryId && (
            <span role="alert" data-testid="category-error">
              {errors.categoryId}
            </span>
          )}
          {!showNewCategory ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowNewCategory(true)}
              data-testid="add-category-toggle"
            >
              + 새 카테고리 추가
            </button>
          ) : (
            <div className="new-category-form" data-testid="new-category-form">
              <Input
                label="새 카테고리 이름"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                error={errors.newCategory}
                data-testid="new-category-input"
              />
              <div className="new-category-actions">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddNewCategory}
                  loading={createCategory.isPending}
                  data-testid="create-category-submit"
                >
                  추가
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowNewCategory(false)
                    setNewCategoryName('')
                    setErrors((prev) => ({ ...prev, newCategory: undefined }))
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="due-date-input">종료예정일</label>
          <input
            id="due-date-input"
            type="date"
            className="filter-date-input"
            value={dueDate}
            min={today}
            onChange={(e) => setDueDate(e.target.value)}
            data-testid="due-date-input"
          />
          {errors.dueDate && (
            <span role="alert" data-testid="due-date-error">
              {errors.dueDate}
            </span>
          )}
        </div>

        <div className="modal-footer">
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            data-testid="form-submit"
          >
            저장
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
        </div>
      </form>
    </Modal>
  )
}
