'use strict';

// ------------------------------------------------------------------ //
// todo.schema.test.js
// Joi 스키마 단위 테스트 — 실제 DB 연결 없음
// ------------------------------------------------------------------ //

const {
  createTodoSchema,
  updateTodoSchema,
  getTodosQuerySchema,
} = require('../../src/middlewares/schemas/todo.schema');

// 공통 헬퍼: Joi validate 결과를 단순화해 반환
function validate(schema, input, options = {}) {
  return schema.validate(input, { abortEarly: false, convert: true, ...options });
}

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const INVALID_UUID = 'not-a-uuid';
const VALID_ISO_DATE = '2099-12-31';
const INVALID_ISO_DATE = '31-12-2099';

beforeEach(() => {
  jest.clearAllMocks();
});

// ==================================================================
// createTodoSchema
// ==================================================================
describe('createTodoSchema', () => {
  describe('유효한 입력', () => {
    it('title, categoryId 필수 필드만으로 유효성 통과', () => {
      const { error } = validate(createTodoSchema, {
        title: '할일 제목',
        categoryId: VALID_UUID,
      });
      expect(error).toBeUndefined();
    });

    it('description, dueDate 포함 전체 필드 유효성 통과', () => {
      const { error } = validate(createTodoSchema, {
        title: '할일 제목',
        description: '상세 설명',
        dueDate: VALID_ISO_DATE,
        categoryId: VALID_UUID,
      });
      expect(error).toBeUndefined();
    });

    it('dueDate 를 null 로 지정 시 유효성 통과', () => {
      const { error } = validate(createTodoSchema, {
        title: '제목',
        categoryId: VALID_UUID,
        dueDate: null,
      });
      expect(error).toBeUndefined();
    });

    it('description 빈 문자열 허용', () => {
      const { error } = validate(createTodoSchema, {
        title: '제목',
        categoryId: VALID_UUID,
        description: '',
      });
      expect(error).toBeUndefined();
    });
  });

  describe('title 유효성 오류', () => {
    it('title 누락 시 error 반환', () => {
      const { error } = validate(createTodoSchema, {
        categoryId: VALID_UUID,
      });
      expect(error).toBeDefined();
      expect(error.details.some((d) => d.path.includes('title'))).toBe(true);
    });

    it('title 빈 문자열 시 error 반환', () => {
      const { error } = validate(createTodoSchema, {
        title: '',
        categoryId: VALID_UUID,
      });
      expect(error).toBeDefined();
      expect(error.details.some((d) => d.path.includes('title'))).toBe(true);
    });

    it('title 200자 초과 시 error 반환', () => {
      const { error } = validate(createTodoSchema, {
        title: 'a'.repeat(201),
        categoryId: VALID_UUID,
      });
      expect(error).toBeDefined();
      expect(error.details.some((d) => d.path.includes('title'))).toBe(true);
    });

    it('title 정확히 200자이면 유효성 통과', () => {
      const { error } = validate(createTodoSchema, {
        title: 'a'.repeat(200),
        categoryId: VALID_UUID,
      });
      expect(error).toBeUndefined();
    });
  });

  describe('categoryId 유효성 오류', () => {
    it('categoryId 누락 시 error 반환', () => {
      const { error } = validate(createTodoSchema, {
        title: '제목',
      });
      expect(error).toBeDefined();
      expect(error.details.some((d) => d.path.includes('categoryId'))).toBe(true);
    });

    it('categoryId 가 UUID 형식이 아니면 error 반환', () => {
      const { error } = validate(createTodoSchema, {
        title: '제목',
        categoryId: INVALID_UUID,
      });
      expect(error).toBeDefined();
      expect(error.details.some((d) => d.path.includes('categoryId'))).toBe(true);
    });
  });

  describe('dueDate 유효성 오류', () => {
    it('dueDate 가 ISO 형식이 아니면 error 반환', () => {
      const { error } = validate(createTodoSchema, {
        title: '제목',
        categoryId: VALID_UUID,
        dueDate: INVALID_ISO_DATE,
      });
      expect(error).toBeDefined();
      expect(error.details.some((d) => d.path.includes('dueDate'))).toBe(true);
    });
  });
});

// ==================================================================
// updateTodoSchema
// ==================================================================
describe('updateTodoSchema', () => {
  describe('유효한 입력', () => {
    it('빈 객체 — 모든 필드가 optional 이므로 유효성 통과', () => {
      const { error } = validate(updateTodoSchema, {});
      expect(error).toBeUndefined();
    });

    it('title 만 제공 시 유효성 통과', () => {
      const { error } = validate(updateTodoSchema, { title: '새 제목' });
      expect(error).toBeUndefined();
    });

    it('description 만 제공 시 유효성 통과', () => {
      const { error } = validate(updateTodoSchema, { description: '설명 변경' });
      expect(error).toBeUndefined();
    });

    it('dueDate null 허용', () => {
      const { error } = validate(updateTodoSchema, { dueDate: null });
      expect(error).toBeUndefined();
    });

    it('categoryId 유효한 UUID 시 유효성 통과', () => {
      const { error } = validate(updateTodoSchema, { categoryId: VALID_UUID });
      expect(error).toBeUndefined();
    });
  });

  describe('유효성 오류', () => {
    it('categoryId 가 UUID 형식이 아니면 error 반환', () => {
      const { error } = validate(updateTodoSchema, { categoryId: INVALID_UUID });
      expect(error).toBeDefined();
      expect(error.details.some((d) => d.path.includes('categoryId'))).toBe(true);
    });

    it('title 빈 문자열 시 error 반환 (min(1) 위반)', () => {
      const { error } = validate(updateTodoSchema, { title: '' });
      expect(error).toBeDefined();
      expect(error.details.some((d) => d.path.includes('title'))).toBe(true);
    });

    it('title 200자 초과 시 error 반환', () => {
      const { error } = validate(updateTodoSchema, { title: 'b'.repeat(201) });
      expect(error).toBeDefined();
    });
  });
});

