const { test, expect } = require('@playwright/test')
const { uniqueEmail, signup, createTodo } = require('./helpers')

test.describe('SC-02: 출퇴근길 할일 확인 및 완료 처리', () => {
  test.beforeEach(async ({ page }) => {
    const email = uniqueEmail()
    await signup(page, '김지수', email, 'Password123')
    await createTodo(page, { title: '캠페인 피드백 수집', categoryLabel: '업무', dueDate: '2026-05-20' })
    await createTodo(page, { title: '주간 회의 자료 준비', categoryLabel: '업무', dueDate: '2026-05-21' })
    await createTodo(page, { title: '운동하기', categoryLabel: '개인', dueDate: '2026-05-22' })
  })

  test('할일 완료 체크박스 클릭 → 완료/미완료 필터 분리 조회', async ({ page }) => {
    // "캠페인 피드백 수집" 완료 처리
    const todoItem = page.locator('[data-testid^="todo-item-"]', { hasText: '캠페인 피드백 수집' })
    await expect(todoItem).toBeVisible()
    const checkbox = todoItem.locator(`input[type="checkbox"]`)
    await checkbox.click()
    await expect(checkbox).toBeChecked()

    // "완료" 필터 적용 → 완료된 항목만 표시
    await page.selectOption('select#filter-completion', { label: '완료' })
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '캠페인 피드백 수집' })).toBeVisible()
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '주간 회의 자료 준비' })).not.toBeVisible()

    // "미완료" 필터 적용 → 미완료 항목만 표시
    await page.selectOption('select#filter-completion', { label: '미완료' })
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '주간 회의 자료 준비' })).toBeVisible()
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '운동하기' })).toBeVisible()
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '캠페인 피드백 수집' })).not.toBeVisible()
  })
})
