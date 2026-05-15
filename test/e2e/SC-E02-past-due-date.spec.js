const { test, expect } = require('@playwright/test')
const { uniqueEmail, signup } = require('./helpers')

test.describe('SC-E02: 과거 날짜로 종료예정일 등록 시도', () => {
  test('과거 날짜 입력 시 클라이언트 유효성 오류 표시', async ({ page }) => {
    const email = uniqueEmail()
    await signup(page, '테스트유저', email, 'Password123')

    await page.click('[data-testid="add-todo-button"]')
    await page.waitForSelector('[data-testid="todo-form"]')

    await page.fill('[data-testid="title-input"]', '지난주 보고서')
    await page.selectOption('select#category-select', { label: '업무' })

    // min 속성 우회하여 과거 날짜 직접 설정
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="due-date-input"]')
      if (input) {
        input.removeAttribute('min')
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        nativeInputValueSetter.call(input, '2026-05-01')
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })

    await page.click('[data-testid="form-submit"]')

    // 클라이언트 유효성 오류 확인
    await expect(page.locator('[data-testid="due-date-error"]')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('[data-testid="due-date-error"]')).toContainText('오늘 이후')

    // 모달 유지 (등록 실패)
    await expect(page.locator('[data-testid="todo-form"]')).toBeVisible()
  })

  test('유효한 날짜(오늘 이후)로 정상 등록', async ({ page }) => {
    const email = uniqueEmail()
    await signup(page, '테스트유저2', email, 'Password123')

    await page.click('[data-testid="add-todo-button"]')
    await page.waitForSelector('[data-testid="todo-form"]')

    await page.fill('[data-testid="title-input"]', '유효한 날짜 할일')
    await page.selectOption('select#category-select', { label: '업무' })
    await page.fill('[data-testid="due-date-input"]', '2026-05-20')
    await page.click('[data-testid="form-submit"]')

    await page.waitForSelector('[data-testid="todo-form"]', { state: 'hidden' })
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '유효한 날짜 할일' })).toBeVisible()
  })
})
