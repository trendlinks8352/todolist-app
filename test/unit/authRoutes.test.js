'use strict';

// ------------------------------------------------------------------ //
// authRoutes.test.js
// supertest + 테스트용 Express 미니앱으로 auth 라우트 통합 테스트.
//
// - authService 전체를 jest.mock 으로 대체한다.
// - tokenUtils 를 jest.mock 으로 대체해 authenticate 미들웨어가
//   실제 JWT 검증을 수행하지 않도록 한다.
// - validate 미들웨어는 실제 구현을 사용한다 (Joi 스키마 검증 포함).
// - 각 테스트에서 mockResolvedValue / mockReturnValue 로 서비스 반환값을 설정한다.
// ------------------------------------------------------------------ //

// 의존성 mock 은 최상단에 선언해야 jest 가 hoisting 을 올바르게 처리한다.
jest.mock('../../src/services/authService');
jest.mock('../../src/utils/tokenUtils');

const request = require('supertest');
const express = require('express');

const authService = require('../../src/services/authService');
const { verifyToken } = require('../../src/utils/tokenUtils');
const authRouter = require('../../src/routes/auth.routes');
const { errorHandler } = require('../../src/middlewares/errorHandler');
const { AppError } = require('../../src/middlewares/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../../src/constants/constants');

// ------------------------------------------------------------------ //
// 테스트용 Express 앱 팩토리
// ------------------------------------------------------------------ //
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use(errorHandler);
  return app;
}

const app = buildApp();

// ------------------------------------------------------------------ //
// 공통 픽스처
// ------------------------------------------------------------------ //
const MOCK_ACCESS_TOKEN = 'mock.jwt.access.token';

const MOCK_USER = {
  id: 'uuid-001',
  email: 'user@example.com',
  name: '홍길동',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const VALID_REGISTER_BODY = {
  email: 'newuser@example.com',
  password: 'password1',
  name: '김철수',
};

const VALID_LOGIN_BODY = {
  email: 'user@example.com',
  password: 'password1',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ==================================================================
// POST /api/auth/register
// ==================================================================
describe('POST /api/auth/register', () => {
  // ------------------------------------------------------------ //
  // 성공
  // ------------------------------------------------------------ //
  describe('유효한 요청', () => {
    beforeEach(() => {
      authService.register.mockResolvedValue({
        accessToken: MOCK_ACCESS_TOKEN,
        user: MOCK_USER,
      });
    });

    it('201 상태 코드를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(VALID_REGISTER_BODY);

      expect(res.status).toBe(HTTP_STATUS.CREATED);
    });

    it('응답 body 에 accessToken 이 포함된다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(VALID_REGISTER_BODY);

      expect(res.body).toHaveProperty('accessToken', MOCK_ACCESS_TOKEN);
    });

    it('응답 body 에 user 객체가 포함된다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(VALID_REGISTER_BODY);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toMatchObject({
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        name: MOCK_USER.name,
      });
    });

    it('authService.register 가 req.body 로 호출된다', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(VALID_REGISTER_BODY);

      expect(authService.register).toHaveBeenCalledWith(VALID_REGISTER_BODY);
    });
  });

  // ------------------------------------------------------------ //
  // validate 미들웨어 동작 — 422
  // ------------------------------------------------------------ //
  describe('유효성 오류', () => {
    it('email 이 누락되면 422 를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password1', name: '김철수' });

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('email 누락 시 응답에 fields 배열이 포함된다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password1', name: '김철수' });

      expect(Array.isArray(res.body.error.fields)).toBe(true);
      expect(res.body.error.fields.some((f) => f.field === 'email')).toBe(true);
    });

    it('비밀번호 정책 위반(8자 미만)이면 422 를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'user@example.com', password: 'abc1', name: '홍' });

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('비밀번호 정책 위반 시 응답에 password fields 항목이 포함된다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'user@example.com', password: 'abc1', name: '홍' });

      expect(Array.isArray(res.body.error.fields)).toBe(true);
      expect(res.body.error.fields.some((f) => f.field === 'password')).toBe(true);
    });

    it('비밀번호 숫자 미포함(영문만) 시 422 + 커스텀 메시지를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'user@example.com', password: 'abcdefgh', name: '홍' });

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      const pwField = res.body.error.fields.find((f) => f.field === 'password');
      expect(pwField.message).toMatch(/영문과 숫자를 각각 1자 이상/);
    });

    it('name 이 누락되면 422 를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'user@example.com', password: 'password1' });

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('모든 필드 누락 시 422 + 복수 fields 를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.error.fields.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ------------------------------------------------------------ //
  // 서비스 레이어 AppError — 409
  // ------------------------------------------------------------ //
  describe('서비스 에러 전파', () => {
    it('서비스에서 409 AppError 가 발생하면 409 를 응답한다', async () => {
      authService.register.mockRejectedValue(
        new AppError(HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, '이미 사용 중인 이메일입니다.')
      );

      const res = await request(app)
        .post('/api/auth/register')
        .send(VALID_REGISTER_BODY);

      expect(res.status).toBe(HTTP_STATUS.CONFLICT);
    });

    it('409 응답 body 에 CONFLICT 코드가 포함된다', async () => {
      authService.register.mockRejectedValue(
        new AppError(HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, '이미 사용 중인 이메일입니다.')
      );

      const res = await request(app)
        .post('/api/auth/register')
        .send(VALID_REGISTER_BODY);

      expect(res.body.error.code).toBe(ERROR_CODES.CONFLICT);
    });
  });
});

