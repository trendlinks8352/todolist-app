'use strict';

jest.setTimeout(30000);

const request = require('supertest');
const app = require('../../src/app');
const { registerAndLogin, cleanupUser, getDefaultCategoryId } = require('../helpers/setup');

describe('Todo Integration Tests', () => {
  const EMAIL1 = `test-todo1-${Date.now()}@test.com`;
  const EMAIL2 = `test-todo2-${Date.now()}@test.com`;
  let token1, userId1, token2, userId2;
  let defaultCategoryId;
  const FUTURE_DATE = '2099-12-31';
  const PAST_DATE = '2020-01-01';

  beforeAll(async () => {
    const user1 = await registerAndLogin({ email: EMAIL1 });
    token1 = user1.accessToken;
    userId1 = user1.user.id;

    const user2 = await registerAndLogin({ email: EMAIL2 });
    token2 = user2.accessToken;
    userId2 = user2.user.id;

    defaultCategoryId = await getDefaultCategoryId('일반');
  });

  afterAll(async () => {
    await cleanupUser(EMAIL1);
    await cleanupUser(EMAIL2);
  });

  describe('UC-05: 할일 등록', () => {
    it('필수 필드로 할일 등록 성공 → 201', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: '테스트 할일', categoryId: defaultCategoryId });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('테스트 할일');
      expect(res.body.categoryId).toBe(defaultCategoryId);
      expect(res.body.isCompleted).toBe(false);
      expect(res.body.category).toBeDefined();
      expect(res.body.category.name).toBe('일반');
    });

    it('전체 필드로 할일 등록 성공 → 201', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: '전체 필드 할일',
          description: '설명입니다',
          dueDate: FUTURE_DATE,
          categoryId: defaultCategoryId,
        });

      expect(res.status).toBe(201);
      expect(res.body.description).toBe('설명입니다');
      expect(res.body.dueDate).toBe(FUTURE_DATE);
    });

    it('categoryId 누락 → 422 (BR-05)', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: '카테고리 없는 할일' });

      expect(res.status).toBe(422);
      expect(res.body.error.fields.some(f => f.field === 'categoryId')).toBe(true);
    });

    it('과거 dueDate → 422 (BR-07)', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: '과거 날짜', dueDate: PAST_DATE, categoryId: defaultCategoryId });

      expect(res.status).toBe(422);
    });

    it('title 없음 → 422', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token1}`)
        .send({ categoryId: defaultCategoryId });

      expect(res.status).toBe(422);
    });
  });

  describe('UC-07: 할일 목록 조회 및 필터', () => {
    let todoId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: '필터 테스트 할일', categoryId: defaultCategoryId, dueDate: FUTURE_DATE });
      todoId = res.body.id;
    });

    it('기본 조회 → 200 + { data, pagination }', async () => {
      const res = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });

    it('categoryId 필터 적용 → 해당 카테고리만 반환', async () => {
      const res = await request(app)
        .get(`/api/todos?categoryId=${defaultCategoryId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(t => t.categoryId === defaultCategoryId)).toBe(true);
    });

    it('isCompleted=false 필터 → 미완료만 반환', async () => {
      const res = await request(app)
        .get('/api/todos?isCompleted=false')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(t => t.isCompleted === false)).toBe(true);
    });

    it('dueDate 기간 필터 (dueDateFrom > dueDateTo) → 422 (DC-08)', async () => {
      const res = await request(app)
        .get('/api/todos?dueDateFrom=2099-12-31&dueDateTo=2099-01-01')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(422);
    });

    it('본인 할일만 반환 (BR-03) — 다른 사용자 데이터 미포함', async () => {
      const res = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${token1}`);

      const userIds = res.body.data.map(t => t.userId);
      expect(userIds.every(id => id === userId1)).toBe(true);
    });

    it('page=1&size=2 페이지네이션 동작', async () => {
      const res = await request(app)
        .get('/api/todos?page=1&size=2')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.size).toBe(2);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('UC-06: 할일 수정', () => {
    let todoId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: '수정 전 할일', categoryId: defaultCategoryId });
      todoId = res.body.id;
    });

    it('본인 할일 수정 성공 → 200', async () => {
      const res = await request(app)
        .put(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: '수정 후 할일', categoryId: defaultCategoryId });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('수정 후 할일');
    });

    it('타인 할일 수정 → 403 (BR-03)', async () => {
      const res = await request(app)
        .put(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ title: '해킹시도', categoryId: defaultCategoryId });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('존재하지 않는 할일 수정 → 404', async () => {
      const res = await request(app)
        .put('/api/todos/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: '없는 할일', categoryId: defaultCategoryId });

      expect(res.status).toBe(404);
    });
  });

  describe('UC-08: 할일 완료 처리 / 취소 (BR-06)', () => {
    let todoId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: '완료 테스트 할일', categoryId: defaultCategoryId });
      todoId = res.body.id;
    });

    it('미완료 할일 완료 처리 → isCompleted=true, completedAt 기록', async () => {
      const res = await request(app)
        .patch(`/api/todos/${todoId}/complete`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.isCompleted).toBe(true);
      expect(res.body.completedAt).not.toBeNull();
    });

    it('완료 할일 다시 완료 취소 → isCompleted=false, completedAt=null', async () => {
      const res = await request(app)
        .patch(`/api/todos/${todoId}/complete`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.isCompleted).toBe(false);
      expect(res.body.completedAt).toBeNull();
    });

    it('타인 할일 완료 처리 → 403', async () => {
      const res = await request(app)
        .patch(`/api/todos/${todoId}/complete`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
    });
  });

  describe('UC-12: 할일 삭제', () => {
    let todoId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: '삭제될 할일', categoryId: defaultCategoryId });
      todoId = res.body.id;
    });

    it('타인 할일 삭제 → 403 (BR-03)', async () => {
      const res = await request(app)
        .delete(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
    });

    it('본인 할일 삭제 성공 → 204 (UC-12)', async () => {
      const res = await request(app)
        .delete(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(204);
      expect(res.text).toBe('');
    });

    it('삭제된 할일 재조회 → 404', async () => {
      const res = await request(app)
        .delete(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
    });
  });
});
