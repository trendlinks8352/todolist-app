const { test, expect } = require('@playwright/test')
const { uniqueEmail, signup } = require('./helpers')

test.describe('SC-E05: 카테고리명 중복 생성 시도', () => {
  async function createCustomCategory(page, name) {
    await page.click('[data-testid="add-category-toggle"]')
    await page.waitForSelector('[data-testid="new-category-form"]')
    await page.fill('[data-testid="new-category-input"]', name)
    await page.click('[data-testid="create-category-submit"]')
  }

  test.beforeEach(async ({ page }) => {
    const email = uniqueEmail()
    await signup(page, '테스트유저', email, 'Password123')
  })

  test('이미 존재하는 카테고리명 입력 시 오류 표시', async ({ page }) => {
    // 할일 등록 모달에서 "마케팅" 카테고리 생성
    await page.click('[data-testid="add-todo-button"]')
    await page.waitForSelector('[data-testid="todo-form"]')
    await createCustomCategory(page, '마케팅')
    await page.waitForSelector('[data-testid="new-category-form"]', { state: 'hidden' })

    // 동일 이름 재시도 → 오류
    await createCustomCategory(page, '마케팅')
    const errorMsg = page.locator('[data-testid="new-category-input"]').locator('xpath=../..').locator('[role="alert"]')
    await expect(errorMsg).toBeVisible({ timeout: 5000 })
    await expect(errorMsg).toContainText('이미 존재하는 카테고리')
  })

  test('앞뒤 공백 포함 동일 이름으로 생성 시도 → 오류', async ({ page }) => {
    await page.click('[data-testid="add-todo-button"]')
    await page.waitForSelector('[data-testid="todo-form"]')
    await createCustomCategory(page, '마케팅')
    await page.waitForSelector('[data-testid="new-category-form"]', { state: 'hidden' })

    // "  마케팅  " 공백 포함 재시도
    await createCustomCategory(page, '  마케팅  ')
    const errorMsg = page.locator('[data-testid="new-category-input"]').locator('xpath=../..').locator('[role="alert"]')
    await expect(errorMsg).toBeVisible({ timeout: 5000 })
    await expect(errorMsg).toContainText('이미 존재하는 카테고리')
  })

  test('다른 이름(마케팅팀)으로 생성 시 성공', async ({ page }) => {
    await page.click('[data-testid="add-todo-button"]')
    await page.waitForSelector('[data-testid="todo-form"]')

    // "마케팅" 생성
    await createCustomCategory(page, '마케팅')
    await page.waitForSelector('[data-testid="new-category-form"]', { state: 'hidden' })

    // "마케팅팀" 생성 → 성공
    await createCustomCategory(page, '마케팅팀')
    await page.waitForSelector('[data-testid="new-category-form"]', { state: 'hidden' })

    const selected = await page.$eval('select#category-select', (el) => el.selectedOptions[0]?.text)
    expect(selected).toBe('마케팅팀')
  })
})
