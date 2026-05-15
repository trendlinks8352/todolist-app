const { test, expect } = require('@playwright/test')
const { uniqueEmail, BASE_URL } = require('./helpers')

test.describe('SC-E04: 비밀번호 정책 위반 회원가입', () => {
  test('숫자 미포함 비밀번호(password) → 클라이언트 오류', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`)
    await page.fill('[data-testid="name-input"]', 'Jane')
    await page.fill('[data-testid="email-input"]', uniqueEmail())
    await page.fill('[data-testid="password-input"]', 'password')
    await page.fill('[data-testid="confirm-input"]', 'password')
    await page.click('[data-testid="signup-submit"]')

    // 비밀번호 필드의 오류 메시지 확인
    await expect(page.locator('[role="alert"]').first()).toBeVisible()
    expect(page.url()).toContain('/signup')
  })

  test('8자 미만 비밀번호(Pass1) → 클라이언트 오류', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`)
    await page.fill('[data-testid="name-input"]', 'Jane')
    await page.fill('[data-testid="email-input"]', uniqueEmail())
    await page.fill('[data-testid="password-input"]', 'Pass1')
    await page.fill('[data-testid="confirm-input"]', 'Pass1')
    await page.click('[data-testid="signup-submit"]')

    const alerts = page.locator('[role="alert"]')
    await expect(alerts.first()).toBeVisible()
    // 8자 관련 오류 메시지 중 하나 존재
    const texts = await alerts.allTextContents()
    expect(texts.some((t) => t.includes('8자'))).toBe(true)
    expect(page.url()).toContain('/signup')
  })

  test('정책 준수 비밀번호(Password123) → 회원가입 성공', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`)
    await page.fill('[data-testid="name-input"]', 'Jane')
    await page.fill('[data-testid="email-input"]', uniqueEmail())
    await page.fill('[data-testid="password-input"]', 'Password123')
    await page.fill('[data-testid="confirm-input"]', 'Password123')
    await page.click('[data-testid="signup-submit"]')

    // 회원가입 성공 → /login으로 redirect (자동 로그인 없음)
    await page.waitForURL('**/login', { timeout: 10000 })
  })
})
