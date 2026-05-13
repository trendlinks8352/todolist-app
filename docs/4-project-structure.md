# TodoListApp 프로젝트 구조 설계 원칙

---

## 문서 정보

| 항목 | 내용 |
|------|------|
| 버전 | v1.0 |
| 작성일 | 2026-05-12 |
| 최종 수정일 | 2026-05-12 |
| 작성자 | HEOTAEHWAN |
| 검토자 | - |
| 상태 | 작성 완료 |
| 참조 | PRD v1.1, 도메인 정의서 v1.2, 사용자 시나리오 v1.0 |

### 변경 이력

| 버전 | 날짜 | 변경 내용 | 변경자 |
|------|------|-----------|--------|
| v1.0 | 2026-05-12 | 최초 작성 — 6개 섹션 완성 (공통 원칙, 의존성/레이어, 코드/네이밍, 테스트/품질, 설정/보안/운영, 디렉토리 구조) | HEOTAEHWAN |
| v1.1 | 2026-05-12 | 기술 스택 일관성 검토 반영: "4계층" → "5계층(Middleware 포함)" 정정, Joi·axios 명칭 확정, 백엔드 JS/TS 혼재 정책 명문화, axios 표현 통일, 인증 전략 패턴 디렉토리 안내 추가 | HEOTAEHWAN |

---

## 목차

