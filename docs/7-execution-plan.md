# TodoListApp 실행계획 (Execution Plan)

---

## 문서 정보

| 항목 | 내용 |
|------|------|
| 버전 | v1.0 |
| 작성일 | 2026-05-12 |
| 작성자 | HEOTAEHWAN |
| 참조 | PRD v1.2, 도메인 정의서 v1.2, ERD v1.0, 구조설계원칙 v1.1 |
| 개발 기간 | 3일 (MVP 기준) |

---

## 개요

본 문서는 TodoListApp MVP를 3일 내 완성하기 위한 데이터베이스·백엔드·프론트엔드 단위의 구체적 실행계획이다. 각 Task는 독립적으로 추적 가능하며, 완료 조건과 의존성을 체크박스로 관리한다.

### 전체 작업량 요약

| 영역 | Task 수 | 예상 총 소요시간 |
|------|---------|--------------|
| 데이터베이스 (DB) | 5개 | ~2.5시간 |
| 백엔드 (BE) | 7개 | ~19.5시간 |
| 프론트엔드 (FE) | 12개 | ~16시간 |
| **합계** | **24개** | **~38시간** |

---

## 일정 계획 (3일)

| 일차 | 주요 작업 | 목표 산출물 |
|------|----------|-----------|
| **Day 1** | DB 전체 + BE 초기설정·미들웨어·인증 | DB 연결, schema 적용, 인증 API 동작 |
| **Day 2** | BE 할일·카테고리·사용자 도메인 + FE 초기설정·기반 레이어 | REST API 전체 완성, FE 인증 화면 동작 |
| **Day 3** | FE 할일 목록·등록·수정·완료·삭제 화면 + 통합 테스트 | MVP 전체 기능 동작, 버그 수정 |

---

## 전체 의존성 맵

```
[DB 영역]
DB-01 (환경 설정)
  ├── DB-02 (테이블 생성)
  │     └── DB-03 (Seed 실행)
  └── DB-04 (Pool 모듈)
        └── DB-05 (연결 테스트) ← DB-02, DB-03 필요

[BE 영역]
BE-01 (초기 설정)
  └── BE-02 (공통 미들웨어)
        ├── BE-03 (인증 도메인)  ──────────────────┐
        ├── BE-05 (카테고리 도메인)                 ├── BE-07 (통합 테스트)
        └── BE-06 (사용자 도메인)                  │
              └── BE-04 (할일 도메인) ─────────────┘

[FE 영역]
FE-01 (초기 설정)
  └── FE-02 (타입 정의)
        ├── FE-03 (axios 클라이언트) ──┐
        ├── FE-04 (Zustand authStore) ─┼── FE-05 (API Client)
        └── FE-07 (공통 컴포넌트)      │         └── FE-06 (TanStack Query Hooks)
                    │                  │                    └── FE-08 (인증 화면)
                    │                  │                              └── FE-09 (라우팅)
                    └──────────────────┴─────────────────────────────── FE-10 (할일 목록)
                                                                               ├── FE-11 (등록·수정 모달)
                                                                               └── FE-12 (회원 탈퇴)

[영역 간 의존]
DB-04, DB-05 완료 → BE 전체 선행 조건
BE-03~06 완료 → FE API 연동 가능 (FE-05 이후)
```

---

## 데이터베이스 (DB) 실행계획

---

### DB-01 프로젝트 DB 환경 설정

**의존 Task**: 없음 | **예상 소요시간**: 30분

#### 세부 작업
- ☑ `.env.example` 작성 — `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_POOL_MAX`, `DB_POOL_IDLE_TIMEOUT_MS`, `DB_POOL_CONNECTION_TIMEOUT_MS`
- ☑ `.env` 파일 로컬 생성 (실제 개발용 값 채우기)
- ☑ `.gitignore`에 `.env`, `.env.local`, `.env.*.local` 등록 확인
- ☑ `src/config/database.js` 작성 — 환경변수 로드, 누락 시 명시적 에러 후 프로세스 종료
- ☑ 환경변수 유효성 검증 로직 (`DB_PORT` 숫자 여부, 필수값 존재 여부)

#### 완료 조건
- ☑ 필수 환경변수 누락 시 앱 기동 시 명확한 에러 메시지 출력 후 종료
- ☑ `.env` 파일이 `git status`에서 추적되지 않음
- ☑ `.env.example`이 플레이스홀더 값만 포함한 채 저장소에 존재

---

### DB-02 테이블 생성 실행

**의존 Task**: DB-01 | **예상 소요시간**: 20분

