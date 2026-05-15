const { test, expect } = require('@playwright/test')
const { uniqueEmail, signup, createTodo } = require('./helpers')

test.describe('SC-03: 아침 루틴 — 오늘 할일 일괄 등록 및 퇴근 전 미완료 확인', () => {
  test('할일 3개 일괄 등록 → 2개 완료 → 미완료 필터로 1개 확인', async ({ page }) => {
    const email = uniqueEmail()
    await signup(page, '박성호', email, 'Password123')

    // 할일 3개 등록
    await createTodo(page, { title: '팀 회의 진행', categoryLabel: '업무', dueDate: '2026-05-20' })
    await createTodo(page, { title: '보고서 검토', categoryLabel: '업무', dueDate: '2026-05-20' })
    await createTodo(page, { title: '예산 승인', categoryLabel: '업무', dueDate: '2026-05-21' })

    // 3개 모두 표시 확인
    await expect(page.locator('[data-testid="todo-title"]')).toHaveCount(3)

    // "팀 회의 진행" 완료
    const teamMeeting = page.locator('[data-testid^="todo-item-"]', { hasText: '팀 회의 진행' })
    await teamMeeting.locator('input[type="checkbox"]').click()
    await expect(teamMeeting.locator('input[type="checkbox"]')).toBeChecked()

    // "보고서 검토" 완료
    const reportReview = page.locator('[data-testid^="todo-item-"]', { hasText: '보고서 검토' })
    await reportReview.locator('input[type="checkbox"]').click()
    await expect(reportReview.locator('input[type="checkbox"]')).toBeChecked()

    // 미완료 필터 → "예산 승인" 1개만 표시
    await page.selectOption('select#filter-completion', { label: '미완료' })
    await expect(page.locator('[data-testid="todo-title"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="todo-title"]').first()).toHaveText('예산 승인')
  })
})
