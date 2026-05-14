import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSignup } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { Input } from '@/components/Common/Input'
import { Button } from '@/components/Common/Button'
import type { ApiError } from '@/types/api'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateName(v: string): string | undefined {
  if (!v.trim()) return '이름을 입력해주세요.'
  if (v.trim().length > 100) return '이름은 100자 이하여야 합니다.'
}
function validateEmail(v: string): string | undefined {
  if (!v.trim()) return '이메일을 입력해주세요.'
  if (!EMAIL_REGEX.test(v)) return '올바른 이메일 형식이 아닙니다.'
}
function validatePassword(v: string): string | undefined {
  if (!v) return '비밀번호를 입력해주세요.'
  if (v.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.'
  if (!/[a-zA-Z]/.test(v)) return '비밀번호에 영문자를 포함해야 합니다.'
  if (!/[0-9]/.test(v)) return '비밀번호에 숫자를 포함해야 합니다.'
}
function validateConfirm(pw: string, confirm: string): string | undefined {
  if (!confirm) return '비밀번호 확인을 입력해주세요.'
  if (pw !== confirm) return '비밀번호가 일치하지 않습니다.'
}

export default function SignupPage() {
  const signup = useSignup()
  const showToast = useUIStore((s) => s.showToast)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{
    name?: string; email?: string; password?: string; confirm?: string
  }>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nameErr    = validateName(name)
    const emailErr   = validateEmail(email)
    const passwordErr = validatePassword(password)
    const confirmErr  = validateConfirm(password, confirm)

    if (nameErr || emailErr || passwordErr || confirmErr) {
      setErrors({ name: nameErr, email: emailErr, password: passwordErr, confirm: confirmErr })
      return
    }
    setErrors({})
    signup.mutate(
      { name: name.trim(), email, password },
      {
        onError: (error: unknown) => {
          const err = error as ApiError
          if (err?.status === 409) {
            showToast('이미 사용 중인 이메일입니다.', 'error')
          } else {
            showToast(err?.message ?? '회원가입 중 오류가 발생했습니다.', 'error')
          }
        },
      },
    )
  }

  return (
    <div className="auth-page">
      {/* ── 왼쪽: 회원가입 폼 ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-brand">
            <div className="auth-brand-icon">✓</div>
            <span className="auth-brand-name">TodoListApp</span>
          </div>

          <h1 className="auth-heading">시작해볼까요?</h1>
          <p className="auth-subheading">
            무료로 계정을 만들고 할일 관리를 시작하세요.
          </p>

          <form onSubmit={handleSubmit} noValidate data-testid="signup-form">
            <div className="auth-fields">
              <Input
                label="이름"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                placeholder="홍길동"
                autoComplete="name"
                data-testid="name-input"
              />
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
                placeholder="최소 8자, 영문+숫자 포함"
                autoComplete="new-password"
                data-testid="password-input"
              />
              <Input
                label="비밀번호 확인"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={errors.confirm}
                placeholder="비밀번호를 다시 입력하세요"
                autoComplete="new-password"
                data-testid="confirm-input"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              loading={signup.isPending}
              className="auth-submit-btn"
              data-testid="signup-submit"
            >
              가입하기
            </Button>
          </form>

          <p className="auth-link-text">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" data-testid="login-link">
              로그인하기
            </Link>
          </p>
        </div>
      </div>

      {/* ── 오른쪽: 데코 패널 ── */}
      <div className="auth-deco-panel">
        <div className="auth-deco-content">
          <div className="auth-deco-badge">지금 무료로 시작</div>
          <h2 className="auth-deco-headline">
            업무와 일상을<br /><em>한 곳에서</em> 관리
          </h2>
          <p className="auth-deco-desc">
            복잡한 할일도, 간단한 메모도 한 곳에서.
            <br />
            카테고리와 마감일로 완벽하게 정리하세요.
          </p>
          <div className="auth-deco-features">
            <div className="auth-deco-feature">
              <div className="auth-deco-feature-icon">🏷️</div>
              사용자 정의 카테고리
            </div>
            <div className="auth-deco-feature">
              <div className="auth-deco-feature-icon">🔍</div>
              강력한 필터 & 검색
            </div>
            <div className="auth-deco-feature">
              <div className="auth-deco-feature-icon">📱</div>
              어디서나 반응형 접근
            </div>
          </div>
        </div>

        <div className="auth-deco-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
            이번 주 진행률
          </div>
          {[
            { text: '업무 보고서 제출', done: true },
            { text: '팀 스프린트 계획', done: true },
            { text: '포트폴리오 업데이트', done: false },
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
