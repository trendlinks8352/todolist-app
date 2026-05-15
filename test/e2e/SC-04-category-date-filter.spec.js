const { test, expect } = require('@playwright/test')
const { uniqueEmail, signup, createTodo } = require('./helpers')

test.describe('SC-04: 카테고리별 할일 관리 + 기간 필터로 회고', () => {
  test.beforeEach(async ({ page }) => {
    const email = uniqueEmail()
    await signup(page, '이하은', email, 'Password123')
    await createTodo(page, { title: '분기 전략 계획', categoryLabel: '업무', dueDate: '2026-05-20' })
    await createTodo(page, { title: '팀 회의 자료', categoryLabel: '업무', dueDate: '2026-05-21' })
    await createTodo(page, { title: '포트폴리오 작성', categoryLabel: '개인', dueDate: '2026-05-25' })
  })

  test('카테고리 필터로 업무 항목만 조회', async ({ page }) => {
    await page.selectOption('select#filter-category', { label: '업무' })
    await expect(page.locator('[data-testid="todo-title"]')).toHaveCount(2)
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '분기 전략 계획' })).toBeVisible()
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '팀 회의 자료' })).toBeVisible()
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '포트폴리오 작성' })).not.toBeVisible()
  })

  test('기간 필터로 특정 날짜 범위 내 항목 조회', async ({ page }) => {
    await page.fill('[data-testid="filter-date-from"]', '2026-05-20')
    await page.fill('[data-testid="filter-date-to"]', '2026-05-21')
    await expect(page.locator('[data-testid="todo-title"]')).toHaveCount(2)
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '분기 전략 계획' })).toBeVisible()
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '팀 회의 자료' })).toBeVisible()
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '포트폴리오 작성' })).not.toBeVisible()
  })

  test('카테고리 + 완료 상태 복합 필터', async ({ page }) => {
    // 업무 할일 2개 완료 처리
    const strategy = page.locator('[data-testid^="todo-item-"]', { hasText: '분기 전략 계획' })
    await strategy.locator('input[type="checkbox"]').click()
    const meeting = page.locator('[data-testid^="todo-item-"]', { hasText: '팀 회의 자료' })
    await meeting.locator('input[type="checkbox"]').click()

    // 업무 + 완료 복합 필터
    await page.selectOption('select#filter-category', { label: '업무' })
    await page.selectOption('select#filter-completion', { label: '완료' })
    await expect(page.locator('[data-testid="todo-title"]')).toHaveCount(2)
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '포트폴리오 작성' })).not.toBeVisible()
  })

  test('필터 초기화', async ({ page }) => {
    await page.selectOption('select#filter-category', { label: '업무' })
    await expect(page.locator('[data-testid="todo-title"]')).toHaveCount(2)

    await page.click('[data-testid="reset-filters"]')
    await expect(page.locator('[data-testid="todo-title"]')).toHaveCount(3)
  })
})
