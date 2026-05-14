# TodoListApp 프론트엔드 스타일 가이드

---

## 문서 정보

| 항목 | 내용 |
|------|------|
| 버전 | v2.0 |
| 작성일 | 2026-05-14 |
| 최종 수정일 | 2026-05-14 |
| 작성자 | HEOTAEHWAN |
| 참조 | 실제 구현 코드 기준 (index.css v2.0) |
| 대상 | 프론트엔드 개발자 |

### 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|---------|
| v1.0 | 2026-05-14 | 최초 작성 — Todoist 스크린샷 기반 |
| v2.0 | 2026-05-14 | 실제 구현 코드 반영, 인증 화면 Split-Panel 레이아웃, 전체 CSS 시스템 재정의 |

---

## 목차

1. [색상 시스템](#1-색상-시스템)
2. [타이포그래피](#2-타이포그래피)
3. [간격 및 레이아웃 토큰](#3-간격-및-레이아웃-토큰)
4. [컴포넌트 스타일](#4-컴포넌트-스타일)
5. [페이지 레이아웃](#5-페이지-레이아웃)
6. [반응형 기준점](#6-반응형-기준점)

---

## 1. 색상 시스템

### 1.1 브랜드 컬러

| 이름 | CSS 변수 | HEX | 용도 |
|------|---------|-----|------|
| Primary | `--color-primary` | `#DB4035` | CTA 버튼, 로고, 강조 텍스트 |
| Primary Hover | `--color-primary-hover` | `#C0392B` | 버튼 hover |
| Primary Dark | `--color-primary-dark` | `#A93226` | 버튼 active |
| Primary Light | `--color-primary-light` | `#FDECEA` | 배경 강조 |
| Primary Mid | `--color-primary-mid` | `#F5A49F` | 데코 패널 하이라이트 |

### 1.2 중립 컬러 (Neutral)

| 이름 | CSS 변수 | HEX | 용도 |
|------|---------|-----|------|
| Gray 950 | `--color-gray-950` | `#0F0F0F` | 최고 명도 텍스트 |
| Gray 900 | `--color-gray-900` | `#1A1A1A` | 주요 제목 |
| Gray 800 | `--color-gray-800` | `#2C2C2C` | 서브 제목 |
| Gray 700 | `--color-gray-700` | `#404040` | 본문 텍스트 |
| Gray 600 | `--color-gray-600` | `#595959` | 보조 텍스트 |
| Gray 500 | `--color-gray-500` | `#808080` | 힌트, placeholder |
| Gray 400 | `--color-gray-400` | `#A0A0A0` | 비활성 텍스트 |
| Gray 300 | `--color-gray-300` | `#C8C8C8` | 구분선, 비활성 |
| Gray 200 | `--color-gray-200` | `#E2E2E2` | 테두리 기본 |
| Gray 100 | `--color-gray-100` | `#F5F5F5` | 배경 |
| Gray 50  | `--color-gray-50`  | `#FAFAFA` | 입력 필드 배경 |
| White    | `--color-white`    | `#FFFFFF` | 카드, 폼 배경 |

### 1.3 배경 컬러

| 이름 | CSS 변수 | HEX | 용도 |
|------|---------|-----|------|
| BG App | `--color-bg-app` | `#F7F5F3` | 앱 전체 배경 |
| BG Warm | `--color-bg-warm` | `#F9EEEB` | 인증 우측 패널 |
| BG Warm Deep | `--color-bg-warm-deep` | `#F0D9D3` | 그라디언트 하단 |

### 1.4 상태 컬러

| 이름 | CSS 변수 | HEX | 용도 |
|------|---------|-----|------|
| Success | `--color-success` | `#059669` | 완료 상태, 성공 Toast |
| Error | `--color-error` | `#DB4035` | 에러 메시지, 에러 Toast |
| Warning | `--color-warning` | `#D97706` | 경고 |
| Info | `--color-info` | `#2563EB` | 정보 Toast |

### 1.5 태그 컬러

| 이름 | CSS 변수 | HEX | 용도 |
|------|---------|-----|------|
| Tag Purple | `--color-tag-purple` | `#7C3AED` | 날짜 메타 태그 |
| Tag Green | `--color-tag-green` | `#059669` | 오늘/기한 태그 |
| Tag Blue | `--color-tag-blue` | `#2563EB` | 기타 메타 태그 |

### 1.6 CSS 변수 전체 선언

```css
:root {
  /* Brand */
  --color-primary:       #DB4035;
  --color-primary-hover: #C0392B;
  --color-primary-dark:  #A93226;
  --color-primary-light: #FDECEA;
  --color-primary-mid:   #F5A49F;

  /* Neutral */
  --color-gray-950: #0F0F0F;
  --color-gray-900: #1A1A1A;
  --color-gray-700: #404040;
  --color-gray-500: #808080;
  --color-gray-300: #C8C8C8;
  --color-gray-200: #E2E2E2;
  --color-gray-100: #F5F5F5;
  --color-gray-50:  #FAFAFA;
  --color-white:    #FFFFFF;

  /* Background */
  --color-bg-app:  #F7F5F3;

  /* Status */
  --color-success: #059669;
  --color-error:   #DB4035;
  --color-warning: #D97706;
  --color-info:    #2563EB;
}
```

---

## 2. 타이포그래피

### 2.1 폰트 패밀리

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif;
```

한글 UI에 최적화된 시스템 폰트 스택. 별도 웹폰트 불필요.

### 2.2 타입 스케일

| 역할 | 크기 | 굵기 | line-height | 용도 |
|------|------|------|-------------|------|
| Auth Heading | `1.75rem` (28px) | 700 | 1.2 | 인증 화면 제목 |
| Heading 1 | `1.5rem` (24px) | 700 | 1.3 | 섹션 제목 |
| Heading 2 | `1.125rem` (18px) | 600 | 1.4 | 카드 제목, 모달 제목 |
| Body | `1rem` (16px) | 400 | 1.6 | 기본 본문 |
| Body Small | `0.9375rem` (15px) | 400 | 1.5 | 입력 필드 텍스트 |
| Caption | `0.875rem` (14px) | 400/500 | 1.4 | 레이블, 버튼, 보조 텍스트 |
| Micro | `0.8125rem` (13px) | 500 | 1.4 | 필드 레이블, 배지 |
| Tiny | `0.75rem` (12px) | 400 | 1.4 | 에러 메시지, 힌트 |

---

## 3. 간격 및 레이아웃 토큰

### 3.1 간격 스케일 (4px 기준)

| 토큰 | 값 | 용도 |
|------|----|------|
| `--space-1` | `4px` | 아이콘-텍스트 간격 |
| `--space-2` | `8px` | 인라인 요소 간격 |
| `--space-3` | `12px` | 패딩 소형 |
| `--space-4` | `16px` | 기본 컴포넌트 간격 |
| `--space-5` | `20px` | 섹션 내 간격 |
| `--space-6` | `24px` | 카드 패딩 |
| `--space-8` | `32px` | 섹션 간격 |
| `--space-10` | `40px` | 페이지 패딩 |
| `--space-12` | `48px` | 대형 섹션 간격 |
| `--space-16` | `64px` | 페이지 상단 여백 |

### 3.2 Border Radius

| 토큰 | 값 | 용도 |
|------|----|------|
| `--radius-sm` | `4px` | 배지, 태그 |
| `--radius-md` | `8px` | 입력 필드, 버튼 |
| `--radius-lg` | `12px` | 카드 기본 |
| `--radius-xl` | `16px` | 모달, Todo 카드 |
| `--radius-2xl` | `24px` | 인증 카드 |
| `--radius-full` | `9999px` | 체크박스, 아바타, 배지 |

### 3.3 Shadow

```css
--shadow-xs:         0 1px 2px rgba(0,0,0,0.05);
--shadow-sm:         0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md:         0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05);
--shadow-lg:         0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04);
--shadow-xl:         0 20px 25px rgba(0,0,0,0.10), 0 10px 10px rgba(0,0,0,0.04);
--shadow-modal:      0 25px 50px rgba(0,0,0,0.15);
--shadow-card:       0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
--shadow-card-hover: 0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06);
```

### 3.4 Transition

```css
--transition-fast: 0.10s ease;   /* hover 상태 전환 */
--transition-base: 0.15s ease;   /* 기본 인터랙션 */
--transition-slow: 0.25s ease;   /* 모달, 패널 전환 */
```

---

## 4. 컴포넌트 스타일

### 4.1 버튼 (Button)

```css
/* 공통 — 터치 타겟 최소 44px */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-size: 0.875rem;
  font-weight: 600;
  border: 1.5px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, box-shadow 0.15s;
}

/* Sizes */
.btn-sm { height: 32px; padding: 0 12px; font-size: 0.8125rem; }
.btn-md { height: 44px; padding: 0 20px; }
.btn-lg { height: 52px; padding: 0 32px; font-size: 1rem; }

/* Primary */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px rgba(219,64,53,0.35);
}

/* Secondary */
.btn-secondary {
  background: var(--color-white);
  color: var(--color-gray-700);
  border-color: var(--color-gray-200);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
}

/* Danger */
.btn-danger {
  background: var(--color-primary);
  color: var(--color-white);
}
```

### 4.2 입력 필드 (Input)

```css
.input-group { display: flex; flex-direction: column; gap: 4px; }

.input-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-gray-700);
}

