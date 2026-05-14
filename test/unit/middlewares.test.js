'use strict';

// ------------------------------------------------------------------ //
// 공통 미들웨어 통합 단위 테스트
//   - errorHandler (AppError 클래스 포함)
//   - authenticate (auth 미들웨어)
//   - validate (validate 미들웨어)
//
// auth 미들웨어는 tokenUtils 를 jest.mock 으로 모킹한다.
// validate 미들웨어는 Joi 스키마를 직접 생성해 테스트한다.
// 일부 케이스는 supertest + express 미니앱으로 HTTP 레벨 검증을 수행한다.
// ------------------------------------------------------------------ //

jest.mock('../../src/utils/tokenUtils');

const express = require('express');
const request = require('supertest');
const Joi = require('joi');

const { verifyToken } = require('../../src/utils/tokenUtils');
const { AppError, errorHandler } = require('../../src/middlewares/errorHandler');
const { authenticate } = require('../../src/middlewares/auth');
const { validate } = require('../../src/middlewares/validate');
const { HTTP_STATUS, ERROR_CODES } = require('../../src/constants/constants');

// ------------------------------------------------------------------ //
// 헬퍼: 테스트용 Express 앱 팩토리
// 라우트 핸들러를 주입하고 errorHandler 를 마지막에 등록한다.
// ------------------------------------------------------------------ //
function buildApp(routeHandler) {
  const app = express();
  app.use(express.json());
  app.use('/test', routeHandler);
  app.use(errorHandler);
  return app;
}

