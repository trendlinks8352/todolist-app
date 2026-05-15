const BASE_URL = 'http://localhost:5173'
const API_URL = 'http://localhost:3000'

function uniqueEmail() {
  return `test${Date.now()}@example.com`
}

// 회원가입 → 로그인 페이지 redirect → 로그인 → /todos 까지 완료
async function signup(page, name, email, password) {
  await page.goto(`${BASE_URL}/signup`)
  await page.fill('[data-testid="name-input"]', name)
  await page.fill('[data-testid="email-input"]', email)
  await page.fill('[data-testid="password-input"]', password)
  await page.fill('[data-testid="confirm-input"]', password)
  await page.click('[data-testid="signup-submit"]')
  // 회원가입 성공 후 /login으로 redirect
  await page.waitForURL('**/login', { timeout: 10000 })
  // 로그인
  await page.fill('[data-testid="email-input"]', email)
  await page.fill('[data-testid="password-input"]', password)
  await page.click('[data-testid="login-submit"]')
  await page.waitForURL('**/todos', { timeout: 10000 })
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('[data-testid="email-input"]', email)
  await page.fill('[data-testid="password-input"]', password)
  await page.click('[data-testid="login-submit"]')
  await page.waitForURL('**/todos', { timeout: 10000 })
}

async function createTodo(page, { title, description = '', categoryLabel, dueDate = '' }) {
  await page.click('[data-testid="add-todo-button"]')
  await page.waitForSelector('[data-testid="todo-form"]')
  await page.fill('[data-testid="title-input"]', title)
  if (description) {
    await page.fill('[data-testid="description-input"]', description)
  }
  await page.selectOption('select#category-select', { label: categoryLabel })
  if (dueDate) {
    await page.fill('[data-testid="due-date-input"]', dueDate)
  }
  await page.click('[data-testid="form-submit"]')
  await page.waitForSelector('[data-testid="todo-form"]', { state: 'hidden' })
}

module.exports = { uniqueEmail, signup, login, createTodo, BASE_URL, API_URL }