.input-field {
  width: 100%;
  height: 44px;
  padding: 0 var(--space-4);
  font-size: 0.9375rem;
  color: var(--color-gray-900);
  background: var(--color-white);
  border: 1.5px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input-field:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(219,64,53,0.12);
}
.input-field.error {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(219,64,53,0.10);
}

.input-error-msg {
  font-size: 0.75rem;
  color: var(--color-error);
}
.input-error-msg::before { content: '⚠ '; }
```

### 4.3 할일 카드 (TodoItem)

```css
.todo-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-xl);  /* 16px */
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.15s, border-color 0.15s;
}
.todo-card:hover {
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-gray-300);
}

/* 완료 토글 버튼 (원형) */
.checkbox-input {
  width: 18px; height: 18px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-gray-300);
}
.checkbox-input:checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

/* 완료된 제목 */
.todo-title.completed {
  text-decoration: line-through;
  color: var(--color-gray-400);
}

/* 메타 태그 (날짜/카테고리) */
.todo-category-label {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 8px;
  background: var(--color-gray-100);
  border-radius: var(--radius-full);
}
```

### 4.4 Toast

```css
.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-white);
  box-shadow: var(--shadow-xl);
  z-index: 9999;
  animation: toast-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-success { background: var(--color-success); }
.toast-error   { background: var(--color-error);   }
.toast-info    { background: var(--color-info);     }

