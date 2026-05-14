# TodoListApp 프론트엔드 통합 가이드

---

## 문서 정보

| 항목 | 내용 |
|------|------|
| 버전 | v1.0 |
| 작성일 | 2026-05-14 |
| 작성자 | HEOTAEHWAN |
| 대상 | 프론트엔드 개발자 |
| 참조 | swagger/swagger.json, 실제 구현 코드 기준 |

---

## 목차

1. [기본 설정](#1-기본-설정)
2. [인증 흐름](#2-인증-흐름)
3. [공통 규격](#3-공통-규격)
4. [API 엔드포인트 상세](#4-api-엔드포인트-상세)
5. [유효성 검사 규칙](#5-유효성-검사-규칙)
6. [에러 처리](#6-에러-처리)
7. [TypeScript 타입 정의](#7-typescript-타입-정의)
8. [axios 클라이언트 예시](#8-axios-클라이언트-예시)

---

## 1. 기본 설정

### 서버 주소

| 환경 | Base URL |
|------|---------|
| 로컬 개발 | `http://localhost:3000` |
| Swagger UI | `http://localhost:3000/api-docs` |
| Health Check | `http://localhost:3000/health` |

### Content-Type

모든 요청은 `Content-Type: application/json` 헤더를 포함해야 합니다.

### 인증이 필요한 엔드포인트

`/api/auth/register`, `/api/auth/login`을 제외한 **모든 API**는 JWT Bearer 토큰 인증이 필수입니다.

```
Authorization: Bearer {accessToken}
```

---

## 2. 인증 흐름

### 2.1 토큰 발급 및 저장

로그인 또는 회원가입 성공 시 `accessToken`이 응답에 포함됩니다.  
토큰은 **Zustand 메모리(authStore)에만 저장**합니다. `localStorage`, `sessionStorage`, `httpOnly Cookie` 사용 금지.  
탭 또는 브라우저를 닫으면 토큰이 소멸되어 재로그인이 필요합니다.

```
회원가입 / 로그인
      │
      ▼
  accessToken 발급 (유효기간 1시간)
      │
      ▼
  Zustand authStore에 저장
      │
      ▼
  모든 API 요청마다 Authorization: Bearer {accessToken} 헤더 자동 주입
      │
      ├─ 토큰 만료 → 401 → clearAuth() → /login 리다이렉트
      └─ 로그아웃 → clearAuth() → /login 리다이렉트
```

### 2.2 토큰 갱신

현재 Refresh Token 미지원. 토큰 만료(1시간) 시 재로그인 필요.  
`401 UNAUTHORIZED` 응답 수신 시 즉시 로그아웃 처리 후 로그인 페이지로 이동합니다.

---

## 3. 공통 규격

### 3.1 성공 응답 형식

| 엔드포인트 유형 | HTTP 상태 | 응답 본문 |
|--------------|---------|---------|
| 단건 조회 / 생성 / 수정 | 200, 201 | 해당 도메인 객체 직접 반환 |
| 목록 조회 | 200 | `{ data: [...], pagination: {...} }` |
| 삭제 / 로그아웃 | 204, 200 | 없음 또는 `{ message: "..." }` |

### 3.2 에러 응답 형식

모든 에러 응답은 아래 구조를 따릅니다.

```json
{
  "error": {
    "code": "에러 코드",
    "message": "사람이 읽을 수 있는 메시지",
    "fields": [
      { "field": "fieldName", "message": "해당 필드 에러 메시지" }
    ]
  }
}
```

`fields` 배열은 **422 유효성 검사 실패 시에만** 포함됩니다.

### 3.3 에러 코드표

| HTTP 상태 | code | 발생 상황 |
|---------|------|---------|
| 401 | `UNAUTHORIZED` | 토큰 없음, 만료, 위변조 |
| 403 | `FORBIDDEN` | 타인 리소스 접근 시도 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `CONFLICT` | 이메일 중복 가입, 카테고리명 중복 |
| 422 | `VALIDATION_ERROR` | 요청 본문/쿼리 유효성 실패 |
| 500 | `INTERNAL_ERROR` | 예상치 못한 서버 오류 |

### 3.4 페이지네이션

할일 목록 조회 응답에 포함됩니다.

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

## 4. API 엔드포인트 상세

### 4.1 인증 (Auth)

#### POST /api/auth/register — 회원가입

**인증 불필요**

**요청 본문**

```json
{
  "email": "kim@example.com",
  "password": "Password123",
  "name": "김철수"
}
```

**성공 응답 201**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "51a642a2-7e16-40e7-a59a-85739c43ac14",
    "email": "kim@example.com",
    "name": "김철수",
    "createdAt": "2026-05-14T01:04:02.422Z",
    "updatedAt": "2026-05-14T01:04:02.422Z"
  }
}
```

**에러 응답**

| 상태 | code | 조건 |
|------|------|------|
| 409 | `CONFLICT` | 이미 가입된 이메일 |
| 422 | `VALIDATION_ERROR` | 비밀번호 정책 위반 (8자 미만, 숫자/영문 미포함), 이메일 형식 오류 |

---

#### POST /api/auth/login — 로그인

**인증 불필요**

**요청 본문**

```json
{
  "email": "kim@example.com",
  "password": "Password123"
}
```

**성공 응답 200**

회원가입과 동일한 `{ accessToken, user }` 구조

**에러 응답**

| 상태 | code | 조건 |
|------|------|------|
| 401 | `UNAUTHORIZED` | 이메일 미존재 또는 비밀번호 불일치 (보안상 동일 메시지) |
| 422 | `VALIDATION_ERROR` | 이메일 형식 오류, 비밀번호 미입력 |

---

#### POST /api/auth/logout — 로그아웃

**인증 필요**  
요청 본문 없음.

**성공 응답 200**

```json
{ "message": "로그아웃되었습니다." }
```

> 서버는 Stateless이므로 실제 토큰 무효화는 없습니다. 클라이언트에서 `clearAuth()`를 호출하여 토큰을 삭제해야 합니다.

---

### 4.2 할일 (Todo)

> 모든 할일 API는 인증 필수. 로그인한 사용자 본인의 할일만 조회/수정/삭제 가능.

#### GET /api/todos — 할일 목록 조회

**쿼리 파라미터** (모두 선택)

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|-------|------|
| `categoryId` | UUID string | — | 카테고리 ID로 필터링 |
| `isCompleted` | boolean | — | `true`: 완료만, `false`: 미완료만, 생략: 전체 |
| `dueDateFrom` | YYYY-MM-DD | — | 종료예정일 시작 범위 (해당일 포함) |
| `dueDateTo` | YYYY-MM-DD | — | 종료예정일 종료 범위 (해당일 포함) |
| `page` | integer ≥ 1 | `1` | 페이지 번호 |
| `size` | integer 1~100 | `20` | 페이지당 항목 수 |

> 필터는 모두 AND 조건으로 조합됩니다.  
> `dueDateFrom > dueDateTo` 이면 422 에러.

**성공 응답 200**

```json
{
  "data": [
    {
      "id": "92eda693-fd23-4253-b789-afd999be1067",
      "userId": "51a642a2-7e16-40e7-a59a-85739c43ac14",
      "categoryId": "1f84f69c-303a-4c38-aa5d-fdf523f6ba04",
      "title": "프로젝트 기획서 작성",
      "description": "Q2 마케팅 프로젝트 기획서",
      "dueDate": "2026-05-30",
      "isCompleted": false,
      "completedAt": null,
      "createdAt": "2026-05-14T01:04:19.021Z",
      "updatedAt": "2026-05-14T01:04:19.021Z",
      "category": {
        "id": "1f84f69c-303a-4c38-aa5d-fdf523f6ba04",
        "name": "업무",
        "isDefault": true
      }
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

> `data` 정렬 기준: `createdAt DESC` (최신 등록 순)

---

#### POST /api/todos — 할일 등록

**요청 본문**

```json
{
  "title": "프로젝트 기획서 작성",
  "description": "Q2 마케팅 프로젝트 기획서",
  "dueDate": "2026-05-30",
  "categoryId": "1f84f69c-303a-4c38-aa5d-fdf523f6ba04"
}
```

| 필드 | 필수 | 타입 | 제약 |
|------|------|------|------|
| `title` | ✅ | string | 1~200자 |
| `description` | ❌ | string \| null | 제한 없음 |
| `dueDate` | ❌ | YYYY-MM-DD \| null | **오늘 이후(당일 포함)** |
| `categoryId` | ✅ | UUID string | 기본 카테고리 또는 본인 소유 카테고리 |

**성공 응답 201** — 생성된 Todo 객체 (목록 조회의 단건 형태와 동일)

**에러 응답**

| 상태 | code | 조건 |
|------|------|------|
| 404 | `NOT_FOUND` | 존재하지 않거나 접근 불가한 categoryId |
| 422 | `VALIDATION_ERROR` | title 누락, dueDate 과거 날짜, categoryId 형식 오류 |

---

#### PUT /api/todos/:id — 할일 수정

**요청 본문** (수정할 필드만 포함)

```json
{
  "title": "수정된 제목",
  "description": "수정된 설명",
  "dueDate": "2026-06-01",
  "categoryId": "1f84f69c-303a-4c38-aa5d-fdf523f6ba04"
}
```

모든 필드 선택. 포함하지 않은 필드는 변경되지 않습니다.

**성공 응답 200** — 수정된 Todo 객체

**에러 응답**

| 상태 | code | 조건 |
|------|------|------|
| 403 | `FORBIDDEN` | 타인의 할일 수정 시도 |
| 404 | `NOT_FOUND` | 존재하지 않는 할일 ID |
| 422 | `VALIDATION_ERROR` | dueDate 과거 날짜, title 길이 초과 |

---

#### PATCH /api/todos/:id/complete — 완료 상태 토글

요청 본문 없음.

**동작 방식**

| 현재 상태 | 토글 후 |
|---------|---------|
| `isCompleted: false` | `isCompleted: true`, `completedAt: 현재 시각` |
| `isCompleted: true` | `isCompleted: false`, `completedAt: null` |

**성공 응답 200** — 변경된 Todo 객체

**에러 응답**

| 상태 | code | 조건 |
|------|------|------|
| 403 | `FORBIDDEN` | 타인의 할일 |
| 404 | `NOT_FOUND` | 존재하지 않는 할일 ID |

---

#### DELETE /api/todos/:id — 할일 삭제

요청 본문 없음. 성공 응답 **204** (본문 없음).

**에러 응답**

| 상태 | code | 조건 |
|------|------|------|
| 403 | `FORBIDDEN` | 타인의 할일 |
| 404 | `NOT_FOUND` | 존재하지 않는 할일 ID |

---

### 4.3 카테고리 (Category)

> 모든 카테고리 API는 인증 필수.

#### GET /api/categories — 카테고리 목록 조회

쿼리 파라미터 없음.

**성공 응답 200**

```json
{
  "data": [
    {
      "id": "655ebc61-df02-4b89-a969-ccbaae0cc669",
      "userId": null,
      "name": "일반",
      "isDefault": true,
      "createdAt": "2026-05-13T05:55:34.622Z"
    },
    {
      "id": "1f84f69c-303a-4c38-aa5d-fdf523f6ba04",
      "userId": null,
      "name": "업무",
      "isDefault": true,
      "createdAt": "2026-05-13T05:55:34.622Z"
    },
    {
      "id": "5110d664-5c26-4d05-82b4-803670aad8d5",
      "userId": null,
      "name": "개인",
      "isDefault": true,
      "createdAt": "2026-05-13T05:55:34.622Z"
    },
    {
      "id": "b3b82b6a-f061-4a3d-aa1b-973ee3df849b",
      "userId": "51a642a2-7e16-40e7-a59a-85739c43ac14",
      "name": "캠페인 관리",
      "isDefault": false,
      "createdAt": "2026-05-14T01:04:43.613Z"
    }
  ]
}
```

> 정렬: 기본 카테고리(`isDefault: true`) 먼저, 이후 사용자 정의 카테고리를 `createdAt ASC` 순으로 반환.  
> `userId: null` → 기본 카테고리 (수정·삭제 불가).

---

#### POST /api/categories — 사용자 정의 카테고리 생성

**요청 본문**

```json
{ "name": "캠페인 관리" }
```

| 필드 | 필수 | 제약 |
|------|------|------|
| `name` | ✅ | 1~50자, 앞뒤 공백 자동 trim 후 저장 |

**성공 응답 201**

```json
{
  "id": "b3b82b6a-f061-4a3d-aa1b-973ee3df849b",
  "userId": "51a642a2-7e16-40e7-a59a-85739c43ac14",
  "name": "캠페인 관리",
  "isDefault": false,
  "createdAt": "2026-05-14T01:04:43.613Z"
}
```

**에러 응답**

| 상태 | code | 조건 |
|------|------|------|
| 409 | `CONFLICT` | 동일 사용자 내 이름 중복 (대소문자 무시, 공백 trim 후 비교), 기본 카테고리 이름과 중복 포함 |
| 422 | `VALIDATION_ERROR` | name 미입력, 50자 초과 |

---

### 4.4 사용자 (User)

#### GET /api/users/me — 내 정보 조회

요청 본문 없음.

**성공 응답 200**

```json
{
  "id": "51a642a2-7e16-40e7-a59a-85739c43ac14",
  "email": "kim@example.com",
  "name": "김철수",
  "createdAt": "2026-05-14T01:04:02.422Z",
  "updatedAt": "2026-05-14T01:04:02.422Z"
}
```

> `password` 필드는 절대 응답에 포함되지 않습니다.

---

#### DELETE /api/users/me — 회원 탈퇴

요청 본문 없음. 성공 응답 **204** (본문 없음).

> DB `ON DELETE CASCADE` 처리로 사용자의 모든 할일과 사용자 정의 카테고리가 즉시 삭제됩니다.  
> 탈퇴 완료 후 클라이언트는 반드시 `clearAuth()`를 호출하여 저장된 토큰을 삭제해야 합니다.

---

## 5. 유효성 검사 규칙

서버에서 강제하는 규칙을 클라이언트에서도 사전 검증하면 불필요한 API 호출을 줄일 수 있습니다.

### 5.1 회원가입 (registerSchema)

| 필드 | 규칙 |
|------|------|
| `email` | 이메일 형식 필수 |
| `password` | 최소 8자, 영문(a-zA-Z) 1자 이상, 숫자(0-9) 1자 이상 모두 포함 |
| `name` | 1~100자 |

### 5.2 할일 생성 (createTodoSchema)

| 필드 | 규칙 |
|------|------|
| `title` | 1~200자 (필수) |
| `description` | 빈 문자열, null 허용 (선택) |
| `dueDate` | ISO 8601 날짜 형식 `YYYY-MM-DD`, null 허용 (선택), **오늘 이후(당일 포함)** — 서버 비즈니스 규칙 |
| `categoryId` | UUID 형식 (필수) |

### 5.3 할일 수정 (updateTodoSchema)

모든 필드 선택. 포함된 필드는 createTodoSchema와 동일한 규칙 적용.

### 5.4 할일 목록 조회 (getTodosQuerySchema)

| 파라미터 | 규칙 |
|---------|------|
| `categoryId` | UUID 형식 |
| `isCompleted` | `true` / `false` (boolean 변환 자동 처리) |
| `dueDateFrom`, `dueDateTo` | ISO 8601 날짜 형식 |
| `dueDateFrom` > `dueDateTo` | 422 에러 |
| `page` | 정수 ≥ 1, 기본값 1 |
| `size` | 정수 1~100, 기본값 20 |

### 5.5 카테고리 생성 (createCategorySchema)

| 필드 | 규칙 |
|------|------|
| `name` | 1~50자 (필수), 앞뒤 공백 trim 후 중복 검사 |

---

## 6. 에러 처리

### 6.1 axios 응답 인터셉터 권장 패턴

```typescript
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const apiError = error.response?.data?.error;

    // 401: 토큰 만료 또는 미인증 → 즉시 로그아웃
    if (status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 그 외 에러는 호출 측에서 처리
    return Promise.reject({
      status,
      code: apiError?.code,
      message: apiError?.message,
      fields: apiError?.fields ?? [],
    });
  }
);
```

### 6.2 422 유효성 에러 fields 처리 예시

```typescript
try {
  await createTodo(data);
} catch (error) {
  if (error.status === 422 && error.fields?.length > 0) {
    // 필드별 에러 메시지를 폼에 표시
    error.fields.forEach(({ field, message }) => {
      setFieldError(field, message);
    });
  }
}
```

### 6.3 409 중복 에러 처리 예시

```typescript
try {
  await register(data);
} catch (error) {
  if (error.status === 409) {
    // error.message: "이미 사용 중인 이메일입니다."
    showToast(error.message, 'error');
  }
}
```

---

## 7. TypeScript 타입 정의

실제 API 응답 필드를 기준으로 작성된 타입입니다.

```typescript
// src/types/domain.ts

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;  // ISO 8601
  updatedAt: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface Category {
  id: string;
  userId: string | null;  // null: 기본 카테고리
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Todo {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string | null;
  dueDate: string | null;      // YYYY-MM-DD
  isCompleted: boolean;
  completedAt: string | null;  // ISO 8601
  createdAt: string;
  updatedAt: string;
  category: CategorySummary;
}

export interface Pagination {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface TodoListResponse {
  data: Todo[];
  pagination: Pagination;
}

export interface CategoryListResponse {
  data: Category[];
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// 요청 타입
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  categoryId: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  categoryId?: string;
}

export interface TodoFilters {
  categoryId?: string;
  isCompleted?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
  page?: number;
  size?: number;
}

export interface CreateCategoryRequest {
  name: string;
}

// 에러 타입
export interface ApiErrorField {
  field: string;
  message: string;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  fields: ApiErrorField[];
}
```

---

## 8. axios 클라이언트 예시

### 8.1 axiosClient 설정

```typescript
// src/api/axiosClient.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터: 토큰 자동 주입 (Zustand 메모리에서만 읽음)
axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 자동 로그아웃
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    const apiError = error.response?.data?.error;
    return Promise.reject({
      status: error.response?.status,
      code: apiError?.code,
      message: apiError?.message,
      fields: apiError?.fields ?? [],
    });
  }
);

export default axiosClient;
```

### 8.2 authAPI

```typescript
// src/api/authAPI.ts
import axiosClient from './axiosClient';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/domain';

export const authAPI = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await axiosClient.post('/api/auth/register', data);
    return res.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await axiosClient.post('/api/auth/login', data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await axiosClient.post('/api/auth/logout');
  },
};
```

### 8.3 todoAPI

```typescript
// src/api/todoAPI.ts
import axiosClient from './axiosClient';
import {
  Todo,
  TodoListResponse,
  TodoFilters,
  CreateTodoRequest,
  UpdateTodoRequest,
} from '../types/domain';

export const todoAPI = {
  getTodos: async (filters?: TodoFilters): Promise<TodoListResponse> => {
    const res = await axiosClient.get('/api/todos', { params: filters });
    return res.data;
  },

  createTodo: async (data: CreateTodoRequest): Promise<Todo> => {
    const res = await axiosClient.post('/api/todos', data);
    return res.data;
  },

  updateTodo: async (id: string, data: UpdateTodoRequest): Promise<Todo> => {
    const res = await axiosClient.put(`/api/todos/${id}`, data);
    return res.data;
  },

  toggleComplete: async (id: string): Promise<Todo> => {
    const res = await axiosClient.patch(`/api/todos/${id}/complete`);
    return res.data;
  },

  deleteTodo: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/todos/${id}`);
  },
};
```

### 8.4 categoryAPI

```typescript
// src/api/categoryAPI.ts
import axiosClient from './axiosClient';
import { Category, CategoryListResponse, CreateCategoryRequest } from '../types/domain';

export const categoryAPI = {
  getCategories: async (): Promise<CategoryListResponse> => {
    const res = await axiosClient.get('/api/categories');
    return res.data;
  },

  createCategory: async (data: CreateCategoryRequest): Promise<Category> => {
    const res = await axiosClient.post('/api/categories', data);
    return res.data;
  },
};
```

### 8.5 userAPI

```typescript
// src/api/userAPI.ts
import axiosClient from './axiosClient';
import { User } from '../types/domain';

export const userAPI = {
  getMe: async (): Promise<User> => {
    const res = await axiosClient.get('/api/users/me');
    return res.data;
  },

  deleteMe: async (): Promise<void> => {
    await axiosClient.delete('/api/users/me');
  },
};
```

---

## 참고 문서

- [Swagger UI](http://localhost:3000/api-docs) — 브라우저에서 직접 API 실행 가능
- [swagger/swagger.json](../swagger/swagger.json) — OpenAPI 3.0.3 스펙
- [ERD](./6-erd.md)
- [사용자 시나리오](./3-user-scenario.md)
- [아키텍처 다이어그램](./5-arch-diagram.md)

---

*작성일: 2026-05-14 | 버전: v1.0*
