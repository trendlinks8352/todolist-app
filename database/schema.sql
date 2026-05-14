-- ============================================================
-- TodoListApp Database Schema
-- ============================================================
-- Database  : PostgreSQL 17
-- Encoding  : UTF-8
-- Timezone  : UTC (TIMESTAMPTZ 사용)
-- Created   : 2026-05-12
-- Reference : ERD v1.0 / PRD v1.2 / 도메인 정의서 v1.2
-- ============================================================


-- ============================================================
-- EXTENSION
-- ============================================================

-- gen_random_uuid() 사용을 위한 확장 (PostgreSQL 13+ 기본 내장이나 명시적 활성화)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- TABLE: users
-- ============================================================
-- 도메인: User (사용자)
-- BR-02: email 전체 시스템 유일
-- DC-05: password 는 bcrypt 해시 후 저장 (애플리케이션 레벨)
-- DC-01: 삭제 시 todos, categories ON DELETE CASCADE

CREATE TABLE users (
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,   -- bcrypt hash
    name        VARCHAR(100) NOT NULL,
    theme       VARCHAR(10)  NOT NULL DEFAULT 'light',  -- 사용자 UI 테마 설정
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_users        PRIMARY KEY (id),
    CONSTRAINT uq_users_email  UNIQUE      (email),
    CONSTRAINT chk_users_theme CHECK       (theme IN ('light', 'dark'))
);

COMMENT ON TABLE  users            IS '서비스 사용자';
COMMENT ON COLUMN users.email      IS '로그인 식별자. 전체 고유값 (BR-02)';
COMMENT ON COLUMN users.password   IS 'bcrypt 해시된 비밀번호. 평문 저장 금지 (DC-05)';


-- ============================================================
-- TABLE: categories
-- ============================================================
-- 도메인: Category (카테고리)
-- user_id = NULL  → 기본 카테고리 (is_default = true, 수정·삭제 불가 BR-08)
-- user_id = UUID  → 사용자 정의 카테고리 (is_default = false)
-- BR-10: 동일 user_id 내 name 중복 불가 — 애플리케이션 레벨 검증
-- DC-04: name 앞뒤 공백 trim 후 저장 — 애플리케이션 레벨 처리

CREATE TABLE categories (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID,                   -- NULL: 기본 카테고리 / NOT NULL: 사용자 정의
    name        VARCHAR(50) NOT NULL,
    is_default  BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_categories      PRIMARY KEY (id),
    CONSTRAINT fk_categories_user FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE            -- DC-01: 사용자 삭제 시 사용자 정의 카테고리 연쇄 삭제
);

COMMENT ON TABLE  categories            IS '할일 분류 카테고리. 기본(is_default=true)과 사용자 정의(is_default=false)로 구분';
COMMENT ON COLUMN categories.user_id   IS 'NULL=기본 카테고리(시스템 공유), NOT NULL=사용자 정의';
COMMENT ON COLUMN categories.is_default IS 'true면 수정·삭제 불가 (BR-08)';


-- ============================================================
-- TABLE: todos
-- ============================================================
-- 도메인: Todo (할일)
-- BR-03: user_id 기반 소유권 검증은 애플리케이션 레벨
-- BR-05: category_id NOT NULL (카테고리 필수 지정)
-- BR-06: is_completed 변경 시 completed_at 자동 처리 — 애플리케이션 레벨
-- BR-07: due_date >= 오늘 검증 — 애플리케이션 레벨
-- BR-09: category 삭제 시 '일반' 카테고리로 이관 — 애플리케이션 레벨 트랜잭션
--        (DB CASCADE 미적용: 이관 없이 삭제되면 DC-02 위반)
-- DC-03: title 1~200자 제한

CREATE TABLE todos (
    id           UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL,
    category_id  UUID         NOT NULL,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    due_date     DATE,                  -- NULL 허용 (선택사항)
    is_completed BOOLEAN      NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,           -- is_completed=true 시 자동 기록 (BR-06)
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_todos          PRIMARY KEY (id),
    CONSTRAINT fk_todos_user     FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,             -- DC-01: 사용자 삭제 시 할일 연쇄 삭제
    CONSTRAINT fk_todos_category FOREIGN KEY (category_id)
        REFERENCES categories(id)
        -- ON DELETE 미설정: BR-09에 따라 애플리케이션 레벨 트랜잭션으로 '일반' 카테고리 이관 후 삭제
);

COMMENT ON TABLE  todos              IS '사용자의 할일 항목';
COMMENT ON COLUMN todos.category_id IS 'NOT NULL. 카테고리 삭제 전 반드시 이관 필요 (BR-09)';
COMMENT ON COLUMN todos.due_date    IS '종료예정일. 등록·수정 시 오늘 이후만 허용 (BR-07)';
COMMENT ON COLUMN todos.completed_at IS 'is_completed=true 시 자동 기록, 취소 시 NULL 초기화 (BR-06)';


-- ============================================================
-- INDEXES
-- ============================================================

-- users
CREATE UNIQUE INDEX idx_users_email
    ON users(email);                   -- 로그인 이메일 조회 (BR-02 중복 방지 이중 보호)

-- categories
CREATE INDEX idx_categories_user_id
    ON categories(user_id);            -- 사용자 카테고리 목록 조회

-- todos - 단일 컬럼
CREATE INDEX idx_todos_user_id
    ON todos(user_id);                 -- 사용자 할일 전체 조회

CREATE INDEX idx_todos_category_id
    ON todos(category_id);             -- BR-09: 카테고리 삭제 전 이관 대상 조회

-- categories - 기본 카테고리 이름 중복 방지 (ON CONFLICT DO NOTHING 지원)
CREATE UNIQUE INDEX idx_categories_default_name
    ON categories(name) WHERE user_id IS NULL;

-- todos - 복합 (UC-07 필터 패턴 최적화)
CREATE INDEX idx_todos_user_completed
    ON todos(user_id, is_completed);   -- 완료 여부 필터 (가장 빈번한 패턴)

CREATE INDEX idx_todos_user_due_date
    ON todos(user_id, due_date);       -- 기간 필터: dueDate 기준 (DC-08)

CREATE INDEX idx_todos_user_category
    ON todos(user_id, category_id);    -- 카테고리 필터


-- ============================================================
-- SEED DATA: 기본 카테고리
-- ============================================================
-- PRD §8: 애플리케이션 초기 실행 시 INSERT (ON CONFLICT DO NOTHING)
-- is_default = true, user_id = NULL → 모든 사용자 공유, 수정·삭제 불가 (BR-08)
-- BR-09의 이관 대상인 '일반' 카테고리가 반드시 존재해야 한다.

INSERT INTO categories (user_id, name, is_default) VALUES
    (NULL, '일반', true),
    (NULL, '업무', true),
    (NULL, '개인', true)
ON CONFLICT DO NOTHING;
