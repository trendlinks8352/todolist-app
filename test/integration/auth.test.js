'use strict';

jest.setTimeout(30000);

const request = require('supertest');
const app = require('../../src/app');
const { cleanupUser } = require('../helpers/setup');

describe('Auth Integration Tests', () => {
  const EMAIL = `test-auth-${Date.now()}@test.com`;
  const PASSWORD = 'TestPass123';
  const NAME = '테스터';


  afterAll(async () => {
    await cleanupUser(EMAIL);
  });

  describe('UC-01: 회원가입', () => {
    it('유효한 입력으로 회원가입 성공 → 201 + accessToken', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: EMAIL, password: PASSWORD, name: NAME });

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.user.email).toBe(EMAIL);
      expect(res.body.user.name).toBe(NAME);
      expect(res.body.user.password).toBeUndefined(); // password 미포함
    });

    it('중복 이메일 → 409 CONFLICT', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: EMAIL, password: PASSWORD, name: NAME });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('비밀번호 정책 위반 (8자 미만) → 422', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'other@test.com', password: 'abc123', name: NAME });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('비밀번호 정책 위반 (숫자 없음) → 422', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'other@test.com', password: 'abcdefgh', name: NAME });

      expect(res.status).toBe(422);
    });

    it('필수값 누락 (email 없음) → 422', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: PASSWORD, name: NAME });

      expect(res.status).toBe(422);
    });
  });

  describe('UC-02: 로그인', () => {
    it('올바른 이메일+비밀번호로 로그인 → 200 + accessToken', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(EMAIL);
    });

    it('잘못된 비밀번호 → 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: 'WrongPass999' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('존재하지 않는 이메일 → 401 (보안상 동일 메시지)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: PASSWORD });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
    });
  });

  describe('UC-03: 로그아웃', () => {
    let token;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: PASSWORD });
      token = res.body.accessToken;
    });

    it('유효한 토큰으로 로그아웃 → 200', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
    });

    it('토큰 없이 로그아웃 → 401', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(401);
    });
  });

  describe('BR-01: 인증 필요 API 토큰 없이 접근', () => {
    it('토큰 없이 GET /api/todos → 401', async () => {
      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(401);
    });

    it('토큰 없이 GET /api/categories → 401', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(401);
    });

    it('토큰 없이 GET /api/users/me → 401', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });
  });
});
