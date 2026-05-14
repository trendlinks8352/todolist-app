'use strict';

// ------------------------------------------------------------------ //
// categoryRoutes.test.js
// supertest + 테스트용 Express 미니앱으로 category 라우트 통합 테스트.
//
// - categoryService 전체를 jest.mock 으로 대체한다.
// - tokenUtils 를 jest.mock 으로 대체해 authenticate 미들웨어가
//   실제 JWT 검증을 수행하지 않도록 한다.
// - validate 미들웨어는 실제 구현(Joi 스키마 포함)을 사용한다.
// ------------------------------------------------------------------ //

jest.mock('../../src/services/categoryService');
jest.mock('../../src/utils/tokenUtils');

const request = require('supertest');
const express = require('express');

const categoryService = require('../../src/services/categoryService');
const { verifyToken } = require('../../src/utils/tokenUtils');
const { errorHandler, AppError } = require('../../src/middlewares/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../../src/constants/constants');

// ------------------------------------------------------------------ //
// 테스트용 Express 앱 팩토리
// categoryRouter 는 매 호출마다 새로 require 하지 않고
// 모듈 캐시를 그대로 사용한다.
// ------------------------------------------------------------------ //
function buildApp() {
  const app = express();
  app.use(express.json());
  // categoryRouter 는 authenticate 를 내부적으로 사용하므로
  // tokenUtils 가 mock 된 상태에서 require 해야 한다.
  const categoryRouter = require('../../src/routes/category.routes');
  app.use('/api/categories', categoryRouter);
  app.use(errorHandler);
  return app;
}

// ------------------------------------------------------------------ //
// 공통 픽스처
// ------------------------------------------------------------------ //
const USER_ID = 'user-uuid-0001';
const CATEGORY_ID = 'cat-uuid-0001';
const BEARER_TOKEN = 'Bearer valid.mock.token';

