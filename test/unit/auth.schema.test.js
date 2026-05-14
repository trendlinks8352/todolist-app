'use strict';

// ------------------------------------------------------------------ //
// auth.schema.test.js
// registerSchema / loginSchema Joi 스키마 단위 테스트
// 실제 DB 연결 없음 — Joi 스키마를 직접 import해서 검증한다.
// ------------------------------------------------------------------ //

const { registerSchema, loginSchema } = require('../../src/middlewares/schemas/auth.schema');

// ------------------------------------------------------------------ //
// 헬퍼: 스키마.validate() 결과에서 error 메시지 목록 추출
// ------------------------------------------------------------------ //
function getMessages(schema, input, options = { abortEarly: false }) {
  const { error } = schema.validate(input, options);
  if (!error) return [];
  return error.details.map((d) => d.message);
}

function getFieldNames(schema, input, options = { abortEarly: false }) {
  const { error } = schema.validate(input, options);
  if (!error) return [];
  return error.details.map((d) => d.path.join('.'));
}

// ==================================================================
// registerSchema
// ==================================================================
describe('registerSchema', () => {
  // ------------------------------------------------------------ //
  // 유효한 입력
  // ------------------------------------------------------------ //
  describe('유효한 입력', () => {
    it('email, password(영문+숫자 8자 이상), name 모두 유효하면 error 가 없다', () => {
      const { error } = registerSchema.validate({
        email: 'user@example.com',
        password: 'password1',
        name: '홍길동',
      });
      expect(error).toBeUndefined();
    });

    it('password 가 영문+숫자 혼합 8자이면 error 가 없다', () => {
      const { error } = registerSchema.validate({
        email: 'test@test.com',
        password: 'abcde123',
        name: '이름',
      });
      expect(error).toBeUndefined();
    });

    it('name 이 최대 100자이면 error 가 없다', () => {
      const { error } = registerSchema.validate({
        email: 'long@example.com',
        password: 'pass1234',
        name: 'a'.repeat(100),
      });
      expect(error).toBeUndefined();
    });
  });

  // ------------------------------------------------------------ //
  // email 검증
  // ------------------------------------------------------------ //
  describe('email 필드 검증', () => {
    it('email 이 누락되면 error 가 발생한다', () => {
      const { error } = registerSchema.validate({
        password: 'password1',
        name: '홍길동',
      });
      expect(error).toBeDefined();
      expect(getFieldNames(registerSchema, { password: 'password1', name: '홍길동' })).toContain('email');
    });

    it('email 이 유효한 이메일 형식이 아니면 error 가 발생한다', () => {
      const { error } = registerSchema.validate({
        email: 'not-an-email',
        password: 'password1',
        name: '홍길동',
      });
      expect(error).toBeDefined();
    });

    it('email 에 @ 가 없으면 error 가 발생한다', () => {
      const { error } = registerSchema.validate({
        email: 'userexample.com',
        password: 'password1',
        name: '홍길동',
      });
      expect(error).toBeDefined();
    });
  });

  // ------------------------------------------------------------ //
  // password 검증
  // ------------------------------------------------------------ //
  describe('password 필드 검증', () => {
    it('password 가 8자 미만이면 커스텀 메시지("8자 이상")를 포함한 error 가 발생한다', () => {
      const messages = getMessages(registerSchema, {
        email: 'user@example.com',
        password: 'abc1234',   // 7자
        name: '홍길동',
      });
      expect(messages.some((m) => m.includes('8자 이상'))).toBe(true);
    });

    it('password 가 숫자만으로 구성되면(영문 미포함) 커스텀 패턴 메시지를 반환한다', () => {
      const messages = getMessages(registerSchema, {
        email: 'user@example.com',
        password: '12345678',
        name: '홍길동',
      });
      expect(messages.some((m) => m.includes('영문과 숫자를 각각 1자 이상'))).toBe(true);
    });

    it('password 가 영문만으로 구성되면(숫자 미포함) 커스텀 패턴 메시지를 반환한다', () => {
      const messages = getMessages(registerSchema, {
        email: 'user@example.com',
        password: 'abcdefgh',
        name: '홍길동',
      });
      expect(messages.some((m) => m.includes('영문과 숫자를 각각 1자 이상'))).toBe(true);
    });

    it('password 가 누락되면 error 가 발생한다', () => {
      const { error } = registerSchema.validate({
        email: 'user@example.com',
        name: '홍길동',
      });
      expect(error).toBeDefined();
    });
  });

  // ------------------------------------------------------------ //
  // name 검증
  // ------------------------------------------------------------ //
  describe('name 필드 검증', () => {
    it('name 이 누락되면 error 가 발생한다', () => {
      const { error } = registerSchema.validate({
        email: 'user@example.com',
        password: 'password1',
      });
      expect(error).toBeDefined();
      expect(getFieldNames(registerSchema, { email: 'user@example.com', password: 'password1' })).toContain('name');
    });

    it('name 이 빈 문자열이면 error 가 발생한다', () => {
      const { error } = registerSchema.validate({
        email: 'user@example.com',
        password: 'password1',
        name: '',
      });
      expect(error).toBeDefined();
    });

    it('name 이 101자이면 error 가 발생한다', () => {
      const { error } = registerSchema.validate({
        email: 'user@example.com',
        password: 'password1',
        name: 'a'.repeat(101),
      });
      expect(error).toBeDefined();
    });
  });

  // ------------------------------------------------------------ //
  // 복수 필드 동시 오류 (abortEarly: false)
  // ------------------------------------------------------------ //
  describe('복수 필드 동시 오류', () => {
    it('email, password, name 모두 누락 시 abortEarly:false 로 3개 오류가 반환된다', () => {
      const { error } = registerSchema.validate({}, { abortEarly: false });
      expect(error).toBeDefined();
      expect(error.details.length).toBeGreaterThanOrEqual(3);
    });

    it('여러 필드 오류 시 반환된 fields 에 email, name 이 모두 포함된다', () => {
      const fieldNames = getFieldNames(registerSchema, { password: 'password1' });
      expect(fieldNames).toContain('email');
      expect(fieldNames).toContain('name');
    });

    it('email 오류와 password 오류가 동시에 반환된다 (abortEarly: false)', () => {
      const fieldNames = getFieldNames(registerSchema, {
        email: 'bad-email',
        password: 'short',   // 8자 미만
        name: '홍길동',
      });
      expect(fieldNames).toContain('email');
      expect(fieldNames).toContain('password');
    });
  });
});