#### 세부 작업
- ☑ PostgreSQL 17 인스턴스 기동 확인 (로컬 또는 Docker)
- ☑ 대상 데이터베이스 생성 (`CREATE DATABASE todolist_dev;`)
- ☑ `database/schema.sql` 실행
- ☑ 테이블 3개(`users`, `categories`, `todos`) 존재 확인 (`\dt`)
- ☑ 인덱스 7개 생성 확인 (`\di`)
- ☑ `fk_todos_category`에 `ON DELETE` 미설정 확인 (BR-09 의도적 설계)
- ☑ `pgcrypto` 익스텐션 활성화 확인 (`SELECT gen_random_uuid();`)

#### 완료 조건
- ☑ `\dt` 결과에 `users`, `categories`, `todos` 3개 테이블 출력
- ☑ `\di` 결과에 설계된 인덱스 7개 존재
- ☑ `categories.user_id`에 ON DELETE CASCADE, `todos.category_id`에 ON DELETE 없음 확인

---

### DB-03 기본 카테고리 Seed 실행

**의존 Task**: DB-02 | **예상 소요시간**: 20분

#### 세부 작업
- ☑ `database/schema.sql` Seed INSERT 블록 실행 결과 확인
- ☑ `database/seed.sql` 분리 파일로 관리 여부 결정 (`ON CONFLICT DO NOTHING` 유지)
- ☑ `SELECT id, name, is_default, user_id FROM categories;` 로 3행 확인
- ☑ `'일반'` 카테고리 UUID를 `src/constants/constants.js`에 `DEFAULT_GENERAL_CATEGORY_ID` 상수 등록 (BR-09 이관 시 참조용)
- ☑ `is_default = true`, `user_id = NULL` 값 검증

#### 완료 조건
- ☑ `SELECT COUNT(*) FROM categories WHERE is_default = true;` 결과 `3`
- ☑ `'일반'`, `'업무'`, `'개인'` 각각 `user_id = NULL`, `is_default = true` 확인
- ☑ 동일 SQL 재실행 시 중복 오류 없이 3행 유지

---

### DB-04 pg Pool 모듈 작성

**의존 Task**: DB-01 | **예상 소요시간**: 45분

#### 세부 작업
- ☑ `src/db/pool.js` 생성 — `pg.Pool` 단일 인스턴스 생성 및 `module.exports`
- ☑ Pool 설정값 환경변수에서 주입: `host`, `port`, `database`, `user`, `password`, `max`, `idleTimeoutMillis`, `connectionTimeoutMillis`
- ☑ `pool.on('error', ...)` 핸들러 등록 — 유휴 클라이언트 에러 로깅
- ☑ 트랜잭션 헬퍼 `withTransaction(callback)` 구현 (`BEGIN` / `COMMIT` / `ROLLBACK` 패턴 — BR-09 카테고리 삭제 이관 트랜잭션 대비)
- ☑ CommonJS(`.js`, `require`) 방식으로 작성 (백엔드 언어 정책 준수)

#### 완료 조건
- ☑ `pool.js` require 시 pg Pool 인스턴스 반환
- ☑ `withTransaction` 콜백 내 오류 발생 시 자동 ROLLBACK
- ☑ DB 연결 설정이 하드코딩 없이 전부 `process.env.*`에서 읽힘

---

### DB-05 DB 연결 테스트 및 검증

**의존 Task**: DB-02, DB-03, DB-04 | **예상 소요시간**: 30분

#### 세부 작업
- ☑ `database/test-connection.js` 스크립트 작성 — `pool.query('SELECT NOW()')` 실행 후 성공/실패 출력
- ☑ 각 테이블 row count 조회 (`users 0건`, `categories 3건`, `todos 0건`)
- ☑ `gen_random_uuid()` 호출로 UUID 생성 기능 검증
- ☑ `withTransaction` 정상 동작 검증
- ☑ 잘못된 비밀번호로 연결 시 에러 핸들링 검증

#### 완료 조건
- ☑ `node database/test-connection.js` 실행 시 `DB 연결 성공` + 현재 서버 시각 출력
- ☑ `categories` 테이블 count 결과 `3`
- ☑ `withTransaction` ROLLBACK 시나리오에서 데이터 변경 없음

---

## 백엔드 (BE) 실행계획

---

### BE-01 프로젝트 초기 설정

**의존 Task**: 없음 | **예상 소요시간**: 1.5시간

