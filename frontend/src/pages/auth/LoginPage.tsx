import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLogin } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { Input } from '@/components/Common/Input'
import { Button } from '@/components/Common/Button'
import type { ApiError } from '@/types/api'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(v: string): string | undefined {
  if (!v.trim()) return '이메일을 입력해주세요.'
  if (!EMAIL_REGEX.test(v)) return '올바른 이메일 형식이 아닙니다.'
}

function validatePassword(v: string): string | undefined {
  if (!v) return '비밀번호를 입력해주세요.'
}

export default function LoginPage() {
  const login = useLogin()
  const showToast = useUIStore((s) => s.showToast)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)

    if (emailErr || passwordErr) {
      setErrors({ email: emailErr, password: passwordErr })
      return
    }
    setErrors({})
    login.mutate(
      { email, password },
      {
        onError: (error: unknown) => {
          const err = error as ApiError
          if (err?.status === 401) {
            showToast('이메일 또는 비밀번호가 올바르지 않습니다.', 'error')
          } else {
            showToast(err?.message ?? '로그인 중 오류가 발생했습니다.', 'error')
          }
        },
      },
    )
  }

  return (
    <div className="auth-page">
      {/* ── 왼쪽: 로그인 폼 ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-brand">
            <div className="auth-brand-icon">✓</div>
            <span className="auth-brand-name">TodoListApp</span>
          </div>

          <h1 className="auth-heading">다시 오셨군요!</h1>
          <p className="auth-subheading">
            계정에 로그인하여 오늘의 할일을 확인하세요.
          </p>

          <form onSubmit={handleSubmit} noValidate data-testid="login-form">
            <div className="auth-fields">
              <Input
                label="이메일 주소"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="example@example.com"
                autoComplete="email"
                data-testid="email-input"
              />
              <Input
                label="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                data-testid="password-input"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              loading={login.isPending}
              className="auth-submit-btn"
              data-testid="login-submit"
            >
              로그인
            </Button>
          </form>

          <p className="auth-link-text">
            계정이 없으신가요?{' '}
            <Link to="/signup" data-testid="signup-link">
              회원가입하기
            </Link>
          </p>
        </div>
      </div>

      {/* ── 오른쪽: 데코 패널 ── */}
      <div className="auth-deco-panel">
        <div className="auth-deco-content">
          <div className="auth-deco-badge">생산성을 높이세요</div>
          <h2 className="auth-deco-headline">
            할일을 <em>체계적으로</em><br />관리하는 방법
          </h2>
          <p className="auth-deco-desc">
            카테고리별 분류, 마감일 추적, 완료 현황 파악까지.
            <br />
            복잡한 할일도 깔끔하게 정리하세요.
          </p>
          <div className="auth-deco-features">
            <div className="auth-deco-feature">
              <div className="auth-deco-feature-icon">📂</div>
              카테고리별 할일 분류 관리
            </div>
            <div className="auth-deco-feature">
              <div className="auth-deco-feature-icon">📅</div>
              마감일 기반 필터링
            </div>
            <div className="auth-deco-feature">
              <div className="auth-deco-feature-icon">✅</div>
              완료 현황 실시간 추적
            </div>
          </div>
        </div>

        <div className="auth-deco-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
            오늘의 할일
          </div>
          {[
            { text: '기획서 초안 작성', done: true },
            { text: '팀 미팅 준비', done: false },
            { text: '코드 리뷰', done: false },
          ].map((item, i) => (
            <div className="auth-deco-card-item" key={i}>
              <div className={`auth-deco-card-dot${item.done ? ' done' : ''}`} />
              <span className={`auth-deco-card-text${item.done ? ' done' : ''}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