// ==================================================================
// POST /api/auth/login
// ==================================================================
describe('POST /api/auth/login', () => {
  // ------------------------------------------------------------ //
  // 성공
  // ------------------------------------------------------------ //
  describe('유효한 요청', () => {
    beforeEach(() => {
      authService.login.mockResolvedValue({
        accessToken: MOCK_ACCESS_TOKEN,
        user: MOCK_USER,
      });
    });

    it('200 상태 코드를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(VALID_LOGIN_BODY);

      expect(res.status).toBe(HTTP_STATUS.OK);
    });

    it('응답 body 에 accessToken 이 포함된다', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(VALID_LOGIN_BODY);

      expect(res.body).toHaveProperty('accessToken', MOCK_ACCESS_TOKEN);
    });

    it('응답 body 에 user 객체가 포함된다', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(VALID_LOGIN_BODY);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toMatchObject({
        id: MOCK_USER.id,
        email: MOCK_USER.email,
      });
    });

    it('authService.login 이 req.body 로 호출된다', async () => {
      await request(app)
        .post('/api/auth/login')
        .send(VALID_LOGIN_BODY);

      expect(authService.login).toHaveBeenCalledWith(VALID_LOGIN_BODY);
    });
  });

  // ------------------------------------------------------------ //
  // validate 미들웨어 동작 — 422
  // ------------------------------------------------------------ //
  describe('유효성 오류', () => {
    it('email 이 누락되면 422 를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'anypassword' });

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('email 누락 시 fields 배열에 email 항목이 포함된다', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'anypassword' });

      expect(Array.isArray(res.body.error.fields)).toBe(true);
      expect(res.body.error.fields.some((f) => f.field === 'email')).toBe(true);
    });

    it('password 가 누락되면 422 를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com' });

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('email 형식 오류이면 422 를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'anypassword' });

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });
  });

  // ------------------------------------------------------------ //
  // 서비스 레이어 AppError — 401
  // ------------------------------------------------------------ //
  describe('서비스 에러 전파', () => {
    it('서비스에서 401 AppError 가 발생하면 401 을 응답한다', async () => {
      authService.login.mockRejectedValue(
        new AppError(
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED,
          '이메일 또는 비밀번호가 올바르지 않습니다.'
        )
      );

      const res = await request(app)
        .post('/api/auth/login')
        .send(VALID_LOGIN_BODY);

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('401 응답 body 에 UNAUTHORIZED 코드가 포함된다', async () => {
      authService.login.mockRejectedValue(
        new AppError(
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED,
          '이메일 또는 비밀번호가 올바르지 않습니다.'
        )
      );

      const res = await request(app)
        .post('/api/auth/login')
        .send(VALID_LOGIN_BODY);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });
});

// ==================================================================
// POST /api/auth/logout
// ==================================================================
describe('POST /api/auth/logout', () => {
  // ------------------------------------------------------------ //
  // 성공 — 유효한 Bearer 토큰
  // ------------------------------------------------------------ //
  describe('유효한 Bearer 토큰', () => {
    beforeEach(() => {
      // authenticate 미들웨어가 verifyToken 을 호출하므로 모킹된 반환값 설정
      verifyToken.mockReturnValue({ id: 'uuid-001', email: 'user@example.com' });
      authService.logout.mockReturnValue({ message: '로그아웃되었습니다.' });
    });

    it('200 상태 코드를 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid.mock.token');

      expect(res.status).toBe(HTTP_STATUS.OK);
    });

    it('응답 body 에 { message: "로그아웃되었습니다." } 가 포함된다', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid.mock.token');

      expect(res.body).toEqual({ message: '로그아웃되었습니다.' });
    });

    it('authService.logout 이 호출된다', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid.mock.token');

      expect(authService.logout).toHaveBeenCalledTimes(1);
    });

    it('verifyToken 이 Bearer 이후의 토큰 문자열로 호출된다', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid.mock.token');

      expect(verifyToken).toHaveBeenCalledWith('valid.mock.token');
    });
  });

  // ------------------------------------------------------------ //
  // 실패 — 토큰 없음 / 형식 오류
  // ------------------------------------------------------------ //
  describe('토큰 없음 또는 형식 오류', () => {
    it('Authorization 헤더가 없으면 401 을 반환한다', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('Authorization 헤더 없음 시 응답 body 에 UNAUTHORIZED 코드가 포함된다', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('"Bearer " 접두사가 없으면 401 을 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Token sometoken');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('verifyToken 이 throw 하면 401 을 반환한다', async () => {
      verifyToken.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid.token');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('유효하지 않은 토큰으로 인한 401 시 authService.logout 은 호출되지 않는다', async () => {
      verifyToken.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer expired.token');

      expect(authService.logout).not.toHaveBeenCalled();
    });
  });
});
