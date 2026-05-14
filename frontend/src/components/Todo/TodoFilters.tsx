import { useGetCategories } from '@/hooks/useCategory'
import { useTodoStore } from '@/store/todoStore'
import { Dropdown } from '@/components/Common/Dropdown'
import { Button } from '@/components/Common/Button'

const COMPLETION_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'false', label: '미완료' },
  { value: 'true', label: '완료' },
]

export function TodoFilters() {
  const { filters, setFilter, resetFilters } = useTodoStore()
  const { data: categoryData } = useGetCategories()

  const categoryOptions = [
    { value: '', label: '전체 카테고리' },
    ...(categoryData?.data.map((c) => ({ value: c.id, label: c.name })) ?? []),
  ]

  const dateRangeError =
    filters.dueDateFrom &&
    filters.dueDateTo &&
    filters.dueDateFrom > filters.dueDateTo
      ? '시작일은 종료일보다 빠르거나 같아야 합니다.'
      : undefined

  return (
    <div className="todo-filters" data-testid="todo-filters">
      <Dropdown
        id="filter-category"
        options={categoryOptions}
        value={filters.categoryId ?? ''}
        onChange={(v) => setFilter({ categoryId: v || undefined })}
        placeholder="전체 카테고리"
      />

      <Dropdown
        id="filter-completion"
        options={COMPLETION_OPTIONS}
        value={filters.isCompleted === undefined ? '' : String(filters.isCompleted)}
        onChange={(v) =>
          setFilter({ isCompleted: v === '' ? undefined : v === 'true' })
        }
        placeholder="완료 여부"
      />

      <label htmlFor="filter-date-from" className="sr-only">시작일</label>
      <input
        id="filter-date-from"
        type="date"
        className="filter-date-input"
        value={filters.dueDateFrom ?? ''}
        onChange={(e) => setFilter({ dueDateFrom: e.target.value || undefined })}
        data-testid="filter-date-from"
        aria-label="시작일"
      />

      <label htmlFor="filter-date-to" className="sr-only">종료일</label>
      <input
        id="filter-date-to"
        type="date"
        className="filter-date-input"
        value={filters.dueDateTo ?? ''}
        onChange={(e) => setFilter({ dueDateTo: e.target.value || undefined })}
        data-testid="filter-date-to"
        aria-label="종료일"
      />

      {dateRangeError && (
        <span
          className="filter-date-error"
          role="alert"
          data-testid="date-range-error"
        >
          {dateRangeError}
        </span>
      )}

      <Button variant="secondary" size="sm" onClick={resetFilters} data-testid="reset-filters">
        필터 초기화
      </Button>
    </div>
  )
}
