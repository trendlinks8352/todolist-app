-- Migration 001: users 테이블에 theme 컬럼 추가
-- Created: 2026-05-14
-- Description: 다크 모드 설정 서버 영속화를 위한 theme 컬럼 추가

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS theme VARCHAR(10) NOT NULL DEFAULT 'light'
  CONSTRAINT chk_users_theme CHECK (theme IN ('light', 'dark'));

COMMENT ON COLUMN users.theme IS '사용자 UI 테마 설정. light(기본) 또는 dark';