@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.95); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}
```

### 4.5 모달 (Modal)

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: overlay-in 0.15s ease;
}

.modal-panel {
  width: 100%;
  max-width: 480px;
  background: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-modal);
  animation: modal-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.92) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
```

### 4.6 Dropdown

```css
.dropdown-select {
  height: 44px;
  padding: 0 36px 0 16px;
  background-image: url("chevron-down SVG");
  background-repeat: no-repeat;
  background-position: right 12px center;
  appearance: none;  /* 네이티브 화살표 제거 */
  border: 1.5px solid var(--color-gray-200);
  border-radius: var(--radius-md);
}
.dropdown-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(219,64,53,0.12);
}
```

---

## 5. 페이지 레이아웃

### 5.1 인증 화면 — Split Panel Layout

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ┌─────────────────────────────┐ ┌─────────────────────┐   │
│   │                             │ │ ◉◉◉  (gradient)     │   │
│   │  ✓  TodoListApp            │ │                     │   │
│   │                             │ │  "할일을 체계적으로  │   │
│   │  다시 오셨군요!              │ │   관리하는 방법"     │   │
│   │  계정에 로그인하여 ...       │ │                     │   │
│   │                             │ │  ✦ 카테고리 분류    │   │
│   │  [이메일 주소 입력창]        │ │  ✦ 마감일 필터링   │   │
│   │  [비밀번호 입력창]          │ │  ✦ 완료 추적        │   │
│   │                             │ │                     │   │
│   │  [로그인 버튼]              │ │  ┌───────────────┐  │   │
│   │                             │ │  │ 오늘의 할일   │  │   │
│   │  계정이 없으신가요? 회원가입 │ │  │ • 기획서 작성 │  │   │
│   │                             │ │  │ ○ 팀 미팅 준비│  │   │
│   └─────────────────────────────┘ └─────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**좌측 패널 (auth-form-panel):**
- 흰색 배경
- 세로 중앙 정렬, 최대 너비 400px
- 브랜드 로고 → 제목 → 부제목 → 폼 → 링크 순

