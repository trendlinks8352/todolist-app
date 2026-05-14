// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import { useUIStore } from '@/store/uiStore'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockLoginMutate = vi.hoisted(() => vi.fn())
const mockSignupMutate = vi.hoisted(() => vi.fn())
const mockLoginPending = vi.hoisted(() => ({ value: false }))
const mockSignupPending = vi.hoisted(() => ({ value: false }))

vi.mock('@/hooks/useAuth', () => ({
  useLogin: () => ({
    mutate: mockLoginMutate,
    get isPending() { return mockLoginPending.value },
    isError: false,
    error: null,
  }),
  useSignup: () => ({
    mutate: mockSignupMutate,
    get isPending() { return mockSignupPending.value },
    isError: false,
    error: null,
  }),
}))

const mockNavigate = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderWithProviders(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/']}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockLoginPending.value = false
  mockSignupPending.value = false
  useUIStore.setState({ toast: null, isModalOpen: false, modalType: null, selectedTodoId: null })
})

// ─── LoginPage ────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  it('이메일, 비밀번호 입력 필드와 로그인 버튼이 렌더링된다', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByLabelText('이메일 주소')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByTestId('login-submit')).toBeInTheDocument()
  })

  it('회원가입 링크가 있다', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByTestId('signup-link')).toBeInTheDocument()
  })

  it('이메일 빈값으로 제출 시 에러가 표시된다', async () => {
    renderWithProviders(<LoginPage />)
    await userEvent.click(screen.getByTestId('login-submit'))
    const alerts = screen.getAllByRole('alert')
    expect(alerts.some((a) => a.textContent?.includes('이메일을 입력해주세요.'))).toBe(true)
  })

  it('이메일 형식이 잘못된 경우 에러가 표시된다', async () => {
    renderWithProviders(<LoginPage />)
    await userEvent.type(screen.getByTestId('email-input'), 'invalid-email')
    await userEvent.type(screen.getByTestId('password-input'), 'password')
    await userEvent.click(screen.getByTestId('login-submit'))
    expect(screen.getByRole('alert')).toHaveTextContent('올바른 이메일 형식이 아닙니다.')
  })

  it('비밀번호 빈값으로 제출 시 에러가 표시된다', async () => {
    renderWithProviders(<LoginPage />)
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
    await userEvent.click(screen.getByTestId('login-submit'))
    expect(screen.getByRole('alert')).toHaveTextContent('비밀번호를 입력해주세요.')
  })

  it('유효한 입력으로 제출 시 login.mutate가 호출된다', async () => {
    renderWithProviders(<LoginPage />)
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'Pass1234')
    await userEvent.click(screen.getByTestId('login-submit'))

    expect(mockLoginMutate).toHaveBeenCalledWith(
      { email: 'test@example.com', password: 'Pass1234' },
      expect.any(Object),
    )
  })

  it('유효성 오류가 있으면 login.mutate가 호출되지 않는다', async () => {
    renderWithProviders(<LoginPage />)
    await userEvent.click(screen.getByTestId('login-submit'))
    expect(mockLoginMutate).not.toHaveBeenCalled()
  })

  it('isPending 시 버튼이 disabled 상태가 된다', () => {
    mockLoginPending.value = true
    renderWithProviders(<LoginPage />)
    expect(screen.getByTestId('login-submit')).toBeDisabled()
  })

  it('401 에러 시 Toast에 올바른 메시지가 표시된다', async () => {
    mockLoginMutate.mockImplementation((_data: unknown, options: { onError?: (err: unknown) => void }) => {
      options.onError?.({ status: 401, code: 'UNAUTHORIZED', message: '인증 실패', fields: [] })
    })

    renderWithProviders(<LoginPage />)
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'Pass1234')
    await userEvent.click(screen.getByTestId('login-submit'))

    await waitFor(() => {
      expect(useUIStore.getState().toast?.message).toBe('이메일 또는 비밀번호가 올바르지 않습니다.')
      expect(useUIStore.getState().toast?.type).toBe('error')
    })
  })

  it('기타 에러 시 서버 메시지가 Toast에 표시된다', async () => {
    mockLoginMutate.mockImplementation((_data: unknown, options: { onError?: (err: unknown) => void }) => {
      options.onError?.({ status: 500, code: 'INTERNAL_ERROR', message: '서버 오류', fields: [] })
    })

    renderWithProviders(<LoginPage />)
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'Pass1234')
    await userEvent.click(screen.getByTestId('login-submit'))

    await waitFor(() => {
      expect(useUIStore.getState().toast?.message).toBe('서버 오류')
    })
  })
})

// ─── SignupPage ───────────────────────────────────────────────────────────────