const MOCK_CATEGORY = {
  id: CATEGORY_ID,
  userId: USER_ID,
  name: '업무',
  isDefault: false,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const MOCK_CATEGORIES_RESULT = {
  data: [
    { id: 'default-id', userId: null, name: '일반', isDefault: true, createdAt: '2024-01-01T00:00:00.000Z' },
    MOCK_CATEGORY,
  ],
};

let app;

beforeEach(() => {
  jest.resetAllMocks();
  // 기본적으로 verifyToken 은 유효한 사용자를 반환
  verifyToken.mockReturnValue({ id: USER_ID, email: 'test@test.com' });
  app = buildApp();
});

// ==================================================================
// GET /api/categories
// ==================================================================
describe('GET /api/categories', () => {
  // ------------------------------------------------------------ //
  // 인증 실패
  // ------------------------------------------------------------ //
  describe('인증 없음', () => {
    it('Authorization 헤더가 없으면 401 을 반환한다', async () => {
      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('401 응답 body 에 UNAUTHORIZED 코드가 포함된다', async () => {
      const res = await request(app).get('/api/categories');

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('"Bearer " 접두사가 없으면 401 을 반환한다', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', 'Token sometoken');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  // ------------------------------------------------------------ //
  // 성공
  // ------------------------------------------------------------ //
  describe('유효한 인증', () => {
    beforeEach(() => {
      categoryService.getCategories.mockResolvedValue(MOCK_CATEGORIES_RESULT);
    });

    it('200 상태 코드를 반환한다', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', BEARER_TOKEN);

      expect(res.status).toBe(HTTP_STATUS.OK);
    });

    it('응답 body 에 { data: [...] } 형식이 포함된다', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', BEARER_TOKEN);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('categoryService.getCategories 가 req.user.id 로 호출된다', async () => {
      await request(app)
        .get('/api/categories')
        .set('Authorization', BEARER_TOKEN);

      expect(categoryService.getCategories).toHaveBeenCalledWith(USER_ID);
      expect(categoryService.getCategories).toHaveBeenCalledTimes(1);
    });

    it('응답 body 의 data 배열에 카테고리 목록이 포함된다', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', BEARER_TOKEN);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[1]).toMatchObject({ id: CATEGORY_ID, name: '업무' });
    });
  });

  // ------------------------------------------------------------ //
  // 빈 목록
  // ------------------------------------------------------------ //
  describe('빈 목록', () => {
    it('카테고리가 없으면 { data: [] } 를 반환한다', async () => {
      categoryService.getCategories.mockResolvedValue({ data: [] });

      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', BEARER_TOKEN);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toEqual({ data: [] });
    });
  });
});

// ==================================================================
// POST /api/categories
// ==================================================================
describe('POST /api/categories', () => {
  // ------------------------------------------------------------ //
  // 인증 실패
  // ------------------------------------------------------------ //
  describe('인증 없음', () => {
    it('Authorization 헤더가 없으면 401 을 반환한다', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ name: '업무' });

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('401 응답 body 에 UNAUTHORIZED 코드가 포함된다', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ name: '업무' });

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  // ------------------------------------------------------------ //
  // validate 미들웨어 동작 — 422
  // ------------------------------------------------------------ //
  describe('유효성 오류', () => {
    it('name 이 누락되면 422 를 반환한다', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', BEARER_TOKEN)
        .send({});

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('name 누락 시 응답에 fields 배열이 포함된다', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', BEARER_TOKEN)
        .send({});

      expect(Array.isArray(res.body.error.fields)).toBe(true);
      expect(res.body.error.fields.some((f) => f.field === 'name')).toBe(true);
    });

    it('name 이 51자이면 422 를 반환한다', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', BEARER_TOKEN)
        .send({ name: 'a'.repeat(51) });

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('name 이 51자 초과 시 fields 배열에 name 항목이 포함된다', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', BEARER_TOKEN)
        .send({ name: 'a'.repeat(51) });

      expect(Array.isArray(res.body.error.fields)).toBe(true);
      expect(res.body.error.fields.some((f) => f.field === 'name')).toBe(true);
    });

    it('name 이 빈 문자열이면 422 를 반환한다', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', BEARER_TOKEN)
        .send({ name: '' });

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });
  });

  // ------------------------------------------------------------ //
  // 성공
  // ------------------------------------------------------------ //
  describe('유효한 요청', () => {
    beforeEach(() => {
      categoryService.createCategory.mockResolvedValue(MOCK_CATEGORY);
    });

    it('201 상태 코드를 반환한다', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', BEARER_TOKEN)
        .send({ name: '업무' });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
    });

    it('응답 body 에 생성된 카테고리 객체가 포함된다', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', BEARER_TOKEN)
        .send({ name: '업무' });

      expect(res.body).toMatchObject({
        id: CATEGORY_ID,
        name: '업무',
        isDefault: false,
      });
    });

    it('categoryService.createCategory 가 (userId, name) 으로 호출된다', async () => {
      await request(app)
        .post('/api/categories')
        .set('Authorization', BEARER_TOKEN)
        .send({ name: '업무' });

      expect(categoryService.createCategory).toHaveBeenCalledWith(USER_ID, '업무');
      expect(categoryService.createCategory).toHaveBeenCalledTimes(1);
    });

    it('name 이 50자(최대 경계)이면 201 을 반환한다', async () => {
      categoryService.createCategory.mockResolvedValue({
        ...MOCK_CATEGORY,
        name: 'a'.repeat(50),
      });

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', BEARER_TOKEN)
        .send({ name: 'a'.repeat(50) });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
    });
  });

  // ------------------------------------------------------------ //
  // 서비스 레이어 AppError 전파
  // ------------------------------------------------------------ //
  describe('서비스 에러 전파', () => {
    it('서비스에서 409 AppError 가 발생하면 409 를 응답한다', async () => {
      categoryService.createCategory.mockRejectedValue(
        new AppError(HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, '이미 사용 중인 카테고리 이름입니다.')
      );

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', BEARER_TOKEN)
        .send({ name: '업무' });

      expect(res.status).toBe(HTTP_STATUS.CONFLICT);
    });

    it('409 응답 body 에 CONFLICT 코드가 포함된다', async () => {
      categoryService.createCategory.mockRejectedValue(
        new AppError(HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, '이미 사용 중인 카테고리 이름입니다.')
      );

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', BEARER_TOKEN)
        .send({ name: '업무' });

      expect(res.body.error.code).toBe(ERROR_CODES.CONFLICT);
    });

    it('서비스에서 422 AppError 가 발생하면 422 를 응답한다', async () => {
      categoryService.createCategory.mockRejectedValue(
        new AppError(
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          ERROR_CODES.VALIDATION_ERROR,
          '카테고리 이름을 입력해주세요.'
        )
      );

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', BEARER_TOKEN)
        .send({ name: '  ' });

      // validate 미들웨어에서 먼저 잡히기 때문에 서비스 에러 대신 422 가 반환됨을 확인
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('서비스에서 422 AppError 가 직접 발생하면 422 응답 body 에 VALIDATION_ERROR 코드가 포함된다', async () => {
      // validate 미들웨어를 통과하는 유효한 name 으로 요청하되 서비스에서 422 throw
      categoryService.createCategory.mockRejectedValue(
        new AppError(
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          ERROR_CODES.VALIDATION_ERROR,
          '카테고리 이름을 입력해주세요.'
        )
      );

      // 유효한 name 으로 서비스 422 를 직접 테스트
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', BEARER_TOKEN)
        .send({ name: 'valid-name' });

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });
});