1. [최상위 공통 원칙](#1-최상위-공통-원칙)
2. [의존성/레이어 원칙](#2-의존성레이어-원칙)
3. [코드/네이밍 원칙](#3-코드네이밍-원칙)
4. [테스트/품질 원칙](#4-테스트품질-원칙)
5. [설정/보안/운영 원칙](#5-설정보안운영-원칙)
6. [디렉토리 구조](#6-디렉토리-구조)

---

## 1. 최상위 공통 원칙

### 1.1 관심사 분리 (Separation of Concerns)

**원칙**: 각 모듈, 함수, 클래스는 단 하나의 책임만 가진다.

- **백엔드**: 라우팅(routing), 요청 검증(validation), 비즈니스 로직(business logic), 데이터베이스 접근(data persistence)을 명확히 분리하여 각각 다른 계층에서 담당한다.
- **프론트엔드**: 페이지 렌더링, UI 컴포넌트 표시, 상태 관리, API 통신을 서로 다른 계층으로 분리한다.
- 한 파일/함수가 여러 책임을 갖지 않는다. 예: 컨트롤러에서 데이터베이스 쿼리 작성 금지, 컴포넌트에서 직접 API 호출 금지.

### 1.2 단방향 의존성 원칙 (Unidirectional Dependency)

**원칙**: 계층 간 의존성은 항상 상위에서 하위로만 향한다. 하위 계층이 상위 계층을 참조하지 않는다.

- **백엔드**: Router → Controller → Service → Repository 순서로만 의존한다.
  - Repository는 다른 계층을 알지 않는다.
  - Service가 Repository를 호출하며, Repository가 Service를 호출하지 않는다.
  - Controller가 Service를 호출하며, Service가 Controller를 호출하지 않는다.
  
- **프론트엔드**: Page → Component → Hook → API Client / Store 순서로만 의존한다.
  - 하위 계층(Hook, API Client, Store)이 상위 계층(Page, Component)을 import하지 않는다.
  - 순환 의존성(circular dependency)을 절대 허용하지 않는다.

### 1.3 환경별 설정 분리 원칙 (Environment-Specific Configuration)

**원칙**: 코드와 설정을 분리하며, 환경(개발/테스트/프로덕션)별로 다른 설정을 적용한다.

- 모든 환경 설정 값(API 엔드포인트, DB 연결, JWT 시크릿, CORS 설정 등)은 환경변수로 관리한다.
- 코드에 하드코딩된 설정값이 없어야 한다.
- `.env` 파일은 버전 관리에서 제외하고, `.env.example`을 제공한다.
- 환경변수 누락 시 명확한 에러 메시지를 출력하고 애플리케이션 시작을 중단한다.

### 1.4 비밀값 코드 포함 금지 원칙 (No Secrets in Code)

**원칙**: 비밀값(Secret)을 절대 소스 코드, 설정 파일, 커밋 기록에 포함하지 않는다.

- JWT 시크릿, 데이터베이스 비밀번호, API 키, bcrypt salt는 환경변수로만 관리한다.
- .env, .env.local, .env.*.local 파일은 모두 `.gitignore`에 등록한다.
- `.env.example` 파일은 저장소에 커밋하되, 실제 값이 아닌 플레이스홀더(예: `YOUR_JWT_SECRET_HERE`)를 사용한다.
- 실수로 비밀값이 커밋된 경우 즉시 git history에서 제거하고 비밀값을 로테이션한다.

### 1.5 도메인 용어 코드 반영 원칙 (Ubiquitous Language in Code)

**원칙**: 도메인 정의서의 Ubiquitous Language를 코드에 일관되게 반영한다.

- 코드의 모든 변수, 함수, 클래스명은 도메인 용어(User, Todo, Category, email, password, isCompleted, dueDate, categoryId, userId 등)를 사용한다.
- 약자나 축약형을 피한다. 예: `usr` 대신 `user`, `pwd` 대신 `password`, `cat` 대신 `category`.
- 도메인 용어와 기술 용어를 섞지 않는다. 예: `getUserTodos()`는 허용, `getTodosFromDB()`는 비허용.
- 엔티티 명은 단수형(User, Todo, Category)으로 통일한다.
- 컬렉션 변수는 복수형(users, todos, categories)으로 명명한다.

---

## 2. 의존성/레이어 원칙

### 2.1 백엔드 5계층 아키텍처

**원칙**: 백엔드는 Router → Middleware → Controller → Service → Repository 5개 계층으로 구성되며, 각 계층은 명확한 책임을 가진다. Middleware는 JWT 인증·입력 검증(Joi)·로깅 등 횡단 관심사를 담당하는 독립 계층이다.

```
┌─────────────────────────────────────────────────────┐
│                   HTTP Request                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │    Router Layer          │
        │  (Route Definition)      │
        └──────────────┬───────────┘
                       │ 요청 라우팅
                       ▼
        ┌──────────────────────────────────┐
        │    Middleware Layer              │
        │  (Authentication, Validation)    │
        └──────────────┬───────────────────┘
                       │ 검증된 요청
                       ▼
        ┌──────────────────────────────────┐
        │    Controller Layer              │
        │  (Request Handling, Response)    │
        └──────────────┬───────────────────┘
                       │ 비즈니스 로직 호출
                       ▼
        ┌──────────────────────────────────┐
        │    Service Layer                 │
        │  (Business Logic)                │
        └──────────────┬───────────────────┘
                       │ 데이터 접근 요청
                       ▼
        ┌──────────────────────────────────┐
        │    Repository Layer              │
        │  (Database Queries)              │
        │  (pg library only)               │
        └──────────────┬───────────────────┘
                       │ SQL Query
                       ▼
        ┌──────────────────────────────────┐
        │    PostgreSQL Database           │
        └──────────────────────────────────┘
```

#### 2.1.1 Router 계층

**책임**:
- HTTP 라우트 정의 (GET, POST, PUT, PATCH, DELETE)
- 라우트와 컨트롤러 메서드 매핑
- 미들웨어 연결 (인증, 검증, 에러 핸들링)

**규칙**:
- Express Router를 사용하여 라우트 정의
- 라우트 정의 파일에는 라우팅 로직만 포함
- 비즈니스 로직, 데이터 접근 코드 포함 금지
- 각 도메인별 라우터를 분리하여 관리 (auth.routes.js, todo.routes.js, category.routes.js 등)

**예시**:
```javascript
// src/routes/todo.routes.js
const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const { authenticate } = require('../middlewares/auth');

router.post('/', authenticate, todoController.createTodo);
router.get('/', authenticate, todoController.getTodos);
router.put('/:id', authenticate, todoController.updateTodo);
router.delete('/:id', authenticate, todoController.deleteTodo);

module.exports = router;
```

#### 2.1.2 Controller 계층

**책임**:
- HTTP 요청을 받아 Service 계층 호출
- 요청 데이터 추출 및 정규화
- 응답 형식 정의 및 전송
- 에러 처리 및 상태 코드 결정

**규칙**:
- 비즈니스 로직 포함 금지 (Service 계층에서 구현)
- 데이터베이스 쿼리 직접 작성 금지
- Service 메서드 호출 결과를 클라이언트 응답으로 변환
- 각 요청당 하나의 주요 작업만 수행
- 도메인별 컨트롤러 분리 (todoController.js, categoryController.js 등)

**예시**:
```javascript
// src/controllers/todoController.js
const todoService = require('../services/todoService');

exports.createTodo = async (req, res, next) => {
  try {
    const { title, description, dueDate, categoryId } = req.body;
    const userId = req.user.id; // 미들웨어에서 주입

    const newTodo = await todoService.createTodo({
      userId,
      title,
      description,
      dueDate,
      categoryId,
    });

    res.status(201).json({
      code: 'SUCCESS',
      message: '할일이 생성되었습니다.',
      data: newTodo,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTodos = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { categoryId, isCompleted, dueDateFrom, dueDateTo } = req.query;

    const todos = await todoService.getTodos(userId, {
      categoryId,
      isCompleted,
      dueDateFrom,
      dueDateTo,
    });

    res.status(200).json({
      code: 'SUCCESS',
      message: '할일 목록을 조회했습니다.',
      data: todos,
    });
  } catch (error) {
    next(error);
  }
};
```

#### 2.1.3 Service 계층

**책임**:
- 비즈니스 로직 구현
- 비즈니스 규칙(BR-01~BR-10) 적용
- 데이터 검증 및 변환
- 트랜잭션 관리
- 다른 Service 호출 조직

**규칙**:
- 비즈니스 규칙을 명시적으로 구현 (주석으로 대응하는 BR 번호 기록)
- 데이터베이스 쿼리는 Repository를 통해서만 수행
- HTTP 요청/응답 객체 참조 금지
- 도메인별 Service 분리 (todoService.js, categoryService.js 등)
- 재사용 가능한 유틸리티 함수는 utils/에 분리

**예시**:
```javascript
// src/services/todoService.js
const todoRepository = require('../repositories/todoRepository');
const categoryService = require('./categoryService');

exports.createTodo = async (todoData) => {
  const { userId, title, description, dueDate, categoryId } = todoData;

  // BR-01: 미인증 사용자는 Todo 생성 불가 (Controller에서 검증)
  // BR-04: 사용자는 본인 카테고리만 사용 가능
  const category = await categoryService.getCategory(userId, categoryId);
  if (!category) {
    throw new Error('해당 카테고리에 접근 권한이 없습니다.');
  }

  // 유효성 검사
  if (!title || title.trim().length === 0) {
    throw new Error('제목은 필수입니다.');
  }
  if (title.length > 200) {
    throw new Error('제목은 200자 이하여야 합니다.');
  }
  if (dueDate && new Date(dueDate) < new Date().setHours(0, 0, 0, 0)) {
    throw new Error('종료예정일은 오늘 이후여야 합니다.');
  }

  // Repository를 통한 데이터 생성
  const newTodo = await todoRepository.create({
    userId,
    title,
    description,
    dueDate,
    categoryId,
    isCompleted: false,
  });

  return newTodo;
};

exports.getTodos = async (userId, filters = {}) => {
  // BR-03: 사용자는 본인 할일만 조회 가능
  const { categoryId, isCompleted, dueDateFrom, dueDateTo } = filters;

  const todos = await todoRepository.find({
    userId, // 항상 포함
    categoryId,
    isCompleted,
    dueDateFrom,
    dueDateTo,
  });

  return todos;
};

exports.updateTodo = async (userId, todoId, updateData) => {
  // BR-03: 사용자는 본인 할일만 수정 가능
  const todo = await todoRepository.findById(todoId);
  
  if (!todo) {
    throw new Error('할일을 찾을 수 없습니다.');
  }
  if (todo.userId !== userId) {
    throw new Error('해당 할일에 접근 권한이 없습니다.');
  }

  const updated = await todoRepository.update(todoId, updateData);
  return updated;
};

exports.deleteTodo = async (userId, todoId) => {
  // BR-03: 사용자는 본인 할일만 삭제 가능
  const todo = await todoRepository.findById(todoId);
  
  if (!todo) {
    throw new Error('할일을 찾을 수 없습니다.');
  }
  if (todo.userId !== userId) {
    throw new Error('해당 할일에 접근 권한이 없습니다.');
  }

  await todoRepository.delete(todoId);
};
```

#### 2.1.4 Repository 계층

**책임**:
- 데이터베이스 쿼리 작성 및 실행
- 쿼리 결과 반환
- 트랜잭션 관리 (필요 시)

**규칙**:
- **pg 라이브러리만 사용** (ORM 금지)
- SQL 쿼리는 반드시 Parameterized Queries 사용 (SQL Injection 방지)
- 비즈니스 로직 포함 금지 (데이터 접근만 담당)
- 도메인별 Repository 분리 (todoRepository.js, categoryRepository.js 등)
- 공통 DB 연결 로직은 db/pool.js에서 관리

**예시**:
```javascript
// src/repositories/todoRepository.js
const pool = require('../db/pool');

exports.create = async (todoData) => {
  const { userId, title, description, dueDate, categoryId, isCompleted } = todoData;
  
  const query = `
    INSERT INTO todos (id, userId, categoryId, title, description, dueDate, isCompleted, createdAt, updatedAt)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const id = require('uuid').v4();
  const now = new Date().toISOString();

  const result = await pool.query(query, [
    id,
    userId,
    categoryId,
    title,
    description,
    dueDate || null,
    isCompleted,
    now,
    now,
  ]);

  return result.rows[0];
};

exports.find = async (filters) => {
  const { userId, categoryId, isCompleted, dueDateFrom, dueDateTo } = filters;

  let query = 'SELECT * FROM todos WHERE userId = $1';
  const values = [userId];
  let paramIndex = 2;

  if (categoryId) {
    query += ` AND categoryId = $${paramIndex}`;
    values.push(categoryId);
    paramIndex++;
  }

  if (typeof isCompleted === 'boolean') {
    query += ` AND isCompleted = $${paramIndex}`;
    values.push(isCompleted);
    paramIndex++;
  }

  if (dueDateFrom) {
    query += ` AND dueDate >= $${paramIndex}`;
    values.push(dueDateFrom);
    paramIndex++;
  }

  if (dueDateTo) {
    query += ` AND dueDate <= $${paramIndex}`;
    values.push(dueDateTo);
    paramIndex++;
  }

  query += ' ORDER BY createdAt DESC;';

  const result = await pool.query(query, values);
  return result.rows;
};

exports.findById = async (todoId) => {
  const query = 'SELECT * FROM todos WHERE id = $1;';
  const result = await pool.query(query, [todoId]);
  return result.rows[0] || null;
};

exports.update = async (todoId, updateData) => {
  const { title, description, dueDate, categoryId, isCompleted, completedAt } = updateData;

  let query = 'UPDATE todos SET ';
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (title !== undefined) {
    updates.push(`title = $${paramIndex}`);
    values.push(title);
    paramIndex++;
  }

  if (description !== undefined) {
    updates.push(`description = $${paramIndex}`);
    values.push(description);
    paramIndex++;
  }

  if (dueDate !== undefined) {
    updates.push(`dueDate = $${paramIndex}`);
    values.push(dueDate || null);
    paramIndex++;
  }

  if (categoryId !== undefined) {
    updates.push(`categoryId = $${paramIndex}`);
    values.push(categoryId);
    paramIndex++;
  }

  if (isCompleted !== undefined) {
    updates.push(`isCompleted = $${paramIndex}`);
    values.push(isCompleted);
    paramIndex++;
  }

  if (completedAt !== undefined) {
    updates.push(`completedAt = $${paramIndex}`);
    values.push(completedAt);
    paramIndex++;
  }

  updates.push(`updatedAt = $${paramIndex}`);
  values.push(new Date().toISOString());
  paramIndex++;

  query += updates.join(', ') + ` WHERE id = $${paramIndex} RETURNING *;`;
  values.push(todoId);

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

exports.delete = async (todoId) => {
  const query = 'DELETE FROM todos WHERE id = $1 RETURNING id;';
  const result = await pool.query(query, [todoId]);
  return result.rows[0] || null;
};
```

### 2.2 Middleware 계층

**원칙**: 미들웨어는 라우터 이전에 요청을 가로채어 인증, 검증, 로깅 등을 수행한다.

**필수 미들웨어**:
- **인증 미들웨어 (authenticate)**: JWT 토큰 검증, 사용자 정보 req.user에 주입
  - BR-01 구현: 미인증 사용자 차단
  - 공개 엔드포인트(회원가입, 로그인)는 이 미들웨어 제외
- **요청 검증 미들웨어 (validate)**: 요청 바디/쿼리 파라미터 검증 — `Joi` 사용 (PRD §3.2 확정)
- **에러 핸들링 미들웨어**: 에러 catch 및 통일된 에러 응답 형식

**규칙**:
- 미들웨어는 다음 미들웨어/컨트롤러로 제어 이동 (next() 호출)
- 미들웨어 실행 순서를 명확히 문서화
- 미들웨어 내에서 비즈니스 로직 구현 금지

### 2.3 프론트엔드 5계층 아키텍처

**원칙**: 프론트엔드는 Page → Component → Hook → (API Client / Store) 5개 계층으로 구성되며, 각 계층은 명확한 책임을 가진다.

```
┌──────────────────────────────────────┐
│         Page (Route)                 │
│     (Page Composition)               │
└──────────────┬───────────────────────┘
               │ 컴포넌트 조합
               ▼
┌──────────────────────────────────────┐
│    Component Layer                   │
│  (UI Rendering)                      │
└──────────────┬───────────────────────┘
               │ 상태 구독 / 이벤트
               ▼
┌──────────────────────────────────────┐
│    Custom Hook Layer                 │
│  (Logic Encapsulation)               │
└──────────┬────────────────┬──────────┘
           │                │
           ▼                ▼
    ┌──────────────┐  ┌──────────────┐
    │  API Client  │  │   Store      │
    │ (TanStack    │  │  (Zustand)   │
    │  Query)      │  │              │
    └──────────────┘  └──────────────┘
           │                │
           └────────┬───────┘
                    ▼
        ┌──────────────────────┐
        │   Backend API        │
        │   (Express Server)   │
        └──────────────────────┘
```

#### 2.3.1 Page 계층

**책임**:
- 라우트에 해당하는 페이지 렌더링
- 여러 컴포넌트 조합 (composition)
- 전역 상태 구독 및 전달

**규칙**:
- 페이지 컴포넌트는 순수 프리젠테이션만 담당
- 각 도메인별 페이지 디렉토리 (auth/, todo/, category/)
- 페이지명은 PascalCase (TodoListPage.tsx, TodoDetailPage.tsx)

**예시**:
```typescript
// src/pages/TodoListPage.tsx
import React from 'react';
import { useGetTodos } from '../hooks/useTodo';
import { useTodoStore } from '../store/todoStore';
import TodoList from '../components/Todo/TodoList';
import TodoFilters from '../components/Todo/TodoFilters';

const TodoListPage: React.FC = () => {
  const { isLoading, data: todos } = useGetTodos();
  const { filters } = useTodoStore();

  return (
    <div className="todo-list-page">
      <h1>My Todos</h1>
      <TodoFilters />
      <TodoList todos={todos} isLoading={isLoading} />
    </div>
  );
};

export default TodoListPage;
```

#### 2.3.2 Component 계층

**책임**:
- UI 렌더링
- 사용자 이벤트 처리 (onClick, onChange 등)
- Props를 통한 데이터 전달 및 콜백 처리

**규칙**:
- 컴포넌트명은 PascalCase (TodoItem.tsx, TodoForm.tsx, Button.tsx)
- 도메인별 또는 기능별 디렉토리 분리 (components/Todo/, components/Category/, components/Common/)
- 비즈니스 로직 포함 금지 (Hook에서 구현)
- API 호출 직접 금지 (Hook/API Client 사용)
- 상태 관리는 Hook과 Store에서만

**예시**:
```typescript
// src/components/Todo/TodoItem.tsx
import React from 'react';
import { Todo } from '../../types/domain';
import Checkbox from '../Common/Checkbox';
import Button from '../Common/Button';

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (todoId: string) => void;
  onDelete: (todoId: string) => void;
  onEdit: (todoId: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggleComplete,
  onDelete,
  onEdit,
}) => {
  return (
    <div className="todo-item">
      <Checkbox
        checked={todo.isCompleted}
        onChange={() => onToggleComplete(todo.id)}
      />
      <div className="todo-content">
        <h3>{todo.title}</h3>
        {todo.description && <p>{todo.description}</p>}
        {todo.dueDate && <span>Due: {todo.dueDate}</span>}
      </div>
      <Button onClick={() => onEdit(todo.id)}>Edit</Button>
      <Button onClick={() => onDelete(todo.id)}>Delete</Button>
    </div>
  );
};

export default TodoItem;
```

#### 2.3.3 Custom Hook 계층

**책임**:
- 비즈니스 로직 캡슐화
- TanStack Query와 Zustand 상호작용 조직
- 재사용 가능한 로직 추상화

**규칙**:
- 훅명은 `use`로 시작 (useTodo, useCategory, useTodoFilters 등)
- 훅 파일은 camelCase (useTodo.ts, useCategory.ts)
- 각 도메인별 훅 파일 분리 (hooks/useTodo.ts, hooks/useCategory.ts)
- API 호출은 TanStack Query (useMutation, useQuery) 사용
- 상태 업데이트는 Zustand store 호출

**예시**:
```typescript
// src/hooks/useTodo.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTodoStore } from '../store/todoStore';
import { todoAPI } from '../api/todoAPI';
import { Todo } from '../types/domain';

export const useGetTodos = () => {
  const { filters } = useTodoStore();

  return useQuery({
    queryKey: ['todos', filters],
    queryFn: () => todoAPI.getTodos(filters),
    staleTime: 5 * 60 * 1000, // 5분
  });
};

export const useCreateTodo = () => {
  const queryClient = useQueryClient();
  const { setTodos } = useTodoStore();

  return useMutation({
    mutationFn: (data: Partial<Todo>) => todoAPI.createTodo(data),
    onSuccess: (newTodo) => {
      // TanStack Query 캐시 업데이트
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      // Zustand 상태도 필요 시 업데이트
    },
    onError: (error) => {
      console.error('Failed to create todo:', error);
    },
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Todo> }) =>
      todoAPI.updateTodo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (todoId: string) => todoAPI.deleteTodo(todoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};
```

#### 2.3.4 API Client 계층 (TanStack Query)

**책임**:
- HTTP 요청 추상화
- 백엔드 API와의 통신
- 요청/응답 변환

**규칙**:
- API 클라이언트는 도메인별로 분리 (todoAPI.ts, categoryAPI.ts, authAPI.ts)
- 각 API 파일은 도메인의 CRUD 메서드 제공
- HTTP 클라이언트는 `axios` 사용 (PRD §3.2 확정). fetch API 직접 사용 금지
- `axiosClient.ts`의 **요청 인터셉터**에서 `useAuthStore.getState().accessToken`을 읽어 `Authorization: Bearer {token}` 헤더를 자동 주입한다. 각 API 파일에서 헤더를 직접 설정하지 않는다.
- 토큰은 Zustand 메모리에서만 읽는다. httpOnly Cookie·localStorage 조회 금지.
- TanStack Query hooks(useQuery, useMutation)은 hooks/ 계층에서 사용

**예시**:
```typescript
// src/api/todoAPI.ts
import axiosClient from './axiosClient';
import { Todo, CreateTodoRequest } from '../types/domain';

export const todoAPI = {
  getTodos: async (filters?: Record<string, any>) => {
    const { data } = await axiosClient.get('/api/todos', { params: filters });
    return data.data as Todo[];
  },

  getTodoById: async (id: string) => {
    const { data } = await axiosClient.get(`/api/todos/${id}`);
    return data.data as Todo;
  },

  createTodo: async (todo: CreateTodoRequest) => {
    const { data } = await axiosClient.post('/api/todos', todo);
    return data.data as Todo;
  },

  updateTodo: async (id: string, updates: Partial<Todo>) => {
    const { data } = await axiosClient.put(`/api/todos/${id}`, updates);
    return data.data as Todo;
  },

  deleteTodo: async (id: string) => {
    const { data } = await axiosClient.delete(`/api/todos/${id}`);
    return data.data;
  },
};
```

#### 2.3.5 Store 계층 (Zustand)

**책임**:
- 클라이언트 상태 관리 (UI 상태, 필터, 사용자 정보)
- 비동기 상태는 TanStack Query가 담당하므로 Store는 동기 상태만 관리

**규칙**:
- Store 파일명: camelCase (todoStore.ts, authStore.ts)
- 각 도메인별 Store 분리
- Store는 상태와 액션(상태 변경 함수)을 정의
- 서버 상태(API 응답)는 Store에 저장하지 않음 (TanStack Query 사용)

**예시**:
```typescript
// src/store/todoStore.ts
import { create } from 'zustand';

interface TodoFilters {
  categoryId?: string;
  isCompleted?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
}

interface TodoStore {
  filters: TodoFilters;
  setFilters: (filters: TodoFilters) => void;
  setFilter: (key: keyof TodoFilters, value: any) => void;
  resetFilters: () => void;
}

export const useTodoStore = create<TodoStore>((set) => ({
  filters: {},
  
  setFilters: (filters) => set({ filters }),
  
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  
  resetFilters: () => set({ filters: {} }),
}));
```

```typescript
// src/store/authStore.ts
// 토큰은 Zustand 메모리에만 저장한다. httpOnly Cookie·localStorage·sessionStorage 사용 금지.
// 탭/브라우저를 닫으면 토큰이 자동 소멸되며, 재방문 시 재로그인이 필요하다.
import { create } from 'zustand';
import { User } from '../types/domain';

interface AuthStore {
  accessToken: string | null;   // JWT Access Token — 메모리 전용
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,

  setAuth: (accessToken, user) =>
    set({ accessToken, user, isAuthenticated: true }),

  clearAuth: () =>
    set({ accessToken: null, user: null, isAuthenticated: false }),
}));
```

---

## 3. 코드/네이밍 원칙

### 3.1 파일명 컨벤션

#### 백엔드 (Node.js 22 LTS + Express 4.x)

> **언어 정책 (I-04)**: 백엔드 런타임 코드는 **CommonJS JavaScript(`.js`)** 로 작성한다. `src/types/` 디렉토리에 한해 TypeScript(`.ts`) 타입 정의 파일을 두며, 이는 IDE 자동완성·문서화 목적으로만 사용한다. `.ts` 파일은 실행 파일이 아니므로 별도 빌드 단계 없이 JSDoc 참조로만 활용한다. 향후 전체 TypeScript 전환 시 이 파일들이 출발점이 된다.

**규칙**:
- 일반 파일: camelCase (todoController.js, todoService.js, todoRepository.js)
- 라우트 파일: kebab-case + routes 접미사 (todo.routes.js, category.routes.js, auth.routes.js)
- 미들웨어 파일: 기능명 (auth.js, validation.js, errorHandler.js)
- 설정 파일: kebab-case (database.js, jwt-config.js, cors-config.js)
- 유틸리티: camelCase (passwordUtils.js, dateUtils.js, queryBuilder.js)

**예시**:
```
src/
  routes/
    auth.routes.js
    todo.routes.js
    category.routes.js
  controllers/
    authController.js
    todoController.js
    categoryController.js
  services/
    authService.js
    todoService.js
    categoryService.js
  repositories/
    userRepository.js
    todoRepository.js
    categoryRepository.js
  middlewares/
    auth.js
    validation.js
    errorHandler.js
  config/
    database.js
    jwt-config.js
    cors-config.js
  utils/
    passwordUtils.js
    tokenUtils.js
    dateUtils.js
```

#### 프론트엔드 (React + TypeScript)

**규칙**:
- 컴포넌트 파일: PascalCase (TodoItem.tsx, TodoList.tsx, TodoForm.tsx)
- 훅 파일: camelCase + use 접두사 (useTodo.ts, useCategory.ts, useAuth.ts)
- API 클라이언트 파일: camelCase + API 접미사 (todoAPI.ts, categoryAPI.ts, authAPI.ts)
- Store 파일: camelCase + Store 접미사 (todoStore.ts, authStore.ts, uiStore.ts)
- 타입 파일: camelCase + types 디렉토리 (domain.ts, api.ts, ui.ts)
- 유틸리티: camelCase (dateUtils.ts, formatters.ts, validators.ts)
- 상수: UPPER_SNAKE_CASE (constants.ts 파일 내에 정의)

**예시**:
```
src/
  pages/
    auth/
      LoginPage.tsx
      SignupPage.tsx
    todo/
      TodoListPage.tsx
      TodoDetailPage.tsx
  components/
    Common/
      Button.tsx
      Input.tsx
      Modal.tsx
    Todo/
      TodoItem.tsx
      TodoList.tsx
      TodoForm.tsx
    Category/
      CategoryDropdown.tsx
  hooks/
    useTodo.ts
    useCategory.ts
    useAuth.ts
  api/
    todoAPI.ts
    categoryAPI.ts
    authAPI.ts
  store/
    todoStore.ts
    authStore.ts
    uiStore.ts
  types/
    domain.ts
    api.ts
    ui.ts
  utils/
    dateUtils.ts
    formatters.ts
    validators.ts
  constants/
    constants.ts
```

### 3.2 변수·함수 네이밍

#### 공통 원칙

- **도메인 용어 우선**: 도메인 정의서의 Ubiquitous Language 사용
- **명확성**: 축약형 금지 (usr → user, pwd → password, cat → category)
- **일관성**: 같은 개념은 프론트·백엔드 모두 동일한 이름 사용

#### 변수 네이밍

**규칙**:
- 로컬 변수, 매개변수: camelCase
- 상수: UPPER_SNAKE_CASE
- 엔티티 변수: 단수형 (user, todo, category)
- 컬렉션 변수: 복수형 (users, todos, categories)
- Boolean 변수: `is`, `has`, `can` 접두사 사용 (isCompleted, hasError, canEdit)
- 조건문에서 도메인 용어 사용 (authenticate, authorize, validate 등)

**예시**:
```typescript
// 좋은 예
const user = { id: '123', email: 'user@example.com' };
const todos = [{ id: '1', title: 'Task 1' }];
const isCompleted = true;
const categoryId = 'cat-001';
const MAX_TITLE_LENGTH = 200;
const JWT_EXPIRATION_TIME = '7d';

// 나쁜 예
const usr = { id: '123', email: 'user@example.com' };
const t = [{ id: '1', title: 'Task 1' }];
const completed = true;
const cid = 'cat-001';
const maxTitleLen = 200;
const jwtExp = '7d';
```

#### 함수 네이밍

**규칙**:
- camelCase로 작성
- 동사 + 명사 형태 (getUser, createTodo, updateCategory, deleteTodo)
- 비동기 함수도 동일한 규칙 (async 키워드 사용하되, 이름에 async 명시 X)
- 조건 확인: `is`, `has`, `can` 접두사 (isValid, hasPermission, canDelete)
- 변환: `to`, `from` 접두사 (toJSON, fromDatabase)

**예시**:
```typescript
// 좋은 예
function getUser(userId: string) { /* ... */ }
async function createTodo(todoData) { /* ... */ }
function updateCategory(categoryId, updates) { /* ... */ }
function deleteTodo(todoId) { /* ... */ }
function isValidEmail(email: string) { /* ... */ }
function hasUserPermission(userId, resourceId) { /* ... */ }
function canEditTodo(userId, todoId) { /* ... */ }
function toJSON(obj) { /* ... */ }
function fromDatabase(row) { /* ... */ }

// 나쁜 예
function getUserData(userId) { /* ... */ }
async function createATodo(todoData) { /* ... */ }
function updateCat(catId, updates) { /* ... */ }
function remove(todoId) { /* ... */ }
function validateEmail(email) { /* ... */ }
function checkAuth(userId, resourceId) { /* ... */ }
function editTodo(userId, todoId) { /* ... */ }
```

### 3.3 API 응답 ↔ 프론트 상태 필드명 일치 원칙

**원칙**: 백엔드 API 응답의 필드명과 프론트엔드 상태의 필드명을 정확히 일치시킨다.

**규칙**:
- 백엔드에서 응답하는 필드명: 스네이크 케이스 (snake_case) 또는 카멜 케이스 (camelCase) 통일
- **권장**: 프로젝트 전체에서 camelCase 사용 (JSON 표준, JavaScript 친화적)
- 프론트엔드 상태 변수명: 응답 필드명과 정확히 일치
- 타입 정의: 백엔드-프론트엔드 공유 타입 파일 (types/domain.ts)

**예시**:
```typescript
// 백엔드 응답
{
  "code": "SUCCESS",
  "message": "할일이 생성되었습니다.",
  "data": {
    "id": "uuid-1234",
    "userId": "user-uuid",
    "categoryId": "cat-uuid",
    "title": "Task Title",
    "description": "Task Description",
    "dueDate": "2026-05-20",
    "isCompleted": false,
    "completedAt": null,
    "createdAt": "2026-05-12T10:00:00Z",
    "updatedAt": "2026-05-12T10:00:00Z"
  }
}

// 프론트엔드 타입 정의
interface Todo {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description?: string;
  dueDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 프론트엔드 상태 (Store)
const todo: Todo = {
  id: 'uuid-1234',
  userId: 'user-uuid',
  categoryId: 'cat-uuid',
  title: 'Task Title',
  description: 'Task Description',
  dueDate: '2026-05-20',
  isCompleted: false,
  completedAt: null,
  createdAt: '2026-05-12T10:00:00Z',
  updatedAt: '2026-05-12T10:00:00Z',
};
```

### 3.4 상수 및 환경변수 명명

#### 상수 (UPPER_SNAKE_CASE)

**규칙**:
- 모든 상수는 UPPER_SNAKE_CASE
- 상수는 별도의 constants.ts 파일에 중앙화
- 도메인별 상수 분리 (TODO_CONSTANTS, CATEGORY_CONSTANTS 등)

**예시**:
```typescript
// src/constants/constants.ts (백엔드)
const TODO_CONSTANTS = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  DEFAULT_CATEGORY_ID: 'default',
};

const CATEGORY_CONSTANTS = {
  MAX_NAME_LENGTH: 50,
};

const JWT_CONSTANTS = {
  EXPIRATION_TIME: '7d',
  ALGORITHM: 'HS256',
};

module.exports = {
  TODO_CONSTANTS,
  CATEGORY_CONSTANTS,
  JWT_CONSTANTS,
};

// src/constants/constants.ts (프론트엔드)
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const TODO_CONSTANTS = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const ERROR_CODES = {
  INVALID_EMAIL: 'INVALID_EMAIL',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
};
```

#### 환경변수 (UPPER_SNAKE_CASE)

**규칙**:
- 모든 환경변수는 UPPER_SNAKE_CASE
- 프리픽스로 범주 분류 (DB_, JWT_, CORS_, API_ 등)
- .env 파일과 .env.example 파일에서 동일한 이름 사용

**예시**:
```bash
# .env (프로덕션 - .gitignore 포함)
DB_HOST=db.example.com
DB_PORT=5432
DB_NAME=todolist_prod
DB_USER=prod_user
DB_PASSWORD=actual_password_here
JWT_SECRET=your-secret-key-here-min-32-chars
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
NODE_ENV=production
CORS_ORIGIN=https://app.example.com
LOG_LEVEL=info

# .env.example (공유 파일 - 실제 값 없음)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todolist_dev
DB_USER=dev_user
DB_PASSWORD=YOUR_DB_PASSWORD_HERE
JWT_SECRET=YOUR_JWT_SECRET_HERE_MIN_32_CHARS
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

```typescript
// 프론트엔드 환경변수
// .env
REACT_APP_API_URL=https://api.example.com
REACT_APP_JWT_STORAGE_KEY=todolist_jwt

// .env.development
REACT_APP_API_URL=http://localhost:3001
REACT_APP_JWT_STORAGE_KEY=todolist_jwt_dev

// .env.example
REACT_APP_API_URL=http://localhost:3001
REACT_APP_JWT_STORAGE_KEY=todolist_jwt
```

### 3.5 타입 정의 위치 원칙 (TypeScript)

**원칙**: TypeScript 타입 정의는 중앙화하여 백엔드-프론트엔드 간 일관성을 보장한다.

**백엔드 타입 정의**:
```typescript
// src/types/domain.ts
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Todo {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description?: string;
  dueDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  userId?: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export type { User, Todo, Category };
```

```typescript
// src/types/request.ts
interface CreateTodoRequest {
  title: string;
  description?: string;
  dueDate?: string;
  categoryId: string;
}

interface UpdateTodoRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  categoryId?: string;
  isCompleted?: boolean;
}

export type { CreateTodoRequest, UpdateTodoRequest };
```

```typescript
// src/types/response.ts
interface ApiResponse<T> {
  code: 'SUCCESS' | 'ERROR';
  message: string;
  data?: T;
  error?: {
    code: string;
    details: Record<string, any>;
  };
}

export type { ApiResponse };
```

**프론트엔드 타입 정의** (백엔드와 동일):
```typescript
// src/types/domain.ts (백엔드와 동일한 구조)
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Todo {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description?: string;
  dueDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  userId?: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export type { User, Todo, Category };
```

---

## 4. 테스트/품질 원칙

### 4.1 테스트 전략

**원칙**: 각 계층별로 적절한 수준의 테스트를 수행하며, 비즈니스 규칙을 검증하는 테스트를 우선 작성한다.

#### 백엔드 테스트

**테스트 우선순위**:
1. **통합 테스트** (Integration Test) — 최우선
   - Repository ↔ 실제 DB 연동 테스트
   - Service ↔ Repository 통합 테스트
   - Controller ↔ Service 통합 테스트
   - API 엔드포인트 전체 흐름 테스트 (요청 → 응답)

2. **단위 테스트** (Unit Test)
   - Service의 비즈니스 로직 단위 테스트
   - 유틸리티 함수 테스트

3. **E2E 테스트** (End-to-End Test)
   - 전체 API 시나리오 테스트 (회원가입 → 로그인 → 할일 생성 등)

**이유**: pg 라이브러리는 ORM이 아니므로 실제 DB와 연동하여 SQL 쿼리 검증이 중요함.

**필수 테스트 항목** (비즈니스 규칙):
- BR-01: 미인증 사용자는 Todo/Category API 접근 불가 → 미들웨어 검증 테스트
- BR-03: 사용자는 본인 할일만 접근 가능 → Service 소유권 검증 테스트
- BR-04: 사용자는 본인 카테고리만 접근 가능 → Service 소유권 검증 테스트
- BR-09: 카테고리 삭제 시 할일 자동 이관 → 트랜잭션 통합 테스트
- BR-10: 할일 완료 시 completedAt 자동 설정 → Service 로직 테스트
- DC-01: 사용자 탈퇴 시 연관 데이터 CASCADE 삭제 → DB 외래키 검증 테스트
- DC-06: 공개 엔드포인트 (회원가입, 로그인) → 미들웨어 미적용 확인 테스트

**테스트 프레임워크**: Jest + Supertest (또는 이에 준하는 도구)

**예시**:
```javascript
// test/integration/todoService.test.js
const todoService = require('../../src/services/todoService');
const todoRepository = require('../../src/repositories/todoRepository');
const pool = require('../../src/db/pool');

describe('TodoService - Business Logic', () => {
  let testUserId, testCategoryId;

  beforeAll(async () => {
    // 테스트 데이터 설정
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('BR-03: 사용자는 본인 할일만 접근 가능', () => {
    it('사용자가 본인 할일을 조회할 수 있어야 한다', async () => {
      const todos = await todoService.getTodos(testUserId, {});
      expect(todos).toHaveLength(1);
      expect(todos[0].userId).toBe(testUserId);
    });

    it('사용자가 타인 할일을 조회할 수 없어야 한다', async () => {
      const otherUserId = 'other-user-id';
      const todos = await todoService.getTodos(otherUserId, {});
      expect(todos).toHaveLength(0);
    });

    it('사용자가 타인 할일을 수정할 수 없어야 한다', async () => {
      const otherUserId = 'other-user-id';
      const todoId = 'test-todo-id';
      
      try {
        await todoService.updateTodo(otherUserId, todoId, { title: 'Hacked' });
        fail('Should throw error');
      } catch (error) {
        expect(error.message).toContain('접근 권한이 없습니다');
      }
    });
  });

  describe('BR-10: 할일 완료 시 completedAt 자동 설정', () => {
    it('할일을 완료 처리하면 completedAt이 설정되어야 한다', async () => {
      const updated = await todoService.updateTodo(testUserId, testTodoId, {
        isCompleted: true,
      });

      expect(updated.isCompleted).toBe(true);
      expect(updated.completedAt).not.toBeNull();
      expect(new Date(updated.completedAt)).toBeInstanceOf(Date);
    });
  });
});
```

```javascript
// test/integration/todoController.test.js
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');

describe('Todo API', () => {
  let token, userId;

  beforeAll(async () => {
    // 테스트 사용자 생성 및 토큰 획득
  });

  describe('BR-01: 미인증 사용자 접근 차단', () => {
    it('토큰 없이 할일 목록을 조회할 수 없어야 한다', async () => {
      const res = await request(app)
        .get('/api/todos')
        .expect(401);

      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('유효하지 않은 토큰으로 할일 생성을 시도할 수 없어야 한다', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', 'Bearer invalid-token')
        .send({ title: 'Test' })
        .expect(401);

      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('DC-06: 공개 엔드포인트 (회원가입, 로그인)', () => {
    it('회원가입은 토큰 없이 접근 가능해야 한다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
    });

    it('로그인은 토큰 없이 접근 가능해야 한다', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(res.body.data.token).toBeDefined();
    });
  });
});
```

#### 프론트엔드 테스트

**테스트 우선순위**:
1. **컴포넌트 단위 테스트** (React Testing Library)
   - Props 전달 및 렌더링 검증
   - 사용자 이벤트(클릭, 입력) 처리 검증
   - 조건부 렌더링 검증

2. **Hook 테스트** (react-hooks-testing-library)
   - TanStack Query hooks (useQuery, useMutation) 동작 검증
   - Zustand Store 상태 변경 검증

3. **통합 테스트** (Vitest)
   - 여러 컴포넌트 + Hook 조합 테스트

**테스트 프레임워크**: Vitest + React Testing Library

**예시**:
```typescript
// src/components/Todo/TodoItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import TodoItem from './TodoItem';
import { Todo } from '../../types/domain';

describe('TodoItem Component', () => {
  const mockTodo: Todo = {
    id: '1',
    userId: 'user-1',
    categoryId: 'cat-1',
    title: 'Test Todo',
    description: 'Test Description',
    dueDate: '2026-05-20',
    isCompleted: false,
    completedAt: null,
    createdAt: '2026-05-12T10:00:00Z',
    updatedAt: '2026-05-12T10:00:00Z',
  };

  it('할일 제목을 렌더링해야 한다', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggleComplete={() => {}}
        onDelete={() => {}}
        onEdit={() => {}}
      />
    );

    expect(screen.getByText('Test Todo')).toBeInTheDocument();
  });

  it('완료 체크박스 클릭 시 onToggleComplete 콜백이 호출되어야 한다', () => {
    const mockCallback = vi.fn();
    render(
      <TodoItem
        todo={mockTodo}
        onToggleComplete={mockCallback}
        onDelete={() => {}}
        onEdit={() => {}}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockCallback).toHaveBeenCalledWith('1');
  });
});
```

```typescript
// src/hooks/useTodo.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGetTodos } from './useTodo';

describe('useTodo Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  it('할일 목록을 조회해야 한다', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useGetTodos(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(expect.any(Array));
  });
});
```

### 4.2 테스트 DB 분리 원칙

**원칙**: 테스트는 프로덕션 데이터베이스와 완전히 분리된 테스트 DB를 사용한다.

**규칙**:
- 테스트 환경변수 파일: `.env.test`
- 테스트 DB: `todolist_test` (또는 유사한 이름)
- 각 테스트 실행 전 테스트 DB 초기화 (마이그레이션 + seed)
- 테스트 실행 후 테스트 DB 정리

**예시**:
```bash
# .env.test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todolist_test
DB_USER=test_user
DB_PASSWORD=test_password
NODE_ENV=test
```

```javascript
// test/setup.js
const pool = require('../src/db/pool');
const { spawn } = require('child_process');

beforeAll(async () => {
  // 테스트 DB 마이그레이션
  await new Promise((resolve, reject) => {
    const proc = spawn('npm', ['run', 'migrate:test']);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error('Migration failed'));
    });
  });
});

afterAll(async () => {
  await pool.end();
});
```

### 4.3 린트 및 포맷 통일

**원칙**: 모든 코드는 동일한 린트와 포맷 규칙을 따른다.

**도구**:
- **Linter**: ESLint (JavaScript/TypeScript)
- **Formatter**: Prettier
- **Git Hook**: husky + lint-staged (커밋 전 자동 검사)

**설정 파일**:
```json
// .eslintrc.json
{
  "env": {
    "node": true,
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-unused-vars": "warn",
    "no-console": ["warn", { "allow": ["error", "warn"] }],
    "prefer-const": "error",
    "eqeqeq": ["error", "always"]
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

```json
// package.json
{
  "scripts": {
    "lint": "eslint src --ext .js,.ts,.tsx",
    "lint:fix": "eslint src --fix --ext .js,.ts,.tsx",
    "format": "prettier --write \"src/**/*.{js,ts,tsx}\"",
    "test": "jest --coverage"
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

---

## 5. 설정/보안/운영 원칙

### 5.1 환경변수 관리

**원칙**: 모든 설정 값을 환경변수로 관리하며, .env 파일은 버전 관리 제외한다.

#### .env 파일 구조 (백엔드)

```bash
# .env.example (저장소 커밋)
# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todolist_dev
DB_USER=dev_user
DB_PASSWORD=YOUR_DB_PASSWORD_HERE

# ============================================
# JWT CONFIGURATION
# ============================================
JWT_SECRET=YOUR_JWT_SECRET_HERE_MIN_32_CHARS
JWT_EXPIRES_IN=7d

# ============================================
# BCRYPT CONFIGURATION
# ============================================
BCRYPT_SALT_ROUNDS=10

# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=development
SERVER_PORT=3001
CORS_ORIGIN=http://localhost:3000

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=debug
```

```bash
# .env (실행 환경에 따라 수정, .gitignore 포함)
DB_HOST=db.example.com
DB_PORT=5432
DB_NAME=todolist_prod
DB_USER=prod_user
DB_PASSWORD=actual_secure_password
JWT_SECRET=actual_secure_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
NODE_ENV=production
SERVER_PORT=3001
CORS_ORIGIN=https://app.example.com
LOG_LEVEL=info
```

#### .env 파일 구조 (프론트엔드)

```bash
# .env.example (저장소 커밋)
REACT_APP_API_URL=http://localhost:3001
REACT_APP_JWT_STORAGE_KEY=todolist_jwt

# .env (프로덕션, .gitignore 포함)
REACT_APP_API_URL=https://api.example.com
REACT_APP_JWT_STORAGE_KEY=todolist_jwt
```

#### 환경변수 검증

**규칙**:
- 애플리케이션 시작 시 필수 환경변수 검증
- 누락된 경우 명확한 에러 메시지와 함께 시작 중단

**예시**:
```javascript
// src/config/env-validation.js
function validateEnv() {
  const requiredEnvs = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'BCRYPT_SALT_ROUNDS',
    'NODE_ENV',
  ];

  const missing = requiredEnvs.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    console.error(`❌ 필수 환경변수가 누락되었습니다: ${missing.join(', ')}`);
    console.error('💡 .env 파일을 설정하고 다시 시작하세요.');
    process.exit(1);
  }

  // JWT_SECRET 최소 길이 검증
  if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET은 최소 32자 이상이어야 합니다.');
    process.exit(1);
  }

  console.log('✅ 환경변수 검증 완료');
}

module.exports = { validateEnv };
```

```javascript
// src/index.js
const { validateEnv } = require('./config/env-validation');

validateEnv();

const app = require('./app');
const port = process.env.SERVER_PORT || 3001;

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
```

### 5.2 JWT 시크릿 관리

**원칙**: JWT 시크릿은 환경변수로만 관리하며, 최소 길이를 강제한다.

**규칙**:
- 최소 길이: 32자 이상 (HS256 권장)
- 특수문자, 숫자, 대소문자 혼합 권장
- 프로덕션 환경에서는 정기적으로 로테이션 (월 1회 또는 이상 징후 시)
- 로테이션 시 이전 시크릿도 일정 기간 허용 (인증된 토큰 검증 위해)

**예시**:
```javascript
// src/config/jwt-config.js
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_ALGORITHM = 'HS256';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET must be at least 32 characters. Update your .env file.'
  );
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_ALGORITHM,
};
```

```javascript
// src/utils/tokenUtils.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_ALGORITHM } = require('../config/jwt-config');

exports.generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: JWT_ALGORITHM,
  });
};

exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

### 5.3 bcrypt Salt Round 설정

**원칙**: bcrypt 해싱은 환경변수로 salt round를 관리한다.

**규칙**:
- 개발 환경: 8-10 rounds (빠른 테스트)
- 프로덕션 환경: 12-13 rounds (보안 강화)
- 해싱 시간: 약 100ms (프로덕션 기준)

**예시**:
```javascript
// src/config/bcrypt-config.js
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

if (BCRYPT_SALT_ROUNDS < 8 || BCRYPT_SALT_ROUNDS > 14) {
  throw new Error('BCRYPT_SALT_ROUNDS must be between 8 and 14');
}

module.exports = { BCRYPT_SALT_ROUNDS };
```

```javascript
// src/utils/passwordUtils.js
const bcrypt = require('bcrypt');
const { BCRYPT_SALT_ROUNDS } = require('../config/bcrypt-config');

exports.hashPassword = async (password) => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

exports.comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
```

### 5.4 CORS 설정

**원칙**: CORS는 환경별로 다르게 설정하며, 프로덕션에서는 특정 도메인만 허용한다.

**규칙**:
- 개발 환경: `http://localhost:3000` 허용
- 프로덕션 환경: 실제 프론트엔드 도메인만 허용
- 자격증명(credentials) 포함 요청 허용 (쿠키, JWT 등)

**예시**:
```javascript
// src/config/cors-config.js
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

const corsOptions = {
  origin: CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = { corsOptions };
```

```javascript
// src/app.js
const express = require('express');
const cors = require('cors');
const { corsOptions } = require('./config/cors-config');

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

// ... routes

module.exports = app;
```

### 5.5 로깅 원칙

**원칙**: 에러 및 주요 이벤트를 로깅하되, 민감한 정보는 절대 로그에 포함하지 않는다.

**규칙**:
- 에러 로그: 필수 (모든 예외)
- 경고 로그: 비정상 상황 (인증 실패, 검증 오류 등)
- 정보 로그: 주요 이벤트 (사용자 등록, 할일 생성 등)
- 디버그 로그: 개발 환경 전용

**절대 로깅하면 안 되는 정보**:
- 비밀번호, API 키, JWT 시크릿
- 개인정보 (이메일 주소는 선택적)
- 신용카드 번호, SSN 등 민감한 데이터

**예시**:
```javascript
// src/utils/logger.js
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = levels[LOG_LEVEL] || levels.info;

function log(level, message, data = {}) {
  if (levels[level] <= currentLevel) {
    const timestamp = new Date().toISOString();
    console.log(
      JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        ...data,
      })
    );
  }
}

module.exports = {
  error: (message, data) => log('error', message, data),
  warn: (message, data) => log('warn', message, data),
  info: (message, data) => log('info', message, data),
  debug: (message, data) => log('debug', message, data),
};
```

```javascript
// src/services/authService.js
const logger = require('../utils/logger');

exports.login = async (email, password) => {
  try {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      logger.warn('Login failed: user not found', { email }); // OK: 이메일 로깅
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      logger.warn('Login failed: invalid password', { email }); // OK
      throw new Error('Invalid credentials');
    }

    logger.info('User logged in successfully', { userId: user.id });

    const token = generateToken({ id: user.id, email: user.email });

    return { token, user };
  } catch (error) {
    logger.error('Login error', { error: error.message });
    throw error;
  }
};

// ❌ 절대 금지
logger.info('User password', { password }); // 비밀번호 로깅 금지
logger.debug('Token', { token: JWT_SECRET }); // 시크릿 로깅 금지
```

---

## 6. 디렉토리 구조

### 6.1 백엔드 디렉토리 구조 (Node.js + Express)

```
backend/
├── src/
│   ├── index.js                          # 앱 엔트리포인트
│   ├── app.js                            # Express 앱 설정 (미들웨어, 라우터 등록)
│   │
│   ├── routes/                           # 라우팅 계층 — HTTP 라우트 정의
│   │   ├── index.js                      # 모든 라우트 통합
│   │   ├── auth.routes.js                # 인증 라우트 (회원가입, 로그인, 로그아웃)
│   │   ├── todo.routes.js                # 할일 라우트 (CRUD)
│   │   └── category.routes.js            # 카테고리 라우트 (CRUD)
│   │
│   ├── controllers/                      # 컨트롤러 계층 — 요청 처리 및 응답 형성
│   │   ├── authController.js             # 인증 로직 컨트롤러 (register, login, logout)
│   │   ├── todoController.js             # 할일 CRUD 컨트롤러
│   │   ├── categoryController.js         # 카테고리 CRUD 컨트롤러
│   │   └── userController.js             # 사용자 정보 조회/수정 컨트롤러
│   │
│   ├── services/                         # 서비스 계층 — 비즈니스 로직 구현
│   │   ├── authService.js                # 인증 비즈니스 로직 (회원가입 검증, 토큰 생성)
│   │   ├── todoService.js                # 할일 비즈니스 로직 (BR-03, BR-10 등)
│   │   ├── categoryService.js            # 카테고리 비즈니스 로직 (BR-04, BR-09 등)
│   │   └── userService.js                # 사용자 비즈니스 로직 (탈퇴, 정보 수정 등)
│   │
│   ├── repositories/                     # 저장소 계층 — DB 쿼리 (pg 라이브러리만 사용)
│   │   ├── userRepository.js             # 사용자 테이블 쿼리 (CRUD)
│   │   ├── todoRepository.js             # 할일 테이블 쿼리 (CRUD)
│   │   └── categoryRepository.js         # 카테고리 테이블 쿼리 (CRUD)
│   │
│   ├── middlewares/                      # 미들웨어 계층 — 요청 전처리
│   │   ├── auth.js                       # JWT 검증 미들웨어 (BR-01 구현). 2차 OAuth 확장 시 strategies/ 참조
│   │   ├── validation.js                 # 요청 검증 미들웨어 (Joi — PRD §3.2 확정)
│   │   ├── errorHandler.js               # 에러 핸들링 미들웨어
│   │   └── logger.js                     # 요청/응답 로깅 미들웨어
│   │
│   ├── auth/                             # 인증 전략 — 2차 OAuth 확장 대비 (I-08)
│   │   ├── strategies/                   # 전략 패턴 구현체 디렉토리
│   │   │   ├── jwtStrategy.js            # 1차: JWT 전략
│   │   │   └── oauthStrategy.js          # 2차: OAuth Social 전략 (예정, 미구현)
│   │   └── authStrategy.js              # 전략 인터페이스 (공통 계약 정의)
│   │
│   ├── db/                               # 데이터베이스 관련
│   │   ├── pool.js                       # PostgreSQL 연결 풀 (pg 라이브러리)
│   │   ├── schema.sql                    # DDL (테이블 스키마, 외래키, 인덱스)
│   │   ├── seed.sql                      # 초기 데이터 (기본 카테고리 등)
│   │   └── migrations/                   # DB 마이그레이션 (변경 관리)
│   │       ├── 001-init-schema.sql
│   │       └── 002-add-default-categories.sql
│   │
│   ├── config/                           # 설정 파일
│   │   ├── env-validation.js             # 환경변수 검증
│   │   ├── jwt-config.js                 # JWT 설정
│   │   ├── bcrypt-config.js              # bcrypt 설정
│   │   ├── cors-config.js                # CORS 설정
│   │   └── database.js                   # DB 연결 설정
│   │
│   ├── utils/                            # 유틸리티 함수
│   │   ├── passwordUtils.js              # 비밀번호 해싱/검증
│   │   ├── tokenUtils.js                 # JWT 토큰 생성/검증
│   │   ├── dateUtils.js                  # 날짜 관련 유틸
│   │   ├── queryBuilder.js               # 동적 SQL 쿼리 빌더
│   │   └── logger.js                     # 로깅 유틸
│   │
│   ├── types/                            # TypeScript 타입 정의
│   │   ├── domain.ts                     # 도메인 타입 (User, Todo, Category)
│   │   ├── request.ts                    # 요청 타입 (CreateTodoRequest 등)
│   │   └── response.ts                   # 응답 타입 (ApiResponse 등)
│   │
│   └── constants/                        # 상수
│       └── constants.js                  # 상수 정의 (MAX_TITLE_LENGTH 등)
│
├── test/                                 # 테스트 디렉토리
│   ├── setup.js                          # 테스트 환경 설정
│   ├── integration/                      # 통합 테스트 (우선)
│   │   ├── auth.test.js
│   │   ├── todo.test.js
│   │   └── category.test.js
│   ├── unit/                             # 단위 테스트
│   │   ├── authService.test.js
│   │   ├── todoService.test.js
│   │   └── passwordUtils.test.js
│   └── e2e/                              # E2E 테스트
│       └── user-workflow.test.js
│
├── .env.example                          # 환경변수 템플릿 (저장소 커밋)
├── .env                                  # 실제 환경변수 (.gitignore)
├── .gitignore                            # Git 제외 파일
├── .eslintrc.json                        # ESLint 설정
├── .prettierrc                           # Prettier 설정
├── package.json                          # 프로젝트 메타데이터
├── package-lock.json                     # 의존성 락 파일
└── README.md                             # 프로젝트 설명서
```

### 6.2 프론트엔드 디렉토리 구조 (React 19 + TypeScript)

```
frontend/
├── src/
│   ├── index.tsx                         # 리액트 엔트리포인트
│   ├── App.tsx                           # 루트 컴포넌트
│   │
│   ├── pages/                            # 페이지 계층 — 라우트별 페이지 컴포넌트
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx             # 로그인 페이지
│   │   │   └── SignupPage.tsx            # 회원가입 페이지
│   │   ├── todo/
│   │   │   ├── TodoListPage.tsx          # 할일 목록 페이지
│   │   │   ├── TodoDetailPage.tsx        # 할일 상세 페이지
│   │   │   └── TodoCreatePage.tsx        # 할일 생성 페이지
│   │   ├── category/
│   │   │   ├── CategoryListPage.tsx      # 카테고리 목록 페이지
│   │   │   └── CategoryCreatePage.tsx    # 카테고리 생성 페이지
│   │   ├── user/
│   │   │   ├── UserProfilePage.tsx       # 사용자 프로필 페이지
│   │   │   └── UserSettingsPage.tsx      # 사용자 설정 페이지
│   │   └── 404Page.tsx                   # 404 에러 페이지
│   │
│   ├── components/                       # 컴포넌트 계층 — UI 렌더링
│   │   ├── Common/                       # 공통 컴포넌트
│   │   │   ├── Button.tsx                # 버튼 컴포넌트
│   │   │   ├── Input.tsx                 # 입력 필드 컴포넌트
│   │   │   ├── Modal.tsx                 # 모달 컴포넌트
│   │   │   ├── Toast.tsx                 # 토스트 알림 컴포넌트
│   │   │   ├── Spinner.tsx               # 로딩 스피너
│   │   │   ├── Checkbox.tsx              # 체크박스 컴포넌트
│   │   │   ├── Dropdown.tsx              # 드롭다운 컴포넌트
│   │   │   └── Layout.tsx                # 레이아웃 래퍼
│   │   ├── Auth/                         # 인증 관련 컴포넌트
│   │   │   ├── LoginForm.tsx             # 로그인 폼
│   │   │   └── SignupForm.tsx            # 회원가입 폼
│   │   ├── Todo/                         # 할일 관련 컴포넌트
│   │   │   ├── TodoItem.tsx              # 할일 아이템
│   │   │   ├── TodoList.tsx              # 할일 목록 (컬렉션)
│   │   │   ├── TodoForm.tsx              # 할일 작성/수정 폼
│   │   │   ├── TodoFilters.tsx           # 필터 UI 컴포넌트
│   │   │   └── TodoStats.tsx             # 통계 표시 컴포넌트
│   │   ├── Category/                     # 카테고리 관련 컴포넌트
│   │   │   ├── CategoryItem.tsx
│   │   │   ├── CategoryList.tsx
│   │   │   ├── CategoryForm.tsx
│   │   │   └── CategoryDropdown.tsx
│   │   └── User/                         # 사용자 관련 컴포넌트
│   │       ├── UserProfile.tsx
│   │       └── UserSettings.tsx
│   │
│   ├── hooks/                            # 훅 계층 — 로직 캡슐화
│   │   ├── useTodo.ts                    # 할일 관련 훅 (CRUD, 필터링)
│   │   │   # export const useGetTodos, useCreateTodo, useUpdateTodo, useDeleteTodo
│   │   ├── useCategory.ts                # 카테고리 관련 훅
│   │   │   # export const useGetCategories, useCreateCategory, useDeleteCategory
│   │   ├── useAuth.ts                    # 인증 관련 훅
│   │   │   # export const useLogin, useSignup, useLogout
│   │   ├── useUser.ts                    # 사용자 관련 훅
│   │   │   # export const useGetUser, useUpdateUser
│   │   ├── usePagination.ts              # 페이지네이션 훅
│   │   └── useForm.ts                    # 폼 상태 관리 훅
│   │
│   ├── api/                              # API 클라이언트 계층 — HTTP 통신
│   │   ├── axiosClient.ts                # axios 인스턴스. 요청 인터셉터에서 authStore의 accessToken을 읽어 Authorization 헤더에 자동 주입
│   │   ├── todoAPI.ts                    # 할일 API 클라이언트
│   │   │   # export const todoAPI: { getTodos, createTodo, updateTodo, deleteTodo }
│   │   ├── categoryAPI.ts                # 카테고리 API 클라이언트
│   │   ├── authAPI.ts                    # 인증 API 클라이언트
│   │   └── userAPI.ts                    # 사용자 API 클라이언트
│   │
│   ├── store/                            # 저장소 계층 — 클라이언트 상태 (Zustand)
│   │   ├── todoStore.ts                  # 할일 필터/UI 상태
│   │   │   # export const useTodoStore: { filters, setFilters, etc }
│   │   ├── categoryStore.ts              # 카테고리 UI 상태
│   │   ├── authStore.ts                  # 인증 상태 (accessToken + 사용자 정보 — 메모리 전용, Cookie/localStorage 금지)
│   │   └── uiStore.ts                    # 글로벌 UI 상태 (토스트, 모달 등)
│   │
│   ├── types/                            # 타입 정의 (TypeScript)
│   │   ├── domain.ts                     # 도메인 타입 (User, Todo, Category)
│   │   ├── api.ts                        # API 요청/응답 타입
│   │   ├── ui.ts                         # UI 관련 타입
│   │   └── form.ts                       # 폼 타입
│   │
│   ├── constants/                        # 상수
│   │   └── constants.ts                  # 프론트 상수 (API_URL, MAX_TITLE_LENGTH 등)
│   │
│   ├── utils/                            # 유틸리티 함수
│   │   ├── dateUtils.ts                  # 날짜 포맷팅
│   │   ├── formatters.ts                 # 데이터 포맷팅
│   │   ├── validators.ts                 # 입력 검증
│   │   ├── storage.ts                    # 로컬스토리지 관리
│   │   └── errorHandler.ts               # 에러 처리
│   │
│   ├── styles/                           # 스타일 파일
│   │   ├── global.css                    # 글로벌 스타일
│   │   ├── variables.css                 # CSS 변수 (색상, 타이포그래피)
│   │   ├── responsive.css                # 반응형 디자인 (Mobile-first)
│   │   └── components/                   # 컴포넌트별 스타일
│   │       ├── Button.css
│   │       ├── Input.css
│   │       ├── Modal.css
│   │       └── ...
│   │
│   └── config/                           # 설정
│       ├── queryClient.ts                # TanStack Query 설정
│       └── axiosConfig.ts                # axios 설정
│
├── test/                                 # 테스트 디렉토리
│   ├── setup.ts                          # 테스트 환경 설정
│   ├── components/                       # 컴포넌트 테스트
│   │   ├── Button.test.tsx
│   │   └── TodoItem.test.tsx
│   ├── hooks/                            # 훅 테스트
│   │   ├── useTodo.test.ts
│   │   └── useAuth.test.ts
│   └── utils/                            # 유틸 테스트
│       ├── dateUtils.test.ts
│       └── validators.test.ts
│
├── .env.example                          # 환경변수 템플릿
├── .env                                  # 실제 환경변수 (.gitignore)
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── vite.config.ts                        # Vite 설정
├── tsconfig.json                         # TypeScript 설정
├── package.json
├── package-lock.json
└── README.md
```

---

## 요약

이 문서는 TodoListApp 프로젝트의 전체 구조 설계 원칙을 정의합니다. 핵심은:

1. **공통 원칙**: 관심사 분리, 단방향 의존성, 환경별 설정 분리, 비밀값 관리, 도메인 용어 일관성
2. **백엔드 5계층**: Router → Middleware(Joi) → Controller → Service → Repository (pg 라이브러리만 사용)
3. **프론트엔드 5계층**: Page → Component → Hook → (API Client / Store)
4. **명확한 네이밍**: 파일명, 변수명, 함수명, 상수 규칙
5. **철저한 테스트**: 통합 테스트 우선, 비즈니스 규칙 검증 필수
6. **보안/운영**: 환경변수 관리, JWT/bcrypt 설정, CORS, 로깅
7. **명확한 디렉토리**: 도메인별 분리, 계층 분리, 재사용성

이 원칙을 따르면 코드베이스는 유지보수가 용이하고, 확장 가능하며, 팀 협업이 원활해집니다.