// ------------------------------------------------------------------ //
// 헬퍼: mock req / res / next 객체 생성
// ------------------------------------------------------------------ //
function makeMocks(overrides = {}) {
  const req = {
    headers: {},
    body: {},
    query: {},
    user: undefined,
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

// ==================================================================
// 1. AppError 클래스 검증
// ==================================================================
describe('AppError', () => {
  it('statusCode, code, message 가 올바르게 설정된다', () => {
    const err = new AppError(404, 'NOT_FOUND', '리소스를 찾을 수 없습니다.');

    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('리소스를 찾을 수 없습니다.');
  });

  it('name 이 "AppError" 로 설정된다', () => {
    const err = new AppError(400, 'BAD_REQUEST', '잘못된 요청');

    expect(err.name).toBe('AppError');
  });

  it('Error 의 인스턴스이다', () => {
    const err = new AppError(500, 'INTERNAL_ERROR', '서버 오류');

    expect(err).toBeInstanceOf(Error);
  });

  it('AppError 의 인스턴스이다', () => {
    const err = new AppError(401, 'UNAUTHORIZED', '인증 필요');

    expect(err).toBeInstanceOf(AppError);
  });

  it('stack 트레이스가 존재한다', () => {
    const err = new AppError(403, 'FORBIDDEN', '권한 없음');

    expect(err.stack).toBeDefined();
    expect(typeof err.stack).toBe('string');
  });
});

// ==================================================================
// 2. errorHandler 미들웨어 검증
// ==================================================================
describe('errorHandler', () => {
  let savedNodeEnv;

  beforeEach(() => {
    savedNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    if (savedNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = savedNodeEnv;
    }
  });

  // ------------------------------------------------------------ //
  // AppError 처리
  // ------------------------------------------------------------ //
  describe('AppError 처리', () => {
    it('AppError 의 statusCode 로 응답한다', () => {
      const { req, res, next } = makeMocks();
      const err = new AppError(404, 'NOT_FOUND', '없음');

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('{ error: { code, message } } 형식의 JSON 을 반환한다', () => {
      const { req, res, next } = makeMocks();
      const err = new AppError(409, 'CONFLICT', '충돌 발생');

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: { code: 'CONFLICT', message: '충돌 발생' },
      });
    });

    it('AppError 에 fields 가 있으면 응답에 fields 가 포함된다', () => {
      const { req, res, next } = makeMocks();
      const err = new AppError(422, 'VALIDATION_ERROR', '입력값 오류');
      err.fields = [{ field: 'email', message: '"email" is required' }];

      errorHandler(err, req, res, next);

      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.error.fields).toEqual([
        { field: 'email', message: '"email" is required' },
      ]);
    });

    it('AppError 에 fields 가 없으면 응답에 fields 키가 없다', () => {
      const { req, res, next } = makeMocks();
      const err = new AppError(401, 'UNAUTHORIZED', '인증 필요');

      errorHandler(err, req, res, next);

      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.error.fields).toBeUndefined();
    });
  });

  // ------------------------------------------------------------ //
  // 일반 Error 처리 (500)
  // ------------------------------------------------------------ //
  describe('일반 Error 처리', () => {
    it('일반 Error 에 대해 500 을 반환한다', () => {
      const { req, res, next } = makeMocks();
      process.env.NODE_ENV = 'development';
      const err = new Error('예상치 못한 오류');

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });

    it('응답 code 가 INTERNAL_ERROR 이다', () => {
      const { req, res, next } = makeMocks();
      process.env.NODE_ENV = 'development';
      const err = new Error('예상치 못한 오류');

      errorHandler(err, req, res, next);

      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    });

    it('NODE_ENV=development 이면 stack 이 응답에 포함된다', () => {
      const { req, res, next } = makeMocks();
      process.env.NODE_ENV = 'development';
      const err = new Error('디버그 오류');

      errorHandler(err, req, res, next);

      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.error.stack).toBeDefined();
    });

    it('NODE_ENV=production 이면 stack 이 응답에 포함되지 않는다', () => {
      const { req, res, next } = makeMocks();
      process.env.NODE_ENV = 'production';
      const err = new Error('프로덕션 오류');

      errorHandler(err, req, res, next);

      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.error.stack).toBeUndefined();
    });
  });

  // ------------------------------------------------------------ //
  // HTTP 레벨 통합 검증 (supertest)
  // ------------------------------------------------------------ //
  describe('HTTP 레벨 통합 (supertest)', () => {
    it('AppError → HTTP 응답 statusCode 와 JSON body 가 일치한다', async () => {
      const app = buildApp((req, res, next) => {
        next(new AppError(403, 'FORBIDDEN', '접근 금지'));
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toBe('접근 금지');
    });

    it('일반 Error → HTTP 500 응답', async () => {
      const app = buildApp((req, res, next) => {
        next(new Error('unexpected'));
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    });
  });
});

// ==================================================================
// 3. authenticate 미들웨어 검증
// ==================================================================
describe('authenticate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------------------------ //
  // Authorization 헤더 누락 / 형식 오류
  // ------------------------------------------------------------ //
  describe('Authorization 헤더 검증', () => {
    it('Authorization 헤더가 없으면 next(AppError 401) 를 호출한다', () => {
      const { req, res, next } = makeMocks({ headers: {} });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(err.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('"Bearer " 접두사가 없으면(예: "Token xxx") next(AppError 401) 를 호출한다', () => {
      const { req, res, next } = makeMocks({
        headers: { authorization: 'Token some-token' },
      });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('"Bearer" 뒤에 공백이 없으면 next(AppError 401) 를 호출한다', () => {
      const { req, res, next } = makeMocks({
        headers: { authorization: 'Bearertoken' },
      });

      authenticate(req, res, next);

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  // ------------------------------------------------------------ //
  // verifyToken 실패
  // ------------------------------------------------------------ //
  describe('토큰 검증 실패', () => {
    it('verifyToken 이 throw 하면 next(AppError 401) 를 호출한다', () => {
      verifyToken.mockImplementation(() => {
        throw new Error('jwt expired');
      });
      const { req, res, next } = makeMocks({
        headers: { authorization: 'Bearer expired-token' },
      });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(err.message).toBe('유효하지 않거나 만료된 토큰입니다.');
    });
  });

  // ------------------------------------------------------------ //
  // 유효한 토큰
  // ------------------------------------------------------------ //
  describe('유효한 토큰', () => {
    it('verifyToken 성공 시 req.user 에 { id, email } 을 주입한다', () => {
      verifyToken.mockReturnValue({ id: 42, email: 'user@example.com' });
      const { req, res, next } = makeMocks({
        headers: { authorization: 'Bearer valid-token' },
      });

      authenticate(req, res, next);

      expect(req.user).toEqual({ id: 42, email: 'user@example.com' });
    });

    it('verifyToken 성공 시 next() 를 에러 없이 호출한다', () => {
      verifyToken.mockReturnValue({ id: 1, email: 'test@example.com' });
      const { req, res, next } = makeMocks({
        headers: { authorization: 'Bearer valid-token' },
      });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(); // 인수 없이 호출
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('verifyToken 에 "Bearer " 이후의 토큰 문자열만 전달된다', () => {
      verifyToken.mockReturnValue({ id: 1, email: 'a@b.com' });
      const { req, res, next } = makeMocks({
        headers: { authorization: 'Bearer actual-token-value' },
      });

      authenticate(req, res, next);

      expect(verifyToken).toHaveBeenCalledWith('actual-token-value');
    });
  });

  // ------------------------------------------------------------ //
  // HTTP 레벨 통합 검증 (supertest)
  // ------------------------------------------------------------ //
  describe('HTTP 레벨 통합 (supertest)', () => {
    it('Authorization 헤더 없는 요청 → 401 JSON 응답', async () => {
      const app = express();
      app.use(express.json());
      app.get('/protected', authenticate, (req, res) => res.json({ ok: true }));
      app.use(errorHandler);

      const res = await request(app).get('/protected');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('유효한 토큰 → 200 응답 및 req.user 주입 확인', async () => {
      verifyToken.mockReturnValue({ id: 99, email: 'ok@example.com' });
      const app = express();
      app.use(express.json());
      app.get('/protected', authenticate, (req, res) => res.json({ user: req.user }));
      app.use(errorHandler);

      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual({ id: 99, email: 'ok@example.com' });
    });
  });
});

// ==================================================================
// 4. validate 미들웨어 검증
// ==================================================================
describe('validate', () => {
  // 테스트용 Joi 스키마
  const bodySchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().optional(),
  });

  const querySchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------------------------ //
  // 유효한 입력
  // ------------------------------------------------------------ //
  describe('유효한 입력', () => {
    it('유효한 body 이면 next() 를 에러 없이 호출한다', () => {
      const { req, res, next } = makeMocks({ body: { title: '할일 제목' } });
      const middleware = validate(bodySchema, 'body');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('선택 필드를 포함한 유효한 body 도 next() 를 에러 없이 호출한다', () => {
      const { req, res, next } = makeMocks({
        body: { title: '할일', description: '설명' },
      });
      const middleware = validate(bodySchema, 'body');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  // ------------------------------------------------------------ //
  // 유효성 오류 — 단일 필드
  // ------------------------------------------------------------ //
  describe('단일 필드 유효성 오류', () => {
    it('필수 필드(title) 누락 시 next(AppError 422) 를 호출한다', () => {
      const { req, res, next } = makeMocks({ body: {} });
      const middleware = validate(bodySchema, 'body');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(err.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('오류 응답에 fields 배열이 포함된다', () => {
      const { req, res, next } = makeMocks({ body: {} });
      const middleware = validate(bodySchema, 'body');

      middleware(req, res, next);

      const err = next.mock.calls[0][0];
      expect(Array.isArray(err.fields)).toBe(true);
      expect(err.fields.length).toBeGreaterThan(0);
    });

    it('fields 배열의 각 항목이 { field, message } 형태이다', () => {
      const { req, res, next } = makeMocks({ body: {} });
      const middleware = validate(bodySchema, 'body');

      middleware(req, res, next);

      const err = next.mock.calls[0][0];
      err.fields.forEach((f) => {
        expect(f).toHaveProperty('field');
        expect(f).toHaveProperty('message');
        expect(typeof f.field).toBe('string');
        expect(typeof f.message).toBe('string');
      });
    });

    it('title 필드의 오류는 field 값이 "title" 이다', () => {
      const { req, res, next } = makeMocks({ body: {} });
      const middleware = validate(bodySchema, 'body');

      middleware(req, res, next);

      const err = next.mock.calls[0][0];
      const titleError = err.fields.find((f) => f.field === 'title');
      expect(titleError).toBeDefined();
    });
  });

  // ------------------------------------------------------------ //
  // 유효성 오류 — 복수 필드 (abortEarly: false)
  // ------------------------------------------------------------ //
  describe('복수 필드 유효성 오류 (abortEarly: false)', () => {
    // 두 필드 모두 필수인 스키마
    const strictSchema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
    });

    it('두 필드 오류가 모두 fields 배열에 포함된다', () => {
      const { req, res, next } = makeMocks({ body: {} });
      const middleware = validate(strictSchema, 'body');

      middleware(req, res, next);

      const err = next.mock.calls[0][0];
      expect(err.fields.length).toBe(2);
    });

    it('fields 배열에 name 과 email 오류가 각각 존재한다', () => {
      const { req, res, next } = makeMocks({ body: {} });
      const middleware = validate(strictSchema, 'body');

      middleware(req, res, next);

      const err = next.mock.calls[0][0];
      const fieldNames = err.fields.map((f) => f.field);
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('email');
    });
  });

  // ------------------------------------------------------------ //
  // target='query' 검증
  // ------------------------------------------------------------ //
  describe("target='query' 검증", () => {
    it('유효한 query 이면 next() 를 에러 없이 호출한다', () => {
      const { req, res, next } = makeMocks({ query: { page: '1', limit: '10' } });
      const middleware = validate(querySchema, 'query');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('query 검증 실패 시 next(AppError 422) 를 호출한다', () => {
      // limit 이 100 초과
      const { req, res, next } = makeMocks({ query: { limit: '999' } });
      const middleware = validate(querySchema, 'query');

      middleware(req, res, next);

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('target 이 "query" 이면 req.body 대신 req.query 를 검증한다', () => {
      // body 에 title 있어도 query 검증이므로 body 는 무시
      const { req, res, next } = makeMocks({
        body: { title: '있음' },
        query: {},
      });
      const middleware = validate(querySchema, 'query');

      // querySchema 의 모든 필드가 optional 이므로 빈 query 는 유효
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  // ------------------------------------------------------------ //
  // HTTP 레벨 통합 검증 (supertest)
  // ------------------------------------------------------------ //
  describe('HTTP 레벨 통합 (supertest)', () => {
    it('유효성 오류 → 422 + fields 배열 JSON 응답', async () => {
      const app = express();
      app.use(express.json());
      app.post(
        '/test',
        validate(bodySchema, 'body'),
        (req, res) => res.status(200).json({ ok: true })
      );
      app.use(errorHandler);

      // title 누락
      const res = await request(app).post('/test').send({});

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(Array.isArray(res.body.error.fields)).toBe(true);
      expect(res.body.error.fields.length).toBeGreaterThan(0);
    });

    it('유효한 body → 200 응답', async () => {
      const app = express();
      app.use(express.json());
      app.post(
        '/test',
        validate(bodySchema, 'body'),
        (req, res) => res.status(200).json({ ok: true })
      );
      app.use(errorHandler);

      const res = await request(app)
        .post('/test')
        .send({ title: '유효한 제목' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('복수 필드 오류 → fields 배열에 모든 오류 포함', async () => {
      const strictSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
      });
      const app = express();
      app.use(express.json());
      app.post(
        '/test',
        validate(strictSchema, 'body'),
        (req, res) => res.status(200).json({ ok: true })
      );
      app.use(errorHandler);

      const res = await request(app).post('/test').send({});

      expect(res.status).toBe(422);
      expect(res.body.error.fields.length).toBe(2);
    });
  });
});
