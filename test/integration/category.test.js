'use strict';

jest.setTimeout(30000);

const request = require('supertest');
const app = require('../../src/app');
const { registerAndLogin, cleanupUser } = require('../helpers/setup');

describe('Category Integration Tests', () => {
  const EMAIL = `test-cat-${Date.now()}@test.com`;
  let token;

  beforeAll(async () => {
    const auth = await registerAndLogin({ email: EMAIL });
    token = auth.accessToken;
  });

  afterAll(async () => {
    await cleanupUser(EMAIL);
  });

  describe('GET /api/categories', () => {
    it('기본 카테고리 3개 포함한 목록 반환 → 200', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const defaultCats = res.body.data.filter(c => c.isDefault === true);
      expect(defaultCats.length).toBeGreaterThanOrEqual(3);

      const names = defaultCats.map(c => c.name);
      expect(names).toContain('일반');
      expect(names).toContain('업무');
      expect(names).toContain('개인');
    });

    it('기본 카테고리가 먼저 정렬됨', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      const firstCat = res.body.data[0];
      expect(firstCat.isDefault).toBe(true);
    });

    it('각 카테고리에 id, name, isDefault, createdAt 포함', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      const cat = res.body.data[0];
      expect(cat.id).toBeDefined();
      expect(cat.name).toBeDefined();
      expect(typeof cat.isDefault).toBe('boolean');
      expect(cat.createdAt).toBeDefined();
    });
  });

  describe('UC-09: 사용자 정의 카테고리 생성', () => {
    const CAT_NAME = `테스트카테고리_${Date.now()}`;

    it('카테고리 생성 성공 → 201', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: CAT_NAME });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(CAT_NAME);
      expect(res.body.isDefault).toBe(false);
      expect(res.body.id).toBeDefined();
    });

    it('동일 이름(대소문자 무시) 중복 생성 → 409 (BR-10)', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: CAT_NAME });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('앞뒤 공백 포함 이름 → trim 후 중복 체크 (DC-04)', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `  ${CAT_NAME}  ` });

      // trim 후 기존 이름과 같으므로 409
      expect(res.status).toBe(409);
    });

    it('기본 카테고리 이름과 동일 → 409 (기본 카테고리 포함 중복 체크)', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '일반' });

      expect(res.status).toBe(409);
    });

    it('name 누락 → 422', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(422);
    });

    it('생성 후 목록 조회 시 새 카테고리 포함', async () => {
      const listRes = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      const newCat = listRes.body.data.find(c => c.name === CAT_NAME);
      expect(newCat).toBeDefined();
      expect(newCat.isDefault).toBe(false);
    });
  });
});