#### 세부 작업
- ☑ `backend/` 디렉토리 생성 및 `npm init` 실행 (루트 디렉토리에서 진행)
- ☑ 의존성 설치: `express`, `pg`, `jsonwebtoken`, `bcrypt`, `joi`, `dotenv`, `cors`, `swagger-ui-express`
- ☑ 개발 의존성 설치: `jest`, `supertest`, `nodemon`
- ☑ 디렉토리 구조 생성: `src/routes/`, `src/controllers/`, `src/services/`, `src/repositories/`, `src/middlewares/`, `src/config/`, `src/db/`, `src/utils/`, `src/constants/`, `test/integration/`
- ☑ `.env.example` 작성: `DB_*`, `JWT_SECRET`(최소 32자), `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `NODE_ENV`, `CORS_ORIGIN`, `PORT`
- ☑ `src/app.js` 작성 — Express 앱 생성, `cors`, `express.json()`, 라우터 마운트, 에러 핸들러 등록
- ☑ `src/index.js` 작성 — 포트 바인딩, DB 연결 확인 후 시작
- ☑ `src/constants/constants.js` — `HTTP_STATUS`, `ERROR_CODES`, `TODO_CONSTANTS`, `CATEGORY_CONSTANTS` 정의

#### 완료 조건
- ☑ `node src/index.js` 실행 시 DB 연결 성공 메시지 출력
- ☑ 기본 카테고리 3개 `categories` 테이블 존재 (DB-03에서 seed 완료)
- ☑ 환경변수 누락 시 명확한 에러 메시지 후 프로세스 종료

---

### BE-02 공통 미들웨어

**의존 Task**: BE-01 | **예상 소요시간**: 2시간

#### 세부 작업
- ☑ `src/middlewares/auth.js` — `authenticate` 함수
  - ☑ `Authorization: Bearer <token>` 헤더 파싱
  - ☑ `jwt.verify()` 검증, `req.user = { id, email }` 주입
  - ☑ 토큰 없음·만료·위변조 → 401
- ☑ `src/middlewares/validate.js` — `validate(schema, target?)` 고차 함수
  - ☑ `schema.validate(req.body | req.query, { abortEarly: false })`
  - ☑ 실패 시 422 + 필드별 에러 상세 응답
- ☑ `src/middlewares/errorHandler.js` — 전역 에러 핸들러
  - ☑ 커스텀 `AppError` 클래스 (`statusCode`, `code`, `message`)
  - ☑ 401/403/404/409/422/500 표준 응답 형식
  - ☑ `production` 환경에서 스택 트레이스 미노출
- ☑ `src/utils/tokenUtils.js` — `generateToken(payload)`, `verifyToken(token)`
- ☑ `src/utils/passwordUtils.js` — `hashPassword(plain)`, `comparePassword(plain, hash)` (bcrypt)
- ☑ `src/utils/dateUtils.js` — `isDateTodayOrFuture(date)` (BR-07 검증용)

#### 완료 조건
- ☑ 유효 JWT 요청 시 `req.user` 정상 주입
- ☑ 만료·위변조 토큰 → 401
- ☑ Joi 실패 → 422 + 위반 필드명 포함
- ☑ 처리되지 않은 에러 → 500, production 환경 스택 미노출

---

### BE-03 인증 도메인 (Auth)

**의존 Task**: BE-01, BE-02 | **예상 소요시간**: 3시간

#### 세부 작업
- ☑ **Joi 스키마** (`src/middlewares/schemas/auth.schema.js`)
  - ☑ `registerSchema`: `email`(형식), `password`(8자+영문+숫자 DC-05), `name`(1~100자)
  - ☑ `loginSchema`: `email`, `password` 필수
- ☑ **Repository** (`src/repositories/userRepository.js`)
  - ☑ `findByEmail(email)`, `create({ email, password, name })`, `findById(id)`, `deleteById(id)`
- ☑ **Service** (`src/services/authService.js`)
  - ☑ `register`: 이메일 중복 확인(BR-02) → `hashPassword` → create → JWT 발급
  - ☑ `login`: `findByEmail` → `comparePassword` → JWT 발급
  - ☑ `logout`: Stateless, 클라이언트 토큰 파기 응답
- ☑ **Controller** (`src/controllers/authController.js`)
  - ☑ `register` → 201 + `{ accessToken, user }`, `login` → 200 + `{ accessToken, user }`, `logout` → 200
- ☑ **Router** (`src/routes/auth.routes.js`)
  - ☑ `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`

#### 완료 조건
- ☑ 중복 이메일 등록 → 409
- ☑ 비밀번호 정책 위반 → 422
- ☑ 로그인 성공 → `accessToken` 포함 200
- ☑ 잘못된 비밀번호 → 401 (이메일/패스워드 구분 없는 동일 메시지)

---

### BE-04 할일 도메인 (Todo)

**의존 Task**: BE-01, BE-02, BE-03 | **예상 소요시간**: 5시간

#### 세부 작업
- ☑ **Joi 스키마** (`src/middlewares/schemas/todo.schema.js`)
  - ☑ `createTodoSchema`: `title`(1~200자), `description`(선택), `dueDate`(선택, ISO date), `categoryId`(UUID, 필수 BR-05)
  - ☑ `updateTodoSchema`: 모든 필드 optional
  - ☑ `getTodosQuerySchema`: `categoryId`, `isCompleted`, `dueDateFrom`, `dueDateTo` (DC-08)
- ☑ **Repository** (`src/repositories/todoRepository.js`)
  - ☑ `create(todoData)`, `find({ userId, ...filters })` (동적 WHERE), `findById(id)`, `update(id, fields)`, `deleteById(id)`
- ☑ **Service** (`src/services/todoService.js`)
  - ☑ `createTodo`: BR-07 dueDate 검증, BR-04 categoryId 소유권 확인
  - ☑ `getTodos`: BR-03 `userId` 필터 항상 적용
  - ☑ `updateTodo`: BR-03 소유권 검증, 404 처리, BR-07 dueDate 검증
  - ☑ `completeTodo`: BR-03 소유권, BR-06 `completedAt` 자동 기록/초기화
  - ☑ `deleteTodo`: BR-03 소유권, 404 처리
- ☑ **Controller + Router** (`/api/todos`)
  - ☑ `GET`, `POST`, `PUT /:id`, `PATCH /:id/complete`, `DELETE /:id`
  - ☑ 모든 라우트에 `authenticate` 적용

#### 완료 조건
- ☑ 미인증 요청 → 401
- ☑ 타인 todo 수정·삭제 → 403
- ☑ 존재하지 않는 todo → 404
- ☑ `dueDate` 과거 날짜 → 422
- ☑ 완료 처리 → `completedAt` 자동 기록, 취소 → `null`
- ☑ `categoryId` 미포함 생성 → 422

---

### BE-05 카테고리 도메인 (Category)

**의존 Task**: BE-01, BE-02 | **예상 소요시간**: 2.5시간

#### 세부 작업
- ☑ **Joi 스키마**: `createCategorySchema` — `name`(1~50자)
- ☑ **Repository** (`src/repositories/categoryRepository.js`)
  - ☑ `findAllByUser(userId)`: 기본 카테고리(`user_id IS NULL`) + 사용자 카테고리(`user_id = $1`)
  - ☑ `findByNameAndUser(name, userId)`: `LOWER(name) = LOWER($1)` (BR-10)
  - ☑ `create({ userId, name })`, `findDefaultGeneralCategory()`
- ☑ **Service** (`src/services/categoryService.js`)
  - ☑ `getCategories(userId)`
  - ☑ `createCategory(userId, name)`: `name.trim()` (DC-04), BR-10 중복 → 409, create
  - ☑ `validateCategoryAccess(userId, categoryId)`: todoService에서 호출
- ☑ **Controller + Router** (`/api/categories`)
  - ☑ `GET /api/categories` (인증), `POST /api/categories` (인증, P1)

#### 완료 조건
- ☑ 카테고리 목록: 기본 3개 + 사용자 정의 카테고리 전체 반환
- ☑ 동일 이름(대소문자 무시) 중복 생성 → 409
- ☑ `name` 앞뒤 공백 포함 요청 → trim 후 저장

---

### BE-06 사용자 도메인 (User)

**의존 Task**: BE-01, BE-02, BE-03 | **예상 소요시간**: 1.5시간

#### 세부 작업
- ☑ **Service** (`src/services/userService.js`)
  - ☑ `getMe(userId)`: `findById` → 404 처리, `password` 제외 반환
  - ☑ `deleteMe(userId)`: `deleteById` → ON DELETE CASCADE로 todos·사용자 정의 categories 자동 삭제 (DC-01)
- ☑ **Controller** (`src/controllers/userController.js`)
  - ☑ `getMe` → 200 + `{ id, email, name, createdAt, updatedAt }`
  - ☑ `deleteMe` → 204 No Content
- ☑ **Router** (`src/routes/user.routes.js`)
  - ☑ `GET /api/users/me`, `DELETE /api/users/me`

#### 완료 조건
- ☑ `GET /api/users/me` 응답에 `password` 필드 미포함
- ☑ `DELETE /api/users/me` 후 todos·사용자 정의 categories 삭제 확인 (DB CASCADE)
- ☑ 미인증 요청 → 401

---

### BE-07 통합 테스트

**의존 Task**: BE-01~06 | **예상 소요시간**: 4시간

#### 세부 작업
- [V] `jest.config.js` 설정, `.env.test` 별도 테스트 DB 환경변수
- [V] `test/helpers/setup.js` — beforeAll: DB 연결·seed, afterAll: pool 종료·테스트 데이터 정리
- [V] **인증 테스트** (`test/integration/auth.test.js`)
  - [V] UC-01: 회원가입 성공 → 201 + `accessToken`
  - [V] UC-01: 중복 이메일 → 409, 비밀번호 정책 위반 → 422
  - [V] UC-02: 로그인 성공 → 200, 잘못된 비밀번호 → 401
  - [V] UC-03: 로그아웃 → 200
  - [V] BR-01: 토큰 없이 `/api/todos` → 401
- [V] **할일 테스트** (`test/integration/todo.test.js`)
  - [V] UC-05: 등록 성공 → 201, `categoryId` 누락 → 422, 과거 dueDate → 422
  - [V] UC-07: 카테고리·완료여부·기간 필터 조합 조회
  - [V] UC-06: 수정 성공, BR-03 타인 수정 → 403
  - [V] UC-08: 완료 처리 → `completedAt` 기록, 취소 → null
  - [V] UC-12: 삭제 → 204, BR-03 타인 삭제 → 403
- [V] **카테고리 테스트** (`test/integration/category.test.js`)
  - [V] 목록 — 기본 3개 포함, UC-09 생성 → 201, BR-10 중복 → 409
- [V] **사용자 테스트** (`test/integration/user.test.js`)
  - [V] `GET /api/users/me` 성공·`password` 미포함
  - [V] UC-13: `DELETE /api/users/me` → 204, todos CASCADE 삭제 확인

#### 완료 조건
- [V] `npm test` 전체 통과
- [V] BR-03 소유권 검증 전 케이스 통과
- [V] BR-06 completedAt 자동 처리 테스트 통과
- [V] DC-01 CASCADE 삭제 검증 통과
- [V] 테스트 후 DB 잔여 데이터 없음

---

## 프론트엔드 (FE) 실행계획

---

### FE-01 프로젝트 초기 설정

**의존 Task**: 없음 | **예상 소요시간**: 1시간

#### 세부 작업
- ☑ Vite + React 19 + TypeScript 프로젝트 생성
- ☑ 패키지 설치: `zustand`, `@tanstack/react-query@5`, `axios`, `react-router-dom`
- ☑ `.env`, `.env.example` 생성 (`VITE_API_URL` 정의)
- ☑ `tsconfig.json` 경로 별칭 설정 (`@/` → `src/`)
- ☑ 디렉토리 구조 생성: `src/pages/`, `src/components/Common|Todo|Category|User/`, `src/hooks/`, `src/api/`, `src/store/`, `src/types/`, `src/constants/`, `src/utils/`, `src/routes/`
- ☑ `main.tsx`: `QueryClientProvider`, `BrowserRouter`, `Suspense`, `ErrorBoundary` 루트 설정
- ☑ `.gitignore`에 `.env`, `.env.local` 추가

#### 완료 조건
- ☑ `npm run dev` 정상 실행
- ☑ TypeScript 컴파일 오류 없음
- ☑ TanStack Query DevTools 브라우저 확인 가능

---

### FE-02 공통 타입 정의

**의존 Task**: FE-01 | **예상 소요시간**: 0.5시간

#### 세부 작업
- ☑ `src/types/domain.ts` — `User`, `Todo`, `Category` 인터페이스 (백엔드 필드명 camelCase 일치)
- ☑ `src/types/api.ts` — `ApiResponse<T>`, `ApiError`, `TodoFilters`, `CreateTodoRequest`, `UpdateTodoRequest`, `LoginRequest`, `SignupRequest`, `CreateCategoryRequest`
- ☑ `src/constants/constants.ts` — `TODO_CONSTANTS.MAX_TITLE_LENGTH`, `CATEGORY_CONSTANTS.MAX_NAME_LENGTH`, `HTTP_STATUS`, `ERROR_CODES`

#### 완료 조건
- ☑ `Todo.categoryId` 필수 필드 포함 (BR-05)
- ☑ `Todo.dueDate` nullable 처리 (`string | undefined`)
- ☑ TypeScript strict 모드에서 오류 없음

---

### FE-03 axios 클라이언트 + 인터셉터

**의존 Task**: FE-01, FE-02 | **예상 소요시간**: 0.5시간

#### 세부 작업
- ☑ `src/api/axiosClient.ts` — axios 인스턴스 생성 (`baseURL: import.meta.env.VITE_API_URL`, `timeout: 10000`)
- ☑ 요청 인터셉터: `useAuthStore.getState().accessToken` 읽어 `Authorization: Bearer {token}` 자동 주입 (localStorage·Cookie 조회 금지)
- ☑ 응답 인터셉터: 401 → `clearAuth()` + `/login` 리다이렉트
- ☑ 응답 인터셉터: 공통 에러 형식(`ApiError`) 파싱 및 throw

#### 완료 조건
- ☑ 로그인 후 API 호출 시 Authorization 헤더 자동 포함 (Network 탭 확인)
- ☑ 401 수신 시 자동 로그아웃 동작
- ☑ 토큰을 localStorage에 저장하는 코드 없음

---

### FE-04 Zustand authStore 구현

**의존 Task**: FE-02 | **예상 소요시간**: 0.5시간

#### 세부 작업
- ☑ `src/store/authStore.ts` — `accessToken`, `user`, `isAuthenticated`, `setAuth(accessToken, user)`, `clearAuth()`
- ☑ `src/store/todoStore.ts` — `filters: TodoFilters`, `setFilter`, `resetFilters`
- ☑ `src/store/uiStore.ts` — `isModalOpen`, `modalType`, `selectedTodoId`, `toast` 상태

#### 완료 조건
- ☑ `setAuth` 호출 시 `isAuthenticated: true` 전환
- ☑ `clearAuth` 호출 시 `accessToken: null` 전환
- ☑ persist 미들웨어 미사용 (메모리 전용 저장)
- ☑ 탭 닫기 후 재방문 시 로그인 상태 유지되지 않음

---

### FE-05 API Client 레이어

**의존 Task**: FE-03, FE-04 | **예상 소요시간**: 1시간

#### 세부 작업
- ☑ `src/api/authAPI.ts` — `register`, `login`, `logout`
- ☑ `src/api/todoAPI.ts` — `getTodos(filters?)`, `createTodo`, `updateTodo`, `deleteTodo`, `toggleComplete`
- ☑ `src/api/categoryAPI.ts` — `getCategories`, `createCategory`
- ☑ `src/api/userAPI.ts` — `getMe`, `deleteMe`
- ☑ 모든 API 함수: `axiosClient` 사용, 헤더 직접 설정 금지
- ☑ 응답에서 `data.data` 추출 후 도메인 타입 반환

#### 완료 조건
- ☑ 각 API 함수 반환 타입이 `domain.ts` 인터페이스와 일치
- ☑ `todoAPI.toggleComplete` — `PATCH /api/todos/:id/complete` 호출 확인

---

### FE-06 TanStack Query Hooks

**의존 Task**: FE-04, FE-05 | **예상 소요시간**: 1.5시간

#### 세부 작업
- ☑ `src/hooks/useAuth.ts`
  - ☑ `useLogin()`: onSuccess → `setAuth` + navigate `/todos`
  - ☑ `useSignup()`: onSuccess → navigate `/login`
  - ☑ `useLogout()`: onSuccess → `clearAuth` + navigate `/login`
- ☑ `src/hooks/useTodo.ts`
  - ☑ `useGetTodos()`: queryKey `['todos', filters]`, staleTime 5분
  - ☑ `useCreateTodo()`, `useUpdateTodo()`, `useDeleteTodo()`, `useToggleComplete()`: onSuccess → `invalidateQueries(['todos'])`
- ☑ `src/hooks/useCategory.ts`
  - ☑ `useGetCategories()`: queryKey `['categories']`, staleTime 10분
  - ☑ `useCreateCategory()`: onSuccess → `invalidateQueries(['categories'])`
- ☑ `src/hooks/useUser.ts`
  - ☑ `useDeleteAccount()`: onSuccess → `clearAuth` + navigate `/login`

#### 완료 조건
- ☑ `useGetTodos` filters 변경 시 자동 재조회
- ☑ CRUD mutation 성공 시 목록 자동 갱신
- ☑ 401 에러 시 재시도 없이 로그아웃 처리 (`retry: false`)

---

### FE-07 공통 컴포넌트

**의존 Task**: FE-01, FE-02 | **예상 소요시간**: 2시간

#### 세부 작업
- ☑ `Button.tsx` — variant(`primary`/`secondary`/`danger`), size, loading, disabled
- ☑ `Input.tsx` — label, error 메시지, ref 포워딩 (`react-hook-form` 연동 가능)
- ☑ `Modal.tsx` — isOpen, onClose, ESC 닫기, 배경 클릭 닫기, `createPortal`
- ☑ `Toast.tsx` — type, message, duration(기본 3초), 자동 소멸, uiStore 연결
- ☑ `Spinner.tsx` — 크기 variant
- ☑ `Checkbox.tsx` — checked, onChange, label
- ☑ `Dropdown.tsx` — `{value, label}[]` options, value, onChange, placeholder
- ☑ 모든 컴포넌트: 터치 타겟 최소 44px (Mobile-first)

#### 완료 조건
- ☑ 각 컴포넌트 Props 타입 정의 완료
- ☑ Modal 열림 시 body 스크롤 잠금
- ☑ Toast uiStore 연결, 전역 호출 가능

---

### FE-08 인증 화면 (로그인·회원가입)

**의존 Task**: FE-06, FE-07 | **예상 소요시간**: 2시간

#### 세부 작업
- ☑ `src/pages/auth/LoginPage.tsx`
  - ☑ 이메일·비밀번호 폼, 회원가입 링크
  - ☑ 클라이언트 유효성: 이메일 형식, 비밀번호 필수
  - ☑ `useLogin()` 호출, 로딩 중 disabled + Spinner
  - ☑ 401 → "이메일 또는 비밀번호가 올바르지 않습니다." Toast
- ☑ `src/pages/auth/SignupPage.tsx`
  - ☑ 이름·이메일·비밀번호·비밀번호 확인 폼
  - ☑ 유효성: 비밀번호 8자+영문+숫자(DC-05), 비밀번호 확인 일치
  - ☑ `useSignup()` 호출
  - ☑ 409 → "이미 사용 중인 이메일입니다." Toast
- ☑ 두 화면: `isAuthenticated` 시 `/todos` 자동 리다이렉트 (GuestRoute에서 처리)
- ☐ Mobile-first: 중앙 카드, 최대 너비 400px

#### 완료 조건
- ☑ 로그인 성공 → `/todos` + authStore 토큰·사용자 저장
- ☑ 회원가입 성공 → `/login`
- ☑ 클라이언트 유효성 오류 폼에 표시
- ☑ API 에러 Toast 표시

---

### FE-09 라우팅 설정 (인증 보호 라우트)

**의존 Task**: FE-04, FE-08 | **예상 소요시간**: 0.5시간

#### 세부 작업
- ☑ `src/routes/ProtectedRoute.tsx` — `isAuthenticated === false` → `/login` 리다이렉트
- ☑ `src/routes/GuestRoute.tsx` — `isAuthenticated === true` → `/todos` 리다이렉트
- ☑ `src/App.tsx` 라우트 구성:
  - `/login` → GuestRoute → LoginPage
  - `/signup` → GuestRoute → SignupPage
  - `/todos` → ProtectedRoute → TodoListPage
  - `/` → `/todos` 리다이렉트
  - `*` → `/login` 리다이렉트

#### 완료 조건
- ☑ 비인증 상태에서 `/todos` 직접 접근 시 `/login` 이동
- ☑ 인증 상태에서 `/login` 접근 시 `/todos` 이동
- ☑ 로그아웃 후 뒤로가기 시 `/todos` 재접근 차단

---

### FE-10 할일 목록 화면

**의존 Task**: FE-06, FE-07, FE-09 | **예상 소요시간**: 3시간

#### 세부 작업
- ☑ `src/pages/todo/TodoListPage.tsx` — 헤더 + 필터 바 + 목록 + 등록 버튼 조합
- ☑ `src/components/Todo/TodoFilters.tsx`
  - ☑ 카테고리 Dropdown (`useGetCategories()` 목록)
  - ☑ 완료여부 Dropdown (`전체`/`미완료`/`완료`)
  - ☑ dueDate 기간 필터 (시작일·종료일, DC-08)
  - ☑ 필터 초기화 버튼
  - ☑ startDate > endDate 오류 표시
- ☑ `src/components/Todo/TodoList.tsx` — 목록 렌더링, isLoading → Spinner, 빈 상태 메시지
- ☑ `src/components/Todo/TodoItem.tsx`
  - ☑ Checkbox 완료 토글 (`useToggleComplete`, UC-08)
  - ☑ 제목, 카테고리 뱃지, dueDate 표시
  - ☑ 삭제: 확인 Modal → `useDeleteTodo` (UC-12)
  - ☑ 수정: uiStore `selectedTodoId` 설정 → 모달 열기
- ☑ 헤더: 사용자 이름, 로그아웃 버튼(UC-03), 회원 탈퇴 링크
- ☐ Mobile(375px) / Tablet(768px) / Desktop(1024px) 레이아웃

#### 완료 조건
- ☑ 필터 조합 변경 시 목록 즉시 갱신
- ☑ 완료 토글 후 목록 자동 갱신
- ☑ 삭제 확인 Modal 표시 후 삭제 실행
- ☐ 3개 브레이크포인트 레이아웃 정상 표시

---

### FE-11 할일 등록·수정 모달

**의존 Task**: FE-06, FE-07, FE-10 | **예상 소요시간**: 2.5시간

#### 세부 작업
- ☑ `src/components/Todo/TodoFormModal.tsx` — 등록/수정 모드 분기 (`selectedTodoId` 유무)
- ☑ 폼 필드: 제목(필수, max 200), 설명(선택), dueDate(오늘 이후 BR-07), 카테고리 Dropdown(필수 BR-05)
- ☑ 클라이언트 유효성:
  - ☑ 제목 빈값·200자 초과 → 오류 표시 (DC-03)
  - ☑ dueDate 과거 날짜 → 오류 표시 (BR-07)
  - ☑ 카테고리 미선택 → 오류 표시
- ☑ 등록 모드: `useCreateTodo()` → 성공 시 모달 닫기 + 성공 Toast
- ☑ 수정 모드: 기존 데이터 프리필, `useUpdateTodo()` → 성공 시 모달 닫기 + 성공 Toast
- ☑ 모달 닫기 시 uiStore `selectedTodoId` 초기화
- ☑ UC-09(P1): 카테고리 Dropdown 하단 "새 카테고리 추가" (`useCreateCategory()`)

#### 완료 조건
- ☑ 등록 성공 후 목록에 즉시 반영
- ☑ 수정 모달 열 때 기존 데이터 정확히 프리필
- ☑ dueDate DatePicker에서 오늘 이전 날짜 선택 불가
- ☑ API 에러 Toast 표시

---

### FE-12 회원 탈퇴

**의존 Task**: FE-06, FE-07, FE-09, FE-10 | **예상 소요시간**: 0.5시간

#### 세부 작업
- ☑ 할일 목록 화면 헤더에 "회원 탈퇴" 버튼 배치
- ☑ 클릭 시 확인 Modal: "탈퇴하면 모든 데이터가 즉시 삭제되며 복구할 수 없습니다. 탈퇴하시겠습니까?"
- ☑ `useDeleteAccount()` 호출 → 성공 시 `clearAuth()` + `/login` 이동
- ☑ 처리 중 로딩 상태 표시
- ☑ 실패 시 에러 Toast 표시

#### 완료 조건
- ☑ 탈퇴 후 `/login` 이동 + authStore 초기화 확인
- ☑ 탈퇴 후 뒤로가기 시 `/todos` 접근 차단
- ☑ 확인 Modal 없이 즉시 탈퇴 불가

---

## Task 전체 목록 및 소요시간

| Task ID | 이름 | 소요시간 | 의존 |
|---------|------|---------|------|
| DB-01 | DB 환경 설정 | 30분 | — |
| DB-02 | 테이블 생성 | 20분 | DB-01 |
| DB-03 | Seed 실행 | 20분 | DB-02 |
| DB-04 | Pool 모듈 작성 | 45분 | DB-01 |
| DB-05 | 연결 테스트 | 30분 | DB-02, DB-03, DB-04 |
| BE-01 | 프로젝트 초기 설정 | 1.5h | — |
| BE-02 | 공통 미들웨어 | 2h | BE-01 |
| BE-03 | 인증 도메인 | 3h | BE-01, BE-02 |
| BE-04 | 할일 도메인 | 5h | BE-01, BE-02, BE-03 |
| BE-05 | 카테고리 도메인 | 2.5h | BE-01, BE-02 |
| BE-06 | 사용자 도메인 | 1.5h | BE-01, BE-02, BE-03 |
| BE-07 | 통합 테스트 | 4h | BE-01~06 |
| FE-01 | 프로젝트 초기 설정 | 1h | — |
| FE-02 | 공통 타입 정의 | 0.5h | FE-01 |
| FE-03 | axios 클라이언트 | 0.5h | FE-01, FE-02 |
| FE-04 | Zustand authStore | 0.5h | FE-02 |
| FE-05 | API Client 레이어 | 1h | FE-03, FE-04 |
| FE-06 | TanStack Query Hooks | 1.5h | FE-04, FE-05 |
| FE-07 | 공통 컴포넌트 | 2h | FE-01, FE-02 |
| FE-08 | 인증 화면 | 2h | FE-06, FE-07 |
| FE-09 | 라우팅 설정 | 0.5h | FE-04, FE-08 |
| FE-10 | 할일 목록 화면 | 3h | FE-06, FE-07, FE-09 |
| FE-11 | 할일 등록·수정 모달 | 2.5h | FE-06, FE-07, FE-10 |
| FE-12 | 회원 탈퇴 | 0.5h | FE-06, FE-07, FE-09, FE-10 |

---

## Day별 권장 실행 순서

### Day 1 — DB + BE 기반 (목표: 인증 API 동작)
```
오전: DB-01 → DB-02 → DB-03 → DB-04 → DB-05
오전: BE-01 (DB와 병행 가능)
오후: BE-02 → BE-03
     FE-01, FE-02 (BE와 병행)
```

### Day 2 — BE 도메인 완성 + FE 기반 (목표: API 전체 완성, FE 인증 화면 동작)
```
오전: BE-04 + BE-05 (병행)
오후: BE-06 → BE-07(일부)
     FE-03, FE-04 → FE-05 → FE-06, FE-07 (병행) → FE-08 → FE-09
```

### Day 3 — FE 화면 완성 + 통합 (목표: MVP 전체 기능 동작)
```
오전: FE-10 → FE-11
오후: FE-12 + BE-07 마무리
     통합 테스트, 버그 수정
     UC-09(P1) 여유 시 구현
```

---

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v1.0 | 2026-05-12 | 최초 작성 |
| v1.1 | 2026-05-14 | BE-01 디렉토리 구조에서 미생성된 `src/auth/strategies/` 제거, 의존성에 `swagger-ui-express` 추가 반영 |

*최종 수정일: 2026-05-14 | 버전: v1.1 | 참조: PRD v1.2, 도메인 정의서 v1.2, ERD v1.1*
