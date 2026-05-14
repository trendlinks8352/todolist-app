'use strict';

// ------------------------------------------------------------------ //
// category.schema.test.js
// createCategorySchema Joi 스키마 단위 테스트
// 실제 DB 연결 없음 — Joi 스키마를 직접 import 해서 검증한다.
// ------------------------------------------------------------------ //

const { createCategorySchema } = require('../../src/middlewares/schemas/category.schema');

// ------------------------------------------------------------------ //
// 헬퍼
// ------------------------------------------------------------------ //
function validate(input, options = { abortEarly: false }) {
  return createCategorySchema.validate(input, options);
}

function getError(input) {
  return validate(input).error;
}

function getFieldNames(input) {
  const { error } = validate(input);
  if (!error) return [];
  return error.details.map((d) => d.path.join('.'));
}

beforeEach(() => {
  jest.resetAllMocks();
});

// ==================================================================
// createCategorySchema
// ==================================================================
describe('createCategorySchema', () => {
  // ------------------------------------------------------------ //
  // 유효한 입력
  // ------------------------------------------------------------ //
  describe('유효한 입력', () => {
    it('name 이 정상적인 문자열이면 error 가 없다', () => {
      const { error } = validate({ name: '업무' });
      expect(error).toBeUndefined();
    });

    it('name 이 1자(최소값 경계)이면 error 가 없다', () => {
      const { error } = validate({ name: 'A' });
      expect(error).toBeUndefined();
    });

    it('name 이 50자(최대값 경계)이면 error 가 없다', () => {
      const { error } = validate({ name: 'a'.repeat(50) });
      expect(error).toBeUndefined();
    });

    it('name 이 한글 단어이면 error 가 없다', () => {
      const { error } = validate({ name: '개인할일' });
      expect(error).toBeUndefined();
    });
  });

  // ------------------------------------------------------------ //
  // name 필드 필수 검증
  // ------------------------------------------------------------ //
  describe('name 누락 및 필수 검증', () => {
    it('name 이 누락되면 error 가 발생한다', () => {
      const error = getError({});
      expect(error).toBeDefined();
    });

    it('name 누락 시 error 필드에 name 이 포함된다', () => {
      const fields = getFieldNames({});
      expect(fields).toContain('name');
    });

    it('name 이 null 이면 error 가 발생한다', () => {
      const error = getError({ name: null });
      expect(error).toBeDefined();
    });
  });

  // ------------------------------------------------------------ //
  // name 길이 검증
  // ------------------------------------------------------------ //
  describe('name 길이 검증', () => {
    it('name 이 빈 문자열("")이면 error 가 발생한다', () => {
      const error = getError({ name: '' });
      expect(error).toBeDefined();
    });

    it('name 이 51자(최대값 초과)이면 error 가 발생한다', () => {
      const error = getError({ name: 'a'.repeat(51) });
      expect(error).toBeDefined();
    });

    it('name 이 51자 초과 시 error 의 path 에 name 이 포함된다', () => {
      const fields = getFieldNames({ name: 'a'.repeat(51) });
      expect(fields).toContain('name');
    });

    it('name 이 100자이면 error 가 발생한다', () => {
      const error = getError({ name: 'a'.repeat(100) });
      expect(error).toBeDefined();
    });
  });

  // ------------------------------------------------------------ //
  // 추가 필드 처리
  // ------------------------------------------------------------ //
  describe('추가 필드 처리', () => {
    it('name 만 있는 객체는 유효하다', () => {
      const { error } = validate({ name: '카테고리명' });
      expect(error).toBeUndefined();
    });

    it('빈 객체는 name 누락으로 error 가 발생한다', () => {
      const { error } = validate({});
      expect(error).toBeDefined();
    });
  });
});
