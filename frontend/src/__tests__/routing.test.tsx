// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { GuestRoute } from '@/routes/GuestRoute'
import { useAuthStore } from '@/store/authStore'

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, user: null, isAuthenticated: false })
})

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  function renderProtected(initialPath: string, authenticated: boolean) {
    if (authenticated) {
      useAuthStore.setState({ accessToken: 'token', isAuthenticated: true })
    }
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/todos" element={<div data-testid="todos-page">할일 목록</div>} />
          </Route>
          <Route path="/login" element={<div data-testid="login-page">로그인</div>} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('비인증 상태에서 /todos 접근 시 /login으로 리다이렉트된다', () => {
    renderProtected('/todos', false)
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.queryByTestId('todos-page')).not.toBeInTheDocument()
  })

  it('인증 상태에서 /todos 접근 시 페이지가 렌더링된다', () => {
    renderProtected('/todos', true)
    expect(screen.getByTestId('todos-page')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  it('비인증 상태에서 리다이렉트 시 replace를 사용한다 (뒤로가기 차단)', () => {
    let locationKey = ''
    function LocationCapture() {
      const { useLocation } = require('react-router-dom') as typeof import('react-router-dom')
      const loc = useLocation()
      locationKey = loc.pathname
      return null
    }

    render(
      <MemoryRouter initialEntries={['/todos']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/todos" element={<div>todos</div>} />
          </Route>
          <Route path="/login" element={<LocationCapture />} />
        </Routes>
      </MemoryRouter>
    )
    expect(locationKey).toBe('/login')
  })
})

// ─── GuestRoute ───────────────────────────────────────────────────────────────

describe('GuestRoute', () => {
  function renderGuest(initialPath: string, authenticated: boolean) {
    if (authenticated) {
      useAuthStore.setState({ accessToken: 'token', isAuthenticated: true })
    }
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<div data-testid="login-page">로그인</div>} />
            <Route path="/signup" element={<div data-testid="signup-page">회원가입</div>} />
          </Route>
          <Route path="/todos" element={<div data-testid="todos-page">할일 목록</div>} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('비인증 상태에서 /login 접근 시 로그인 페이지가 렌더링된다', () => {
    renderGuest('/login', false)
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.queryByTestId('todos-page')).not.toBeInTheDocument()
  })

  it('인증 상태에서 /login 접근 시 /todos로 리다이렉트된다', () => {
    renderGuest('/login', true)
    expect(screen.getByTestId('todos-page')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  it('비인증 상태에서 /signup 접근 시 회원가입 페이지가 렌더링된다', () => {
    renderGuest('/signup', false)
    expect(screen.getByTestId('signup-page')).toBeInTheDocument()
  })

  it('인증 상태에서 /signup 접근 시 /todos로 리다이렉트된다', () => {
    renderGuest('/signup', true)
    expect(screen.getByTestId('todos-page')).toBeInTheDocument()
    expect(screen.queryByTestId('signup-page')).not.toBeInTheDocument()
  })
})

// ─── App 라우팅 통합 테스트 ───────────────────────────────────────────────────

describe('App 라우팅 통합', () => {
  async function renderApp(initialPath: string, authenticated = false) {
    if (authenticated) {
      useAuthStore.setState({ accessToken: 'token', isAuthenticated: true })
    }

    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Suspense fallback={<div data-testid="loading">로딩</div>}>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<div data-testid="login-page">로그인</div>} />
              <Route path="/signup" element={<div data-testid="signup-page">회원가입</div>} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/todos" element={<div data-testid="todos-page">할일 목록</div>} />
            </Route>
            <Route path="/" element={<Outlet />} />
          </Routes>
        </Suspense>
      </MemoryRouter>
    )
  }

  it('비인증 상태에서 /todos 접근 시 /login으로 이동한다', async () => {
    await renderApp('/todos', false)
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('인증 상태에서 /login 접근 시 /todos로 이동한다', async () => {
    await renderApp('/login', true)
    expect(screen.getByTestId('todos-page')).toBeInTheDocument()
  })

  it('인증 상태에서 /todos 접근 시 할일 목록 페이지가 표시된다', async () => {
    await renderApp('/todos', true)
    expect(screen.getByTestId('todos-page')).toBeInTheDocument()
  })
})

// ─── Navigate replace 동작 검증 ──────────────────────────────────────────────

describe('라우팅 replace 옵션 (뒤로가기 차단)', () => {
  it('ProtectedRoute는 Navigate replace를 사용하여 히스토리를 대체한다', () => {
    const navigatedPaths: string[] = []

    function PathLogger() {
      const { useLocation } = require('react-router-dom') as typeof import('react-router-dom')
      const { pathname } = useLocation()
      navigatedPaths.push(pathname)
      return <span data-testid="path">{pathname}</span>
    }

    render(
      <MemoryRouter initialEntries={['/todos']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/todos" element={<div>todos</div>} />
          </Route>
          <Route path="/login" element={<PathLogger />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('path')).toHaveTextContent('/login')
  })

  it('GuestRoute는 Navigate replace를 사용하여 히스토리를 대체한다', () => {
    useAuthStore.setState({ accessToken: 'token', isAuthenticated: true })

    function PathLogger() {
      const { useLocation } = require('react-router-dom') as typeof import('react-router-dom')
      const { pathname } = useLocation()
      return <span data-testid="path">{pathname}</span>
    }

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<div>login</div>} />
          </Route>
          <Route path="/todos" element={<PathLogger />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('path')).toHaveTextContent('/todos')
  })
})

// ─── 인증 상태 변경 후 라우팅 ─────────────────────────────────────────────────

describe('인증 상태 변경 후 라우팅', () => {
  it('clearAuth 후 ProtectedRoute 재진입 시 /login으로 이동한다', async () => {
    useAuthStore.setState({ accessToken: 'token', isAuthenticated: true })

    const { rerender } = render(
      <MemoryRouter initialEntries={['/todos']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/todos" element={<div data-testid="todos">todos</div>} />
          </Route>
          <Route path="/login" element={<div data-testid="login">login</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('todos')).toBeInTheDocument()

    useAuthStore.setState({ accessToken: null, isAuthenticated: false })
    rerender(
      <MemoryRouter initialEntries={['/todos']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/todos" element={<div data-testid="todos">todos</div>} />
          </Route>
          <Route path="/login" element={<div data-testid="login">login</div>} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('login')).toBeInTheDocument()
    })
  })
})