// ==================================================================
// loginSchema
// ==================================================================
describe('loginSchema', () => {
  // ------------------------------------------------------------ //
  // 유효한 입력
  // ------------------------------------------------------------ //
  describe('유효한 입력', () => {
    it('email 과 password 가 모두 유효하면 error 가 없다', () => {
      const { error } = loginSchema.validate({
        email: 'user@example.com',
        password: 'anypassword',
      });
      expect(error).toBeUndefined();
    });

    it('password 는 최소 길이 제한이 없어 1자도 유효하다', () => {
      const { error } = loginSchema.validate({
        email: 'user@example.com',
        password: 'x',
      });
      expect(error).toBeUndefined();
    });
  });

  // ------------------------------------------------------------ //
  // email 검증
  // ------------------------------------------------------------ //
  describe('email 필드 검증', () => {
    it('email 이 누락되면 error 가 발생한다', () => {
      const { error } = loginSchema.validate({ password: 'anypassword' });
      expect(error).toBeDefined();
    });

    it('email 이 올바른 이메일 형식이 아니면 error 가 발생한다', () => {
      const { error } = loginSchema.validate({
        email: 'not-valid-email',
        password: 'anypassword',
      });
      expect(error).toBeDefined();
    });
  });

  // ------------------------------------------------------------ //
  // password 검증
  // ------------------------------------------------------------ //
  describe('password 필드 검증', () => {
    it('password 가 누락되면 error 가 발생한다', () => {
      const { error } = loginSchema.validate({ email: 'user@example.com' });
      expect(error).toBeDefined();
    });

    it('password 가 빈 문자열이면 error 가 발생한다', () => {
      const { error } = loginSchema.validate({
        email: 'user@example.com',
        password: '',
      });
      expect(error).toBeDefined();
    });
  });
});
