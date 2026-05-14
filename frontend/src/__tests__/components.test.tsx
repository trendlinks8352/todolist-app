// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/Common/Button'
import { Input } from '@/components/Common/Input'
import { Modal } from '@/components/Common/Modal'
import { Toast } from '@/components/Common/Toast'
import { Spinner } from '@/components/Common/Spinner'
import { Checkbox } from '@/components/Common/Checkbox'
import { Dropdown } from '@/components/Common/Dropdown'
import { useUIStore } from '@/store/uiStore'

beforeEach(() => {
  useUIStore.setState({ isModalOpen: false, modalType: null, selectedTodoId: null, toast: null })
})

// ─── Button ───────────────────────────────────────────────────────────────────

describe('Button', () => {
  it('children을 렌더링한다', () => {
    render(<Button>저장</Button>)
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('primary variant 클래스를 포함한다', () => {
    render(<Button variant="primary">버튼</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-primary')
  })

  it('secondary variant 클래스를 포함한다', () => {
    render(<Button variant="secondary">버튼</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-secondary')
  })

  it('danger variant 클래스를 포함한다', () => {
    render(<Button variant="danger">버튼</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-danger')
  })

  it('sm/md/lg size 클래스를 포함한다', () => {
    const { rerender } = render(<Button size="sm">버튼</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-sm')
    rerender(<Button size="lg">버튼</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-lg')
  })

  it('loading=true 시 aria-busy가 true이고 disabled된다', () => {
    render(<Button loading>저장 중</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })

  it('loading=true 시 Spinner가 표시된다', () => {
    render(<Button loading>저장 중</Button>)
    expect(screen.getByRole('status', { name: '로딩 중' })).toBeInTheDocument()
  })

  it('disabled=true 시 버튼이 비활성화된다', () => {
    render(<Button disabled>버튼</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('onClick 핸들러가 호출된다', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>클릭</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('disabled 상태에서 onClick이 호출되지 않는다', async () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>버튼</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})

// ─── Input ────────────────────────────────────────────────────────────────────

describe('Input', () => {
  it('label을 렌더링한다', () => {
    render(<Input label="이메일" />)
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
  })

  it('error 메시지를 렌더링한다', () => {
    render(<Input label="이메일" error="이메일 형식이 올바르지 않습니다." />)
    expect(screen.getByRole('alert')).toHaveTextContent('이메일 형식이 올바르지 않습니다.')
  })

  it('error가 있을 때 aria-invalid가 true다', () => {
    render(<Input label="이메일" error="오류" />)
    expect(screen.getByLabelText('이메일')).toHaveAttribute('aria-invalid', 'true')
  })

  it('error가 없을 때 aria-invalid가 false다', () => {
    render(<Input label="이메일" />)
    expect(screen.getByLabelText('이메일')).toHaveAttribute('aria-invalid', 'false')
  })

  it('ref 포워딩이 동작한다', () => {
    const ref = { current: null as HTMLInputElement | null }
    render(<Input ref={ref} label="이름" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('label 없이도 렌더링된다', () => {
    render(<Input placeholder="입력" />)
    expect(screen.getByPlaceholderText('입력')).toBeInTheDocument()
  })
})

// ─── Modal ────────────────────────────────────────────────────────────────────

describe('Modal', () => {
  it('isOpen=false 시 렌더링되지 않는다', () => {
    render(<Modal isOpen={false} onClose={vi.fn()}>내용</Modal>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('isOpen=true 시 렌더링된다', () => {
    render(<Modal isOpen onClose={vi.fn()}>내용</Modal>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('title이 표시된다', () => {
    render(<Modal isOpen onClose={vi.fn()} title="할일 등록">내용</Modal>)
    expect(screen.getByText('할일 등록')).toBeInTheDocument()
  })

  it('children이 표시된다', () => {
    render(<Modal isOpen onClose={vi.fn()}>모달 내용</Modal>)
    expect(screen.getByText('모달 내용')).toBeInTheDocument()
  })

  it('닫기 버튼 클릭 시 onClose가 호출된다', async () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose}>내용</Modal>)
    await userEvent.click(screen.getByLabelText('닫기'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ESC 키 입력 시 onClose가 호출된다', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose}>내용</Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('오버레이 클릭 시 onClose가 호출된다', async () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose}>내용</Modal>)
    await userEvent.click(screen.getByTestId('modal-overlay'))
    expect(onClose).toHaveBeenCalled()
  })

  it('패널 클릭 시 onClose가 호출되지 않는다', async () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose}>내용</Modal>)
    await userEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('isOpen=true 시 body.style.overflow가 hidden으로 설정된다', () => {
    render(<Modal isOpen onClose={vi.fn()}>내용</Modal>)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('isOpen이 false로 변경되면 body.style.overflow가 복원된다', () => {
    const { rerender } = render(<Modal isOpen onClose={vi.fn()}>내용</Modal>)
    expect(document.body.style.overflow).toBe('hidden')
    rerender(<Modal isOpen={false} onClose={vi.fn()}>내용</Modal>)
    expect(document.body.style.overflow).toBe('')
  })
})

// ─── Toast ────────────────────────────────────────────────────────────────────

describe('Toast', () => {
  it('uiStore에 toast가 없으면 렌더링되지 않는다', () => {
    render(<Toast />)
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
  })

  it('uiStore에 toast가 있으면 메시지를 표시한다', () => {
    useUIStore.getState().showToast('저장되었습니다.', 'success')
    render(<Toast />)
    expect(screen.getByTestId('toast')).toHaveTextContent('저장되었습니다.')
  })

  it('toast type이 data 속성에 반영된다', () => {
    useUIStore.getState().showToast('오류 발생', 'error')
    render(<Toast />)
    expect(screen.getByTestId('toast')).toHaveAttribute('data-type', 'error')
  })

  it('duration 이후 자동으로 사라진다', async () => {
    vi.useFakeTimers()
    useUIStore.getState().showToast('잠깐만', 'info', 500)
    render(<Toast />)
    expect(screen.getByTestId('toast')).toBeInTheDocument()

    await act(async () => { vi.advanceTimersByTime(500) })

    expect(useUIStore.getState().toast).toBeNull()
    vi.useRealTimers()
  })

  it('role="status"와 aria-live="polite"가 있다', () => {
    useUIStore.getState().showToast('메시지', 'info')
    render(<Toast />)
    const toast = screen.getByTestId('toast')
    expect(toast).toHaveAttribute('role', 'status')
    expect(toast).toHaveAttribute('aria-live', 'polite')
  })
})

// ─── Spinner ──────────────────────────────────────────────────────────────────

describe('Spinner', () => {
  it('role="status"와 aria-label="로딩 중"이 있다', () => {
    render(<Spinner />)
    expect(screen.getByRole('status', { name: '로딩 중' })).toBeInTheDocument()
  })

  it('기본 size는 md다', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toHaveClass('spinner-md')
  })

  it('sm/lg size를 지정할 수 있다', () => {
    const { rerender } = render(<Spinner size="sm" />)
    expect(screen.getByRole('status')).toHaveClass('spinner-sm')
    rerender(<Spinner size="lg" />)
    expect(screen.getByRole('status')).toHaveClass('spinner-lg')
  })
})

// ─── Checkbox ─────────────────────────────────────────────────────────────────

describe('Checkbox', () => {
  it('label이 렌더링된다', () => {
    render(<Checkbox checked={false} onChange={vi.fn()} label="완료" />)
    expect(screen.getByLabelText('완료')).toBeInTheDocument()
  })

  it('checked 상태가 반영된다', () => {
    render(<Checkbox checked={true} onChange={vi.fn()} label="완료" />)
    expect(screen.getByLabelText('완료')).toBeChecked()
  })

  it('클릭 시 onChange가 호출된다', async () => {
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} label="완료" />)
    await userEvent.click(screen.getByLabelText('완료'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('disabled 시 입력이 비활성화된다', () => {
    render(<Checkbox checked={false} onChange={vi.fn()} label="완료" disabled />)
    expect(screen.getByLabelText('완료')).toBeDisabled()
  })
})

// ─── Dropdown ─────────────────────────────────────────────────────────────────

describe('Dropdown', () => {
  const options = [
    { value: 'general', label: '일반' },
    { value: 'work', label: '업무' },
    { value: 'personal', label: '개인' },
  ]

  it('placeholder가 표시된다', () => {
    render(<Dropdown options={options} onChange={vi.fn()} placeholder="카테고리 선택" />)
    expect(screen.getByText('카테고리 선택')).toBeInTheDocument()
  })

  it('모든 옵션이 렌더링된다', () => {
    render(<Dropdown options={options} onChange={vi.fn()} />)
    expect(screen.getByText('일반')).toBeInTheDocument()
    expect(screen.getByText('업무')).toBeInTheDocument()
    expect(screen.getByText('개인')).toBeInTheDocument()
  })

  it('value가 선택된 option에 반영된다', () => {
    render(<Dropdown options={options} value="work" onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toHaveValue('work')
  })

  it('선택 변경 시 onChange가 호출된다', async () => {
    const onChange = vi.fn()
    render(<Dropdown options={options} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'personal')
    expect(onChange).toHaveBeenCalledWith('personal')
  })

  it('disabled 시 비활성화된다', () => {
    render(<Dropdown options={options} onChange={vi.fn()} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})
