'use strict';

const {
  HTTP_STATUS,
  ERROR_CODES,
  TODO_CONSTANTS,
  CATEGORY_CONSTANTS,
  DEFAULT_GENERAL_CATEGORY_ID,
} = require('../../src/constants/constants');

describe('constants', () => {
  // ------------------------------------------------------------------ //
  // HTTP_STATUS
  // ------------------------------------------------------------------ //
  describe('HTTP_STATUS', () => {
    it('2xx 성공 상태 코드를 올바른 숫자로 내보낸다', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.NO_CONTENT).toBe(204);
    });

    it('4xx 클라이언트 오류 상태 코드를 올바른 숫자로 내보낸다', () => {
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.CONFLICT).toBe(409);
      expect(HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(422);
    });

    it('5xx 서버 오류 상태 코드를 올바른 숫자로 내보낸다', () => {
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });

    it('모든 상태 코드 값이 양의 정수이다', () => {
      for (const [key, value] of Object.entries(HTTP_STATUS)) {
        expect(typeof value).toBe('number', `${key} 는 숫자여야 합니다`);
        expect(Number.isInteger(value)).toBe(true, `${key} 는 정수여야 합니다`);
        expect(value).toBeGreaterThan(0);
      }
    });

    it('정확히 10개의 상태 코드를 포함한다', () => {
      expect(Object.keys(HTTP_STATUS)).toHaveLength(10);
    });
  });

  // ------------------------------------------------------------------ //
  // ERROR_CODES
  // ------------------------------------------------------------------ //
  describe('ERROR_CODES', () => {
    it('각 에러 코드가 자기 자신의 키 이름과 동일한 문자열 값을 가진다', () => {
      expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
      expect(ERROR_CODES.CONFLICT).toBe('CONFLICT');
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });

    it('모든 에러 코드 값이 비어 있지 않은 문자열이다', () => {
      for (const [key, value] of Object.entries(ERROR_CODES)) {
        expect(typeof value).toBe('string', `${key} 는 문자열이어야 합니다`);
        expect(value.length).toBeGreaterThan(0);
      }
    });

    it('정확히 6개의 에러 코드를 포함한다', () => {
      expect(Object.keys(ERROR_CODES)).toHaveLength(6);
    });
  });

  // ------------------------------------------------------------------ //
  // TODO_CONSTANTS
  // ------------------------------------------------------------------ //
  describe('TODO_CONSTANTS', () => {
    it('MAX_TITLE_LENGTH 가 200 이다', () => {
      expect(TODO_CONSTANTS.MAX_TITLE_LENGTH).toBe(200);
    });

    it('MAX_TITLE_LENGTH 가 양의 정수이다', () => {
      expect(Number.isInteger(TODO_CONSTANTS.MAX_TITLE_LENGTH)).toBe(true);
      expect(TODO_CONSTANTS.MAX_TITLE_LENGTH).toBeGreaterThan(0);
    });
  });

  // ------------------------------------------------------------------ //
  // CATEGORY_CONSTANTS
  // ------------------------------------------------------------------ //
  describe('CATEGORY_CONSTANTS', () => {
    it('MAX_NAME_LENGTH 가 50 이다', () => {
      expect(CATEGORY_CONSTANTS.MAX_NAME_LENGTH).toBe(50);
    });

    it('MAX_NAME_LENGTH 가 양의 정수이다', () => {
      expect(Number.isInteger(CATEGORY_CONSTANTS.MAX_NAME_LENGTH)).toBe(true);
      expect(CATEGORY_CONSTANTS.MAX_NAME_LENGTH).toBeGreaterThan(0);
    });
  });

  // ------------------------------------------------------------------ //
  // DEFAULT_GENERAL_CATEGORY_ID
  // ------------------------------------------------------------------ //
  describe('DEFAULT_GENERAL_CATEGORY_ID', () => {
    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    it('UUID v4 형식을 만족하는 문자열이다', () => {
      expect(typeof DEFAULT_GENERAL_CATEGORY_ID).toBe('string');
      expect(DEFAULT_GENERAL_CATEGORY_ID).toMatch(UUID_REGEX);
    });

    it('정확한 UUID 값이다', () => {
      expect(DEFAULT_GENERAL_CATEGORY_ID).toBe(
        '655ebc61-df02-4b89-a969-ccbaae0cc669'
      );
    });
  });
});
