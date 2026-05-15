const { test, expect } = require('@playwright/test')
const { uniqueEmail, BASE_URL } = require('./helpers')

test.describe('SC-01: 신규 사용자 온보딩', () => {
  test('회원가입 → 로그인 페이지로 이동 → 로그인 → 첫 할일 등록', async ({ page }) => {
    const email = uniqueEmail()
    const name = '김철수'
    const password = 'Password123'

    // 1. 회원가입 페이지 접근
    await page.goto(`${BASE_URL}/signup`)
    await expect(page.locator('[data-testid="signup-form"]')).toBeVisible()

    // 2. 회원가입 폼 입력 및 제출
    await page.fill('[data-testid="name-input"]', name)
    await page.fill('[data-testid="email-input"]', email)
    await page.fill('[data-testid="password-input"]', password)
    await page.fill('[data-testid="confirm-input"]', password)
    await page.click('[data-testid="signup-submit"]')

    // 3. 회원가입 성공 → /login으로 이동 (자동 로그인 미적용 설계)
    await page.waitForURL('**/login', { timeout: 10000 })
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()

    // 4. 로그인 수행
    await page.fill('[data-testid="email-input"]', email)
    await page.fill('[data-testid="password-input"]', password)
    await page.click('[data-testid="login-submit"]')

    // 5. /todos로 이동 및 사용자 이름 확인
    await page.waitForURL('**/todos', { timeout: 10000 })
    await expect(page.locator('[data-testid="user-name"]')).toHaveText(name)

    // 6. "+ 새로운 할일" 버튼 클릭
    await page.click('[data-testid="add-todo-button"]')
    await expect(page.locator('[data-testid="todo-form"]')).toBeVisible()

    // 7. 할일 등록
    await page.fill('[data-testid="title-input"]', '프로젝트 기획서 작성')
    await page.fill('[data-testid="description-input"]', 'Q2 마케팅 프로젝트 기획서')
    await page.selectOption('select#category-select', { label: '업무' })
    await page.fill('[data-testid="due-date-input"]', '2026-05-20')
    await page.click('[data-testid="form-submit"]')
    await page.waitForSelector('[data-testid="todo-form"]', { state: 'hidden' })

    // 8. 할일 목록에서 등록된 항목 확인
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '프로젝트 기획서 작성' })).toBeVisible()
  })
})
