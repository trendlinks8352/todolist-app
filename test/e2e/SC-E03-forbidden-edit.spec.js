const { test, expect } = require('@playwright/test')
const { uniqueEmail, API_URL } = require('./helpers')

test.describe('SC-E03: 타인 할일 수정 시도', () => {
  test('다른 사용자의 할일에 PUT 요청 시 403 응답', async ({ request }) => {
    const ts = Date.now()
    const emailA = `usera${ts}@example.com`
    const emailB = `userb${ts + 1}@example.com`
    const password = 'Password123'

    // 사용자 A 가입 및 로그인
    await request.post(`${API_URL}/api/auth/register`, {
      data: { name: '사용자A', email: emailA, password },
    })
    const loginA = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: emailA, password },
    })
    const { accessToken: tokenA } = await loginA.json()

    // 사용자 B 가입 및 로그인
    await request.post(`${API_URL}/api/auth/register`, {
      data: { name: '사용자B', email: emailB, password },
    })
    const loginB = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: emailB, password },
    })
    const { accessToken: tokenB } = await loginB.json()

    // 사용자 A의 카테고리 조회
    const categoriesA = await request.get(`${API_URL}/api/categories`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    const { data: catDataA } = await categoriesA.json()
    const categoryIdA = catDataA[0].id

    // 사용자 A가 할일 생성
    const createRes = await request.post(`${API_URL}/api/todos`, {
      data: { title: 'A의 할일', categoryId: categoryIdA, dueDate: null, description: null },
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    const todoA = await createRes.json()

    // 사용자 B가 A의 할일 수정 시도 → 403
    const forbiddenRes = await request.put(`${API_URL}/api/todos/${todoA.id}`, {
      data: { title: '무단 수정 시도', categoryId: categoryIdA },
      headers: { Authorization: `Bearer ${tokenB}` },
    })
    expect(forbiddenRes.status()).toBe(403)

    const body = await forbiddenRes.json()
    expect(body.error.code).toBe('FORBIDDEN')
  })
})