// ==================================================================
// getTodosQuerySchema
// ==================================================================
describe('getTodosQuerySchema', () => {
  describe('기본값 적용', () => {
    it('빈 쿼리 시 page=1, size=20 기본값 적용', () => {
      const { error, value } = validate(getTodosQuerySchema, {});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.size).toBe(20);
    });
  });

  describe('타입 변환', () => {
    it("isCompleted: 'true' → boolean true 변환", () => {
      const { error, value } = validate(getTodosQuerySchema, { isCompleted: 'true' });
      expect(error).toBeUndefined();
      expect(value.isCompleted).toBe(true);
    });

    it("isCompleted: 'false' → boolean false 변환", () => {
      const { error, value } = validate(getTodosQuerySchema, { isCompleted: 'false' });
      expect(error).toBeUndefined();
      expect(value.isCompleted).toBe(false);
    });

    it("page: '2' 문자열 → 숫자 2 변환", () => {
      const { error, value } = validate(getTodosQuerySchema, { page: '2' });
      expect(error).toBeUndefined();
      expect(value.page).toBe(2);
    });
  });

  describe('범위 유효성 오류', () => {
    it('page=0 → error (min(1) 위반)', () => {
      const { error } = validate(getTodosQuerySchema, { page: 0 });
      expect(error).toBeDefined();
      expect(error.details.some((d) => d.path.includes('page'))).toBe(true);
    });

    it('size=101 → error (max(100) 위반)', () => {
      const { error } = validate(getTodosQuerySchema, { size: 101 });
      expect(error).toBeDefined();
      expect(error.details.some((d) => d.path.includes('size'))).toBe(true);
    });

    it('size=1 → 유효성 통과 (min(1))', () => {
      const { error } = validate(getTodosQuerySchema, { size: 1 });
      expect(error).toBeUndefined();
    });

    it('size=100 → 유효성 통과 (max(100))', () => {
      const { error } = validate(getTodosQuerySchema, { size: 100 });
      expect(error).toBeUndefined();
    });
  });

  describe('날짜 범위 커스텀 검증', () => {
    it('dueDateFrom <= dueDateTo 인 경우 유효성 통과', () => {
      const { error } = validate(getTodosQuerySchema, {
        dueDateFrom: '2099-01-01',
        dueDateTo: '2099-12-31',
      });
      expect(error).toBeUndefined();
    });

    it('dueDateFrom === dueDateTo 인 경우 유효성 통과', () => {
      const { error } = validate(getTodosQuerySchema, {
        dueDateFrom: '2099-06-15',
        dueDateTo: '2099-06-15',
      });
      expect(error).toBeUndefined();
    });

    it('dueDateFrom > dueDateTo 인 경우 error 반환', () => {
      const { error } = validate(getTodosQuerySchema, {
        dueDateFrom: '2099-12-31',
        dueDateTo: '2099-01-01',
      });
      expect(error).toBeDefined();
    });

    it('dueDateFrom > dueDateTo 시 커스텀 메시지 포함', () => {
      const { error } = validate(getTodosQuerySchema, {
        dueDateFrom: '2099-12-31',
        dueDateTo: '2099-01-01',
      });
      expect(error.message).toContain('dueDateFrom은 dueDateTo보다 이전이어야 합니다.');
    });

    it('dueDateFrom 만 존재하면 유효성 통과', () => {
      const { error } = validate(getTodosQuerySchema, { dueDateFrom: '2099-01-01' });
      expect(error).toBeUndefined();
    });

    it('dueDateTo 만 존재하면 유효성 통과', () => {
      const { error } = validate(getTodosQuerySchema, { dueDateTo: '2099-12-31' });
      expect(error).toBeUndefined();
    });
  });

  describe('categoryId 유효성 오류', () => {
    it('categoryId 가 UUID 형식이 아니면 error 반환', () => {
      const { error } = validate(getTodosQuerySchema, { categoryId: INVALID_UUID });
      expect(error).toBeDefined();
      expect(error.details.some((d) => d.path.includes('categoryId'))).toBe(true);
    });

    it('categoryId 유효한 UUID 시 유효성 통과', () => {
      const { error } = validate(getTodosQuerySchema, { categoryId: VALID_UUID });
      expect(error).toBeUndefined();
    });
  });
});
