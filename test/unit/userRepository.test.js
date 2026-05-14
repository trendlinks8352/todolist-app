'use strict';

// ------------------------------------------------------------------ //
// userRepository.test.js
// src/db/pool.js 를 jest.mock 으로 완전히 모킹하여
// 실제 DB 연결 없이 repository 함수를 단위 테스트한다.
// ------------------------------------------------------------------ //

jest.mock('../../src/db/pool', () => ({
  pool: { query: jest.fn() },
  withTransaction: jest.fn(),
}));

const { pool } = require('../../src/db/pool');
const {
  findByEmail,
  create,
  findById,
  deleteById,
} = require('../../src/repositories/userRepository');

// ------------------------------------------------------------------ //
// 공통 픽스처
// ------------------------------------------------------------------ //
const MOCK_USER_ROW = {
  id: 'uuid-001',
  email: 'user@example.com',
  password: '$2b$10$hashedpassword',
  name: '홍길동',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const MOCK_USER_NO_PW = {
  id: 'uuid-001',
  email: 'user@example.com',
  name: '홍길동',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ==================================================================
// findByEmail
// ==================================================================
describe('userRepository.findByEmail', () => {
  it('사용자가 존재하면 camelCase 필드를 포함한 사용자 객체를 반환한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_USER_ROW] });

    const result = await findByEmail('user@example.com');

    expect(result).toEqual(MOCK_USER_ROW);
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  it('사용자가 없으면 null 을 반환한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await findByEmail('notfound@example.com');

    expect(result).toBeNull();
  });

  it('올바른 SQL 과 이메일 파라미터로 pool.query 를 호출한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_USER_ROW] });

    await findByEmail('user@example.com');

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/SELECT/i);
    expect(sql).toMatch(/FROM users/i);
    expect(sql).toMatch(/WHERE email = \$1/i);
    expect(params).toEqual(['user@example.com']);
  });

  it('반환된 사용자 객체에 createdAt, updatedAt 이 스네이크케이스가 아닌 camelCase 로 포함된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_USER_ROW] });

    const result = await findByEmail('user@example.com');

    // SQL 쿼리에서 AS "createdAt" 으로 매핑되므로 camelCase 로 접근 가능해야 한다
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
    expect(result).not.toHaveProperty('created_at');
    expect(result).not.toHaveProperty('updated_at');
  });
});

// ==================================================================
// create
// ==================================================================
describe('userRepository.create', () => {
  const CREATED_ROW = {
    id: 'uuid-002',
    email: 'new@example.com',
    name: '김철수',
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  };

  it('성공 시 password 를 포함하지 않는 생성된 사용자 객체를 반환한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [CREATED_ROW] });

    const result = await create({
      email: 'new@example.com',
      password: '$2b$10$hashed',
      name: '김철수',
    });

    expect(result).toEqual(CREATED_ROW);
    // RETURNING 절에 password 가 없으므로 반환값에 password 필드가 없어야 한다
    expect(result).not.toHaveProperty('password');
  });

  it('email, password(해시), name 파라미터로 pool.query 를 호출한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [CREATED_ROW] });

    await create({
      email: 'new@example.com',
      password: '$2b$10$hashed',
      name: '김철수',
    });

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO users/i);
    expect(params).toEqual(['new@example.com', '$2b$10$hashed', '김철수']);
  });

  it('INSERT 쿼리의 RETURNING 절에 password 가 포함되지 않는다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [CREATED_ROW] });

    await create({ email: 'new@example.com', password: 'hashed', name: '김' });

    const [sql] = pool.query.mock.calls[0];
    // RETURNING 절에 password 컬럼이 없어야 한다
    expect(sql).toMatch(/RETURNING/i);
    const returningPart = sql.substring(sql.toUpperCase().indexOf('RETURNING'));
    expect(returningPart).not.toMatch(/\bpassword\b/i);
  });
});

// ==================================================================
// findById
// ==================================================================
describe('userRepository.findById', () => {
  it('사용자가 존재하면 사용자 객체를 반환한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_USER_NO_PW] });

    const result = await findById('uuid-001');

    expect(result).toEqual(MOCK_USER_NO_PW);
  });

  it('반환된 사용자 객체에 password 필드가 없다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_USER_NO_PW] });

    const result = await findById('uuid-001');

    expect(result).not.toHaveProperty('password');
  });

  it('사용자가 없으면 null 을 반환한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await findById('nonexistent-id');

    expect(result).toBeNull();
  });

  it('올바른 SQL 과 id 파라미터로 pool.query 를 호출한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_USER_NO_PW] });

    await findById('uuid-001');

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/FROM users/i);
    expect(sql).toMatch(/WHERE id = \$1/i);
    expect(params).toEqual(['uuid-001']);
  });
});

// ==================================================================
// deleteById
// ==================================================================
describe('userRepository.deleteById', () => {
  it('DELETE 쿼리를 실행하기 위해 pool.query 를 호출한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await deleteById('uuid-001');

    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('올바른 DELETE SQL 과 id 파라미터로 pool.query 를 호출한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await deleteById('uuid-001');

    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/DELETE FROM users/i);
    expect(params).toEqual(['uuid-001']);
  });

  it('반환값은 undefined 이다 (void 함수)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await deleteById('uuid-001');

    expect(result).toBeUndefined();
  });
});
