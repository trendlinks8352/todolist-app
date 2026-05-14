'use strict';

// ------------------------------------------------------------------ //
// userRoutes.test.js
// supertest + 테스트용 Express 미니앱으로 user 라우트 통합 테스트.
//
// - userService 전체를 jest.mock 으로 대체한다.
// - tokenUtils 를 jest.mock 으로 대체해 authenticate 미들웨어가
//   실제 JWT 검증을 수행하지 않도록 한다.
// - 각 테스트에서 mockResolvedValue / mockRejectedValue 로 서비스 반환값을 설정한다.
// ------------------------------------------------------------------ //

// 의존성 mock 은 최상단에 선언해야 jest 가 hoisting 을 올바르게 처리한다.
jest.mock('../../src/services/userService');
jest.mock('../../src/utils/tokenUtils');

const request = require('supertest');

const userService = require('../../src/services/userService');
const { verifyToken } = require('../../src/utils/tokenUtils');
const { AppError } = require('../../src/middlewares/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../../src/constants/constants');

// ------------------------------------------------------------------ //
// 공통 픽스처
// ------------------------------------------------------------------ //
const USER_ID = 'user-uuid-0001';
const BEARER_TOKEN = 'Bearer test-token';

const MOCK_USER = {
  id: USER_ID,
  email: 'test@test.com',
  name: '홍길동',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// ------------------------------------------------------------------ //
// 테스트용 Express 앱 팩토리
// ------------------------------------------------------------------ //
function buildApp() {
  const express = require('express');
  const { errorHandler } = require('../../src/middlewares/errorHandler');
  const userRouter = require('../../src/routes/user.routes');
  const app = express();
  app.use(express.json());
  app.use('/api/users', userRouter);
  app.use(errorHandler);
  return app;
}

// verifyToken 의 기본 mock 반환값 설정 (최상위 스코프에서 선언)
verifyToken.mockReturnValue({ id: USER_ID, email: 'test@test.com' });

const app = buildApp();

beforeEach(() => {
  jest.resetAllMocks();
  // resetAllMocks 이후 기본 mock 을 다시 복원한다
  verifyToken.mockReturnValue({ id: USER_ID, email: 'test@test.com' });
});

// ==================================================================
// GET /api/users/me
// ==================================================================
describe('GET /api/users/me', () => {
  // ------------------------------------------------------------ //
  // 인증 실패
  // ------------------------------------------------------------ //
  describe('인증 없음 또는 형식 오류', () => {
    it('Authorization 헤더가 없으면 401 을 반환한다', async () => {
      const res = await request(app).get('/api/users/me');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('401 응답 body 에 UNAUTHORIZED 코드가 포함된다', async () => {
      const res = await request(app).get('/api/users/me');

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('"Bearer " 접두사가 없으면 401 을 반환한다', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Token test-token');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('"Bearer " 접두사 없음 시 응답 body 에 UNAUTHORIZED 코드가 포함된다', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Token test-token');

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  // ------------------------------------------------------------ //
  // 성공 — 유효한 인증
  // ------------------------------------------------------------ //
  describe('유효한 인증', () => {
    beforeEach(() => {
      userService.getMe.mockResolvedValue(MOCK_USER);
    });

    it('200 상태 코드를 반환한다', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', BEARER_TOKEN);

      expect(res.status).toBe(HTTP_STATUS.OK);
    });

    it('userService.getMe 가 req.user.id 로 호출된다', async () => {
      await request(app)
        .get('/api/users/me')
        .set('Authorization', BEARER_TOKEN);

      expect(userService.getMe).toHaveBeenCalledWith(USER_ID);
      expect(userService.getMe).toHaveBeenCalledTimes(1);
    });

    it('응답 body 에 id, email, name 이 포함된다', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', BEARER_TOKEN);

      expect(res.body).toMatchObject({
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        name: MOCK_USER.name,
      });
    });

    it('응답 body 에 password 필드가 없다', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', BEARER_TOKEN);

      expect(res.body).not.toHaveProperty('password');
    });
  });

  // ------------------------------------------------------------ //
  // 서비스 레이어 에러 전파 — 404
  // ------------------------------------------------------------ //
  describe('서비스 에러 전파', () => {
    it('서비스에서 404 AppError 가 발생하면 404 를 응답한다', async () => {
      userService.getMe.mockRejectedValue(
        new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, '사용자를 찾을 수 없습니다.')
      );

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', BEARER_TOKEN);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('404 응답 body 의 구조가 { error: { code, message } } 형식이다', async () => {
      userService.getMe.mockRejectedValue(
        new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, '사용자를 찾을 수 없습니다.')
      );

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', BEARER_TOKEN);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', ERROR_CODES.NOT_FOUND);
      expect(res.body.error).toHaveProperty('message', '사용자를 찾을 수 없습니다.');
    });
  });
});

// ==================================================================
// DELETE /api/users/me
// ==================================================================
describe('DELETE /api/users/me', () => {
  // ------------------------------------------------------------ //
  // 인증 실패
  // ------------------------------------------------------------ //
  describe('인증 없음', () => {
    it('Authorization 헤더가 없으면 401 을 반환한다', async () => {
      const res = await request(app).delete('/api/users/me');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('401 응답 body 에 UNAUTHORIZED 코드가 포함된다', async () => {
      const res = await request(app).delete('/api/users/me');

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  // ------------------------------------------------------------ //
  // 성공 — 유효한 인증
  // ------------------------------------------------------------ //
  describe('유효한 인증', () => {
    beforeEach(() => {
      userService.deleteMe.mockResolvedValue(undefined);
    });

    it('204 No Content 를 반환한다', async () => {
      const res = await request(app)
        .delete('/api/users/me')
        .set('Authorization', BEARER_TOKEN);

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT);
    });

    it('userService.deleteMe 가 req.user.id 로 호출된다', async () => {
      await request(app)
        .delete('/api/users/me')
        .set('Authorization', BEARER_TOKEN);

      expect(userService.deleteMe).toHaveBeenCalledWith(USER_ID);
      expect(userService.deleteMe).toHaveBeenCalledTimes(1);
    });

    it('204 응답 본문이 비어 있다', async () => {
      const res = await request(app)
        .delete('/api/users/me')
        .set('Authorization', BEARER_TOKEN);

      expect(res.text).toBe('');
    });

    it('204 응답에 Content-Length 헤더가 없다', async () => {
      const res = await request(app)
        .delete('/api/users/me')
        .set('Authorization', BEARER_TOKEN);

      expect(res.headers['content-length']).toBeUndefined();
    });
  });

  // ------------------------------------------------------------ //
  // 서비스 레이어 에러 전파 — 500
  // ------------------------------------------------------------ //
  describe('서비스 에러 전파', () => {
    it('서비스에서 예기치 않은 에러가 throw 되면 500 을 응답한다', async () => {
      userService.deleteMe.mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app)
        .delete('/api/users/me')
        .set('Authorization', BEARER_TOKEN);

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });

    it('500 응답 body 의 구조가 { error: { code, message } } 형식이다', async () => {
      userService.deleteMe.mockRejectedValue(new Error('unexpected error'));

      const res = await request(app)
        .delete('/api/users/me')
        .set('Authorization', BEARER_TOKEN);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', ERROR_CODES.INTERNAL_ERROR);
    });

    it('500 에러 시 userService.deleteMe 가 단 한 번 호출된다', async () => {
      userService.deleteMe.mockRejectedValue(new Error('unexpected error'));

      await request(app)
        .delete('/api/users/me')
        .set('Authorization', BEARER_TOKEN);

      expect(userService.deleteMe).toHaveBeenCalledTimes(1);
    });
  });
});