**우측 패널 (auth-deco-panel):**
- 어두운-레드 그라디언트: `linear-gradient(145deg, #2C1810 0%, #5C2419 35%, #DB4035 70%, #F5A49F 100%)`
- Glassmorphism floating card 장식
- 텍스트 색상: `rgba(255,255,255,0.85)`
- 강조 텍스트(`em`): `#FFC9C5`

```css
.auth-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}

.auth-deco-panel {
  background: linear-gradient(145deg, #2C1810 0%, #5C2419 35%, #DB4035 70%, #F5A49F 100%);
}
```

### 5.2 할일 목록 화면

```
┌──────────────────────────────────────────────────────────────┐
│ ✓ TodoListApp          👤 홍길동  [로그아웃]  [회원 탈퇴]   │  ← sticky 헤더
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   📋 할일 관리                                               │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ [카테고리 ▼]  [완료여부 ▼]  [시작일]~[종료일]  [초기화]│  │  ← 필터 바
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ ○ 프로젝트 기획서 작성          [업무] 05-30 [수정][삭]│  │
│   └──────────────────────────────────────────────────────┘  │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ ✓ 팀 회의 준비 (완료)            [일반]    [수정][삭]  │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│                                         [+ 새로운 할일 등록] │  ← FAB 버튼
└──────────────────────────────────────────────────────────────┘
```

**헤더 (todo-header):**
- `position: sticky; top: 0; backdrop-filter: blur(12px)`
- 높이: 60px
- 브랜드 아이콘(빨간 박스 안 체크) + 앱명 + 사용자 배지 + 버튼

**할일 추가 버튼 (todo-add-btn):**
- Fixed positioning, 우하단
- `border-radius: full`, 긴 알약 모양
- `box-shadow: 0 4px 20px rgba(219,64,53,0.4)` (발광 효과)

---

## 6. 반응형 기준점

| 분류 | 기준 | 주요 변경점 |
|------|------|---------|
| **Mobile** | `≤ 767px` | Split Panel → 단일 컬럼(데코 패널 숨김), 필터 세로 스택, FAB 전체 너비 |
| **Tablet** | `768px ~ 1023px` | Split Panel 유지 (좌측만 표시), 헤더 슬림 |
| **Desktop** | `≥ 1024px` | 전체 레이아웃 표시, Split Panel 50/50 |

```css
/* 모바일: 데코 패널 숨김 */
@media (max-width: 1023px) {
  .auth-page { grid-template-columns: 1fr; }
  .auth-deco-panel { display: none; }
}

/* 모바일: 할일 추가 버튼 전체 너비 */
@media (max-width: 767px) {
  .todo-add-btn {
    left: 20px;
    right: 20px;
    width: calc(100% - 40px);
    border-radius: var(--radius-xl) !important;
  }
}
```

---

## 7. 애니메이션 패턴

| 컴포넌트 | 애니메이션 | 특징 |
|---------|-----------|------|
| Modal 진입 | `modal-in` | `scale(0.92) → scale(1)` + `spring cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Overlay | `overlay-in` | `opacity: 0 → 1`, `0.15s ease` |
| Toast | `toast-in` | `translateY(12px) scale(0.95) → 0 scale(1)` + spring |
| 버튼 hover | CSS transition | `box-shadow` 강조로 눌리는 느낌 |
| Todo card hover | CSS transition | `border-color + box-shadow` 변화 |

Spring easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` — 약간 overshooting되는 자연스러운 바운스

---

## 8. 접근성 체크리스트

| 항목 | 구현 방법 |
|------|---------|
| 터치 타겟 최소 44×44px | `.btn-md` h:44px, `.input-field` h:44px, `.checkbox-input` 44px wrapper |
| 키보드 포커스 | `:focus-visible` 2px primary 링 |
| 에러 연결 | `aria-invalid + aria-describedby → role="alert"` |
| 모달 접근성 | `role="dialog" + aria-modal + aria-label` |
| 로딩 상태 | `aria-busy="true" + disabled` |
| 스크린리더 전용 텍스트 | `.sr-only` 클래스 |
| 색상 명도 대비 | Primary(`#DB4035`) on White: 4.7:1 (WCAG AA 통과) |

---

*최종 수정일: 2026-05-14 | 버전: v2.0 | 참조: 실제 구현 코드 (index.css v2.0, LoginPage.tsx, SignupPage.tsx)*
