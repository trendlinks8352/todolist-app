const { test, expect } = require('@playwright/test')
const { uniqueEmail, BASE_URL } = require('./helpers')

test.describe('SC-E01: 이메일 중복 회원가입 시도', () => {
  test('이미 가입된 이메일로 회원가입 시 오류 메시지 표시', async ({ page }) => {
    const email = uniqueEmail()
    const password = 'Password123'

    // 첫 번째 회원가입 (성공) → /login redirect → 로그인 → /todos
    await page.goto(`${BASE_URL}/signup`)
    await page.fill('[data-testid="name-input"]', '홍길동')
    await page.fill('[data-testid="email-input"]', email)
    await page.fill('[data-testid="password-input"]', password)
    await page.fill('[data-testid="confirm-input"]', password)
    await page.click('[data-testid="signup-submit"]')
    await page.waitForURL('**/login', { timeout: 10000 })
    await page.fill('[data-testid="email-input"]', email)
    await page.fill('[data-testid="password-input"]', password)
    await page.click('[data-testid="login-submit"]')
    await page.waitForURL('**/todos', { timeout: 10000 })

    // 로그아웃
    await page.click('[data-testid="logout-button"]')
    await page.waitForURL('**/login', { timeout: 5000 })

    // 같은 이메일로 재가입 시도
    await page.goto(`${BASE_URL}/signup`)
    await page.fill('[data-testid="name-input"]', '다른 사람')
    await page.fill('[data-testid="email-input"]', email)
    await page.fill('[data-testid="password-input"]', password)
    await page.fill('[data-testid="confirm-input"]', password)
    await page.click('[data-testid="signup-submit"]')

    // 409 오류 토스트 메시지 확인
    await expect(page.locator('text=이미 사용 중인 이메일입니다.')).toBeVisible({ timeout: 5000 })
    expect(page.url()).toContain('/signup')
  })
})
