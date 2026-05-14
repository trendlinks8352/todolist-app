-- ============================================================
-- TodoListApp Seed Data
-- ============================================================
-- 기본 카테고리 3개 초기 적재
-- ON CONFLICT DO NOTHING: 재실행 시 중복 오류 없이 3행 유지
-- (idx_categories_default_name partial unique index 기반)

INSERT INTO categories (user_id, name, is_default) VALUES
    (NULL, '일반', true),
    (NULL, '업무', true),
    (NULL, '개인', true)
ON CONFLICT DO NOTHING;
