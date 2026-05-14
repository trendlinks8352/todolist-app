import type { Todo } from '@/types/domain'
import { Spinner } from '@/components/Common/Spinner'
import { TodoItem } from './TodoItem'

interface TodoListProps {
  todos: Todo[]
  isLoading: boolean
}

export function TodoList({ todos, isLoading }: TodoListProps) {
  if (isLoading) {
    return (
      <div className="todo-list-loading" data-testid="todo-loading">
        <Spinner />
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <div className="todo-list-empty" data-testid="todo-empty">
        등록된 할일이 없습니다.
      </div>
    )
  }

  return (
    <ul className="todo-list" data-testid="todo-list">
      {todos.map((todo) => (
        <li key={todo.id} className="todo-list-item">
          <TodoItem todo={todo} />
        </li>
      ))}
    </ul>
  )
}