describe('SignupPage', () => {
  it('이름, 이메일, 비밀번호, 확인 필드와 회원가입 버튼이 렌더링된다', () => {
    renderWithProviders(<SignupPage />)
    expect(screen.getByLabelText('이름')).toBeInTheDocument()
    expect(screen.getByLabelText('이메일 주소')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument()
    expect(screen.getByTestId('signup-submit')).toBeInTheDocument()
  })

  it('로그인 링크가 있다', () => {
    renderWithProviders(<SignupPage />)
    expect(screen.getByTestId('login-link')).toBeInTheDocument()
  })

  it('이름 빈값 제출 시 에러가 표시된다', async () => {
    renderWithProviders(<SignupPage />)
    await userEvent.click(screen.getByTestId('signup-submit'))
    const alerts = screen.getAllByRole('alert')
    expect(alerts.some((a) => a.textContent?.includes('이름을 입력해주세요'))).toBe(true)
  })

  it('비밀번호 8자 미만 시 에러가 표시된다', async () => {
    renderWithProviders(<SignupPage />)
    await userEvent.type(screen.getByTestId('name-input'), '홍길동')
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'abc12')
    await userEvent.type(screen.getByTestId('confirm-input'), 'abc12')
    await userEvent.click(screen.getByTestId('signup-submit'))

    const alerts = screen.getAllByRole('alert')
    expect(alerts.some((a) => a.textContent?.includes('8자 이상'))).toBe(true)
  })

  it('비밀번호에 영문자 없으면 에러가 표시된다', async () => {
    renderWithProviders(<SignupPage />)
    await userEvent.type(screen.getByTestId('name-input'), '홍길동')
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
    await userEvent.type(screen.getByTestId('password-input'), '12345678')
    await userEvent.type(screen.getByTestId('confirm-input'), '12345678')
    await userEvent.click(screen.getByTestId('signup-submit'))

    const alerts = screen.getAllByRole('alert')
    expect(alerts.some((a) => a.textContent?.includes('영문자'))).toBe(true)
  })

  it('비밀번호에 숫자 없으면 에러가 표시된다', async () => {
    renderWithProviders(<SignupPage />)
    await userEvent.type(screen.getByTestId('name-input'), '홍길동')
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'abcdefgh')
    await userEvent.type(screen.getByTestId('confirm-input'), 'abcdefgh')
    await userEvent.click(screen.getByTestId('signup-submit'))

    const alerts = screen.getAllByRole('alert')
    expect(alerts.some((a) => a.textContent?.includes('숫자'))).toBe(true)
  })

  it('비밀번호 불일치 시 에러가 표시된다', async () => {
    renderWithProviders(<SignupPage />)
    await userEvent.type(screen.getByTestId('name-input'), '홍길동')
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'Pass1234')
    await userEvent.type(screen.getByTestId('confirm-input'), 'Pass9999')
    await userEvent.click(screen.getByTestId('signup-submit'))

    const alerts = screen.getAllByRole('alert')
    expect(alerts.some((a) => a.textContent?.includes('비밀번호가 일치하지 않습니다'))).toBe(true)
  })

  it('유효한 입력으로 제출 시 signup.mutate가 호출된다', async () => {
    renderWithProviders(<SignupPage />)
    await userEvent.type(screen.getByTestId('name-input'), '홍길동')
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'Pass1234')
    await userEvent.type(screen.getByTestId('confirm-input'), 'Pass1234')
    await userEvent.click(screen.getByTestId('signup-submit'))

    expect(mockSignupMutate).toHaveBeenCalledWith(
      { name: '홍길동', email: 'test@example.com', password: 'Pass1234' },
      expect.any(Object),
    )
  })

  it('유효성 오류가 있으면 signup.mutate가 호출되지 않는다', async () => {
    renderWithProviders(<SignupPage />)
    await userEvent.click(screen.getByTestId('signup-submit'))
    expect(mockSignupMutate).not.toHaveBeenCalled()
  })

  it('isPending 시 버튼이 disabled 상태가 된다', () => {
    mockSignupPending.value = true
    renderWithProviders(<SignupPage />)
    expect(screen.getByTestId('signup-submit')).toBeDisabled()
  })

  it('409 에러 시 Toast에 이메일 중복 메시지가 표시된다', async () => {
    mockSignupMutate.mockImplementation((_data: unknown, options: { onError?: (err: unknown) => void }) => {
      options.onError?.({ status: 409, code: 'CONFLICT', message: '이미 가입된 이메일', fields: [] })
    })

    renderWithProviders(<SignupPage />)
    await userEvent.type(screen.getByTestId('name-input'), '홍길동')
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'Pass1234')
    await userEvent.type(screen.getByTestId('confirm-input'), 'Pass1234')
    await userEvent.click(screen.getByTestId('signup-submit'))

    await waitFor(() => {
      expect(useUIStore.getState().toast?.message).toBe('이미 사용 중인 이메일입니다.')
      expect(useUIStore.getState().toast?.type).toBe('error')
    })
  })

  it('이메일 형식 에러가 표시된다', async () => {
    renderWithProviders(<SignupPage />)
    await userEvent.type(screen.getByTestId('name-input'), '홍길동')
    await userEvent.type(screen.getByTestId('email-input'), 'not-an-email')
    await userEvent.type(screen.getByTestId('password-input'), 'Pass1234')
    await userEvent.type(screen.getByTestId('confirm-input'), 'Pass1234')
    await userEvent.click(screen.getByTestId('signup-submit'))

    const alerts = screen.getAllByRole('alert')
    expect(alerts.some((a) => a.textContent?.includes('이메일 형식'))).toBe(true)
  })
})
