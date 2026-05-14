'use strict';

// ------------------------------------------------------------------ //
// userService.test.js
// userRepository 를 jest.mock 으로 격리하여
// userService 의 비즈니스 로직만 단위 테스트한다.
// ------------------------------------------------------------------ //

jest.mock('../../src/repositories/userRepository');

const userRepository = require('../../src/repositories/userRepository');
const userService = require('../../src/services/userService');
const { AppError } = require('../../src/middlewares/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../../src/constants/constants');

// ------------------------------------------------------------------ //
// 공통 픽스처
// ------------------------------------------------------------------ //
const USER_ID = 'user-uuid-0001';

const MOCK_USER = {
  id: USER_ID,
  email: 'test@test.com',
  name: '홍길동',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.resetAllMocks();
});

// ==================================================================
// getMe
// ==================================================================
describe('userService.getMe', () => {
  describe('성공 케이스 — 사용자 존재', () => {
    beforeEach(() => {
      userRepository.findById.mockResolvedValue(MOCK_USER);
    });

    it('userRepository.findById 가 userId 로 호출된다', async () => {
      await userService.getMe(USER_ID);

      expect(userRepository.findById).toHaveBeenCalledWith(USER_ID);
      expect(userRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('사용자가 존재하면 user 객체를 반환한다', async () => {
      const result = await userService.getMe(USER_ID);

      expect(result).toEqual(MOCK_USER);
    });

    it('반환된 user 객체에 password 필드가 없다', async () => {
      const result = await userService.getMe(USER_ID);

      expect(result).not.toHaveProperty('password');
    });

    it('반환된 user 객체에 id, email, name, createdAt, updatedAt 이 포함된다', async () => {
      const result = await userService.getMe(USER_ID);

      expect(result).toMatchObject({
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        name: MOCK_USER.name,
        createdAt: MOCK_USER.createdAt,
        updatedAt: MOCK_USER.updatedAt,
      });
    });
  });

  describe('실패 케이스 — 사용자 없음', () => {
    beforeEach(() => {
      userRepository.findById.mockResolvedValue(null);
    });

    it('사용자가 없으면 AppError 를 throw 한다', async () => {
      await expect(userService.getMe(USER_ID)).rejects.toThrow(AppError);
    });

    it('throw 된 AppError 의 statusCode 가 404 이다', async () => {
      await expect(userService.getMe(USER_ID)).rejects.toMatchObject({
        statusCode: HTTP_STATUS.NOT_FOUND,
      });
    });

    it('throw 된 AppError 의 code 가 NOT_FOUND 이다', async () => {
      await expect(userService.getMe(USER_ID)).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
      });
    });

    it('throw 된 AppError 의 message 가 "사용자를 찾을 수 없습니다." 이다', async () => {
      await expect(userService.getMe(USER_ID)).rejects.toMatchObject({
        message: '사용자를 찾을 수 없습니다.',
      });
    });
  });
});

// ==================================================================
// deleteMe
// ==================================================================
describe('userService.deleteMe', () => {
  describe('성공 케이스', () => {
    beforeEach(() => {
      userRepository.deleteById.mockResolvedValue(undefined);
    });

    it('userRepository.deleteById 가 userId 로 호출된다', async () => {
      await userService.deleteMe(USER_ID);

      expect(userRepository.deleteById).toHaveBeenCalledWith(USER_ID);
      expect(userRepository.deleteById).toHaveBeenCalledTimes(1);
    });

    it('userId 가 올바르게 전달된다', async () => {
      const OTHER_ID = 'other-uuid-9999';
      await userService.deleteMe(OTHER_ID);

      expect(userRepository.deleteById).toHaveBeenCalledWith(OTHER_ID);
    });

    it('deleteById 성공 시 undefined 를 반환한다 (void)', async () => {
      const result = await userService.deleteMe(USER_ID);

      expect(result).toBeUndefined();
    });
  });

  describe('실패 케이스 — repository 에러 전파', () => {
    it('deleteById 가 에러를 throw 하면 그 에러가 그대로 전파된다', async () => {
      const DB_ERROR = new Error('DB connection lost');
      userRepository.deleteById.mockRejectedValue(DB_ERROR);

      await expect(userService.deleteMe(USER_ID)).rejects.toThrow('DB connection lost');
    });

    it('전파된 에러가 원본 Error 인스턴스와 동일하다', async () => {
      const DB_ERROR = new Error('unexpected error');
      userRepository.deleteById.mockRejectedValue(DB_ERROR);

      await expect(userService.deleteMe(USER_ID)).rejects.toBe(DB_ERROR);
    });
  });
});
