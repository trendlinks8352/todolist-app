'use strict';

// ------------------------------------------------------------------ //
// authService.test.js
// 모든 외부 의존성을 jest.mock 으로 격리하여
// authService 의 비즈니스 로직만 단위 테스트한다.
// ------------------------------------------------------------------ //

jest.mock('../../src/repositories/userRepository');
jest.mock('../../src/utils/passwordUtils');
jest.mock('../../src/utils/tokenUtils');

const userRepository = require('../../src/repositories/userRepository');
const { hashPassword, comparePassword } = require('../../src/utils/passwordUtils');
const { generateToken } = require('../../src/utils/tokenUtils');
const authService = require('../../src/services/authService');
const { AppError } = require('../../src/middlewares/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../../src/constants/constants');

// ------------------------------------------------------------------ //
// 공통 픽스처
// ------------------------------------------------------------------ //
const MOCK_USER_DB = {
  id: 'uuid-001',
  email: 'user@example.com',
  password: '$2b$10$hashedpassword',
  name: '홍길동',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const MOCK_CREATED_USER = {
  id: 'uuid-002',
  email: 'newuser@example.com',
  name: '김철수',
  createdAt: '2024-06-01T00:00:00.000Z',
  updatedAt: '2024-06-01T00:00:00.000Z',
};

const MOCK_TOKEN = 'mock.jwt.token';

beforeEach(() => {
  jest.clearAllMocks();
});

// ==================================================================
// register
// ==================================================================
describe('authService.register', () => {
  describe('성공 케이스', () => {
    beforeEach(() => {
      // 이메일 중복 없음
      userRepository.findByEmail.mockResolvedValue(null);
      // 비밀번호 해시 반환
      hashPassword.mockResolvedValue('$2b$10$newhashedpw');
      // 사용자 생성 반환 (password 필드 없음 — DB RETURNING 절 기준)
      userRepository.create.mockResolvedValue(MOCK_CREATED_USER);
      // 토큰 생성
      generateToken.mockReturnValue(MOCK_TOKEN);
    });

    it('accessToken 과 user 객체를 반환한다', async () => {
      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'plainpassword1',
        name: '김철수',
      });

      expect(result).toHaveProperty('accessToken', MOCK_TOKEN);
      expect(result).toHaveProperty('user');
    });

    it('반환된 user 에 password 필드가 없다', async () => {
      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'plainpassword1',
        name: '김철수',
      });

      expect(result.user).not.toHaveProperty('password');
    });

    it('반환된 user 에 id, email, name, createdAt, updatedAt 이 있다', async () => {
      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'plainpassword1',
        name: '김철수',
      });

      expect(result.user).toMatchObject({
        id: MOCK_CREATED_USER.id,
        email: MOCK_CREATED_USER.email,
        name: MOCK_CREATED_USER.name,
        createdAt: MOCK_CREATED_USER.createdAt,
        updatedAt: MOCK_CREATED_USER.updatedAt,
      });
    });

    it('userRepository.findByEmail 이 입력 이메일로 호출된다', async () => {
      await authService.register({
        email: 'newuser@example.com',
        password: 'plainpassword1',
        name: '김철수',
      });

      expect(userRepository.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(userRepository.findByEmail).toHaveBeenCalledTimes(1);
    });

    it('hashPassword 가 평문 비밀번호로 호출된다', async () => {
      await authService.register({
        email: 'newuser@example.com',
        password: 'plainpassword1',
        name: '김철수',
      });

      expect(hashPassword).toHaveBeenCalledWith('plainpassword1');
      expect(hashPassword).toHaveBeenCalledTimes(1);
    });

    it('userRepository.create 가 해시된 password 로 호출된다', async () => {
      await authService.register({
        email: 'newuser@example.com',
        password: 'plainpassword1',
        name: '김철수',
      });

      expect(userRepository.create).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: '$2b$10$newhashedpw',
        name: '김철수',
      });
    });

    it('generateToken 이 { id, email } payload 로 호출된다', async () => {
      await authService.register({
        email: 'newuser@example.com',
        password: 'plainpassword1',
        name: '김철수',
      });

      expect(generateToken).toHaveBeenCalledWith({
        id: MOCK_CREATED_USER.id,
        email: MOCK_CREATED_USER.email,
      });
    });
  });

  describe('실패 케이스 — 중복 이메일', () => {
    it('이미 존재하는 이메일이면 AppError(409, CONFLICT) 를 throw 한다', async () => {
      userRepository.findByEmail.mockResolvedValue(MOCK_USER_DB);

      await expect(
        authService.register({
          email: 'user@example.com',
          password: 'password1',
          name: '홍길동',
        })
      ).rejects.toThrow(AppError);
    });

    it('중복 이메일 에러의 statusCode 가 409 이다', async () => {
      userRepository.findByEmail.mockResolvedValue(MOCK_USER_DB);

      await expect(
        authService.register({
          email: 'user@example.com',
          password: 'password1',
          name: '홍길동',
        })
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT,
      });
    });

    it('중복 이메일 에러 시 hashPassword 와 userRepository.create 는 호출되지 않는다', async () => {
      userRepository.findByEmail.mockResolvedValue(MOCK_USER_DB);

      await authService.register({
        email: 'user@example.com',
        password: 'password1',
        name: '홍길동',
      }).catch(() => {});

      expect(hashPassword).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });
});

