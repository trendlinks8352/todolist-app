const { test, expect } = require('@playwright/test')
const { uniqueEmail, signup } = require('./helpers')

test.describe('SC-05: 사용자 정의 카테고리 생성 후 할일 분류', () => {
  test.beforeEach(async ({ page }) => {
    const email = uniqueEmail()
    await signup(page, '김지수', email, 'Password123')
  })

  test('새 카테고리 생성 후 해당 카테고리로 할일 등록 및 필터 조회', async ({ page }) => {
    // 할일 등록 모달 열기
    await page.click('[data-testid="add-todo-button"]')
    await page.waitForSelector('[data-testid="todo-form"]')

    // "새 카테고리 추가" 버튼 클릭
    await page.click('[data-testid="add-category-toggle"]')
    await expect(page.locator('[data-testid="new-category-form"]')).toBeVisible()

    // "캠페인 관리" 카테고리 추가
    await page.fill('[data-testid="new-category-input"]', '캠페인 관리')
    await page.click('[data-testid="create-category-submit"]')
    await page.waitForSelector('[data-testid="new-category-form"]', { state: 'hidden' })

    // 카테고리가 자동 선택됨 확인
    const selected = await page.$eval('select#category-select', (el) => el.selectedOptions[0]?.text)
    expect(selected).toBe('캠페인 관리')

    // 첫 번째 할일 등록
    await page.fill('[data-testid="title-input"]', 'Q2 페이스북 캠페인 기획')
    await page.fill('[data-testid="due-date-input"]', '2026-05-25')
    await page.click('[data-testid="form-submit"]')
    await page.waitForSelector('[data-testid="todo-form"]', { state: 'hidden' })

    // "회의 준비" 카테고리로 두 번째 할일 등록
    await page.click('[data-testid="add-todo-button"]')
    await page.waitForSelector('[data-testid="todo-form"]')
    await page.click('[data-testid="add-category-toggle"]')
    await page.fill('[data-testid="new-category-input"]', '회의 준비')
    await page.click('[data-testid="create-category-submit"]')
    await page.waitForSelector('[data-testid="new-category-form"]', { state: 'hidden' })
    await page.fill('[data-testid="title-input"]', '월요일 팀 회의')
    await page.fill('[data-testid="due-date-input"]', '2026-05-20')
    await page.click('[data-testid="form-submit"]')
    await page.waitForSelector('[data-testid="todo-form"]', { state: 'hidden' })

    // 2개 할일 모두 표시
    await expect(page.locator('[data-testid="todo-title"]')).toHaveCount(2)

    // "캠페인 관리" 필터 → 1개
    await page.selectOption('select#filter-category', { label: '캠페인 관리' })
    await expect(page.locator('[data-testid="todo-title"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="todo-title"]', { hasText: 'Q2 페이스북 캠페인 기획' })).toBeVisible()

    // "회의 준비" 필터 → 1개
    await page.selectOption('select#filter-category', { label: '회의 준비' })
    await expect(page.locator('[data-testid="todo-title"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="todo-title"]', { hasText: '월요일 팀 회의' })).toBeVisible()
  })
})
