'use strict';

jest.setTimeout(30000);

const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/db/pool');
const { registerAndLogin, cleanupUser, getDefaultCategoryId } = require('../helpers/setup');

describe('User Integration Tests', () => {
  const EMAIL = `test-user-${Date.now()}@test.com`;
  let token, userId;

  beforeAll(async () => {
    const auth = await registerAndLogin({ email: EMAIL, name: '사용자테스트' });
    token = auth.accessToken;
    userId = auth.user.id;
  });

  afterAll(async () => {
    // 혹시 deleteMe 테스트 후 남은 데이터 정리
    await cleanupUser(EMAIL);
  });

  describe('GET /api/users/me', () => {
    it('내 정보 조회 성공 → 200', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(EMAIL);
      expect(res.body.name).toBe('사용자테스트');
      expect(res.body.id).toBe(userId);
    });

    it('응답에 password 필드 없음 (보안)', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.password).toBeUndefined();
    });

    it('응답에 id, email, name, createdAt, updatedAt 포함', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBeDefined();
      expect(res.body.name).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();
    });

    it('토큰 없이 → 401', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('UC-13: 회원 탈퇴 (DELETE /api/users/me)', () => {
    const DELETE_EMAIL = `test-delete-${Date.now()}@test.com`;
    let deleteToken, deleteUserId;
    let createdTodoId;

    beforeAll(async () => {
      // 탈퇴할 사용자 생성
      const auth = await registerAndLogin({ email: DELETE_EMAIL, name: '탈퇴사용자' });
      deleteToken = auth.accessToken;
      deleteUserId = auth.user.id;

      // 할일 하나 생성 (CASCADE 삭제 확인용)
      const catId = await getDefaultCategoryId('일반');
      const todoRes = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${deleteToken}`)
        .send({ title: '탈퇴 전 할일', categoryId: catId });
      createdTodoId = todoRes.body.id;
    });

    afterAll(async () => {
      // 탈퇴 실패 시 정리
      await cleanupUser(DELETE_EMAIL);
    });

    it('회원 탈퇴 성공 → 204 No Content', async () => {
      const res = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${deleteToken}`);

      expect(res.status).toBe(204);
      expect(res.text).toBe('');
    });

    it('탈퇴 후 todos가 CASCADE 삭제됨 (DC-01)', async () => {
      // 삭제된 사용자의 todo가 DB에서 제거됐는지 확인
      const { rows } = await pool.query(
        'SELECT id FROM todos WHERE id = $1',
        [createdTodoId]
      );
      expect(rows.length).toBe(0);
    });

    it('탈퇴 후 같은 토큰으로 재접근 → 401 또는 404', async () => {
      // 탈퇴 후 토큰은 여전히 유효하지만, 사용자가 없으므로
      // (JWT Stateless 방식이므로 401이 아닐 수 있음)
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${deleteToken}`);

      // JWT는 여전히 유효하지만 사용자가 DB에 없으므로 404
      expect([401, 404]).toContain(res.status);
    });

    it('토큰 없이 탈퇴 → 401', async () => {
      const res = await request(app).delete('/api/users/me');
      expect(res.status).toBe(401);
    });
  });
});