// ==================================================================
// login
// ==================================================================
describe('authService.login', () => {
  describe('성공 케이스', () => {
    beforeEach(() => {
      userRepository.findByEmail.mockResolvedValue(MOCK_USER_DB);
      comparePassword.mockResolvedValue(true);
      generateToken.mockReturnValue(MOCK_TOKEN);
    });

    it('accessToken 과 user 객체를 반환한다', async () => {
      const result = await authService.login({
        email: 'user@example.com',
        password: 'plainpassword',
      });

      expect(result).toHaveProperty('accessToken', MOCK_TOKEN);
      expect(result).toHaveProperty('user');
    });

    it('반환된 user 에 password 필드가 없다', async () => {
      const result = await authService.login({
        email: 'user@example.com',
        password: 'plainpassword',
      });

      expect(result.user).not.toHaveProperty('password');
    });

    it('반환된 user 에 id, email, name 이 포함된다', async () => {
      const result = await authService.login({
        email: 'user@example.com',
        password: 'plainpassword',
      });

      expect(result.user).toMatchObject({
        id: MOCK_USER_DB.id,
        email: MOCK_USER_DB.email,
        name: MOCK_USER_DB.name,
      });
    });

    it('comparePassword 가 평문 비밀번호와 DB 해시로 호출된다', async () => {
      await authService.login({
        email: 'user@example.com',
        password: 'plainpassword',
      });

      expect(comparePassword).toHaveBeenCalledWith('plainpassword', MOCK_USER_DB.password);
      expect(comparePassword).toHaveBeenCalledTimes(1);
    });

    it('generateToken 이 { id, email } payload 로 호출된다', async () => {
      await authService.login({
        email: 'user@example.com',
        password: 'plainpassword',
      });

      expect(generateToken).toHaveBeenCalledWith({
        id: MOCK_USER_DB.id,
        email: MOCK_USER_DB.email,
      });
    });
  });

  describe('실패 케이스 — 존재하지 않는 이메일', () => {
    it('이메일이 존재하지 않으면 AppError(401, UNAUTHORIZED) 를 throw 한다', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'ghost@example.com', password: 'any' })
      ).rejects.toThrow(AppError);
    });

    it('에러의 statusCode 가 401 이다', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'ghost@example.com', password: 'any' })
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        code: ERROR_CODES.UNAUTHORIZED,
      });
    });

    it('보안상 이메일이 없을 때도 "이메일 또는 비밀번호가 올바르지 않습니다." 메시지를 반환한다', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'ghost@example.com', password: 'any' })
      ).rejects.toMatchObject({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    });
  });

  describe('실패 케이스 — 비밀번호 불일치', () => {
    beforeEach(() => {
      userRepository.findByEmail.mockResolvedValue(MOCK_USER_DB);
      comparePassword.mockResolvedValue(false);
    });

    it('비밀번호가 불일치하면 AppError(401, UNAUTHORIZED) 를 throw 한다', async () => {
      await expect(
        authService.login({ email: 'user@example.com', password: 'wrongpw' })
      ).rejects.toThrow(AppError);
    });

    it('비밀번호 불일치 에러의 statusCode 가 401 이다', async () => {
      await expect(
        authService.login({ email: 'user@example.com', password: 'wrongpw' })
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        code: ERROR_CODES.UNAUTHORIZED,
      });
    });

    it('보안상 비밀번호 불일치 시에도 이메일 없음과 동일한 에러 메시지를 반환한다', async () => {
      // 이메일 없음 케이스와 동일한 메시지여야 한다 (정보 노출 방지)
      await expect(
        authService.login({ email: 'user@example.com', password: 'wrongpw' })
      ).rejects.toMatchObject({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    });
  });
});

// ==================================================================
// logout
// ==================================================================
describe('authService.logout', () => {
  it('{ message: "로그아웃되었습니다." } 를 반환한다', () => {
    const result = authService.logout();

    expect(result).toEqual({ message: '로그아웃되었습니다.' });
  });

  it('동기 함수로 Promise 를 반환하지 않는다', () => {
    const result = authService.logout();

    expect(result).not.toBeInstanceOf(Promise);
  });
});
