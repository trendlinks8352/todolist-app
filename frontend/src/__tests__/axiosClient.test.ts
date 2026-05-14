// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import axiosClient from '@/api/axiosClient'
import { useAuthStore } from '@/store/authStore'

let mock: AxiosMockAdapter

beforeEach(() => {
  mock = new AxiosMockAdapter(axiosClient)
  useAuthStore.setState({ accessToken: null, user: null, isAuthenticated: false })
})

afterEach(() => {
  mock.restore()
  vi.unstubAllGlobals()
})

describe('요청 인터셉터 — Authorization 헤더 주입', () => {
  it('accessToken이 있으면 Authorization: Bearer 헤더를 자동으로 추가한다', async () => {
    useAuthStore.setState({ accessToken: 'my-token', isAuthenticated: true })

    let capturedAuth: string | undefined
    mock.onGet('/api/test').reply((config) => {
      capturedAuth = config.headers?.['Authorization'] as string
      return [200, { ok: true }]
    })

    await axiosClient.get('/api/test')
    expect(capturedAuth).toBe('Bearer my-token')
  })

  it('accessToken이 없으면 Authorization 헤더를 추가하지 않는다', async () => {
    let capturedAuth: string | undefined
    mock.onGet('/api/test').reply((config) => {
      capturedAuth = config.headers?.['Authorization'] as string
      return [200, {}]
    })

    await axiosClient.get('/api/test')
    expect(capturedAuth).toBeUndefined()
  })

  it('localStorage를 조회하지 않는다 (토큰은 Zustand 메모리에만 저장)', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
    mock.onGet('/api/test').reply(200, {})
    axiosClient.get('/api/test')
    expect(getItemSpy).not.toHaveBeenCalled()
  })
})

describe('응답 인터셉터 — 401 처리', () => {
  it('401 응답 시 clearAuth()가 호출되어 accessToken이 null이 된다', async () => {
    useAuthStore.setState({ accessToken: 'expired-token', isAuthenticated: true })
    vi.stubGlobal('location', { href: '' })

    mock.onGet('/api/protected').reply(401, {
      error: { code: 'UNAUTHORIZED', message: '토큰이 만료되었습니다.' },
    })

    try {
      await axiosClient.get('/api/protected')
    } catch {}

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('401 응답 시 window.location.href가 /login으로 변경된다', async () => {
    const locationMock = { href: '' }
    vi.stubGlobal('location', locationMock)

    mock.onGet('/api/protected').reply(401, {
      error: { code: 'UNAUTHORIZED', message: '인증 필요' },
    })

    try {
      await axiosClient.get('/api/protected')
    } catch {}

    expect(locationMock.href).toBe('/login')
  })
})

describe('응답 인터셉터 — ApiError 형식 변환', () => {
  it('404 에러가 ApiError 형식으로 reject된다', async () => {
    mock.onGet('/api/todos/999').reply(404, {
      error: { code: 'NOT_FOUND', message: '리소스를 찾을 수 없습니다.' },
    })

    try {
      await axiosClient.get('/api/todos/999')
      expect.fail('에러가 발생해야 합니다')
    } catch (err: unknown) {
      const e = err as { status: number; code: string; message: string; fields: unknown[] }
      expect(e.status).toBe(404)
      expect(e.code).toBe('NOT_FOUND')
      expect(e.message).toBe('리소스를 찾을 수 없습니다.')
      expect(e.fields).toEqual([])
    }
  })

  it('422 에러에 fields 배열이 포함된다', async () => {
    mock.onPost('/api/todos').reply(422, {
      error: {
        code: 'VALIDATION_ERROR',
        message: '입력값이 유효하지 않습니다.',
        fields: [{ field: 'title', message: '제목은 필수입니다.' }],
      },
    })

    try {
      await axiosClient.post('/api/todos', {})
      expect.fail('에러가 발생해야 합니다')
    } catch (err: unknown) {
      const e = err as { status: number; code: string; fields: { field: string; message: string }[] }
      expect(e.status).toBe(422)
      expect(e.code).toBe('VALIDATION_ERROR')
      expect(e.fields).toHaveLength(1)
      expect(e.fields[0].field).toBe('title')
    }
  })

  it('409 에러가 ApiError 형식으로 처리된다', async () => {
    mock.onPost('/api/auth/register').reply(409, {
      error: { code: 'CONFLICT', message: '이미 사용 중인 이메일입니다.' },
    })

    try {
      await axiosClient.post('/api/auth/register', {})
    } catch (err: unknown) {
      const e = err as { status: number; code: string; message: string }
      expect(e.status).toBe(409)
      expect(e.code).toBe('CONFLICT')
      expect(e.message).toBe('이미 사용 중인 이메일입니다.')
    }
  })

  it('응답 본문이 없는 에러는 기본값으로 채워진다', async () => {
    mock.onGet('/api/test').networkError()

    try {
      await axiosClient.get('/api/test')
    } catch (err: unknown) {
      const e = err as { status: number; code: string; message: string; fields: unknown[] }
      expect(e.status).toBe(0)
      expect(e.code).toBe('INTERNAL_ERROR')
      expect(e.fields).toEqual([])
    }
  })
})

describe('axiosClient 기본 설정', () => {
  it('timeout이 10000ms로 설정되어 있다', () => {
    expect(axiosClient.defaults.timeout).toBe(10000)
  })

  it('Content-Type 헤더가 application/json이다', () => {
    expect(axiosClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
