'use strict';

// ------------------------------------------------------------------ //
// categoryRepository.test.js
// src/db/pool.js 를 jest.mock 으로 완전히 모킹하여
// 실제 DB 연결 없이 categoryRepository 함수를 단위 테스트한다.
// ------------------------------------------------------------------ //

jest.mock('../../src/db/pool', () => ({
  pool: { query: jest.fn() },
}));

const { pool } = require('../../src/db/pool');
const {
  findAllByUser,
  findByNameAndUser,
  create,
  findDefaultGeneralCategory,
  findAccessible,
} = require('../../src/repositories/categoryRepository');

// ------------------------------------------------------------------ //
// 공통 픽스처
// ------------------------------------------------------------------ //
const USER_ID = 'user-uuid-001';
const CATEGORY_ID = 'cat-uuid-001';

const MOCK_CATEGORY_ROW = {
  id: CATEGORY_ID,
  userId: USER_ID,
  name: '업무',
  isDefault: false,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const MOCK_DEFAULT_CATEGORY_ROW = {
  id: 'default-cat-uuid',
  userId: null,
  name: '일반',
  isDefault: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.resetAllMocks();
});

// ==================================================================
// findAllByUser
// ==================================================================
describe('categoryRepository.findAllByUser', () => {
  it('pool.query 가 userId 파라미터를 포함해 호출된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_CATEGORY_ROW] });

    await findAllByUser(USER_ID);

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [, params] = pool.query.mock.calls[0];
    expect(params).toEqual([USER_ID]);
  });

  it('SQL 에 "user_id IS NULL OR user_id" 조건이 포함된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await findAllByUser(USER_ID);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/user_id IS NULL OR user_id/i);
  });

  it('SQL 에 "ORDER BY is_default DESC" 정렬 조건이 포함된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await findAllByUser(USER_ID);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/ORDER BY is_default DESC/i);
  });

  it('반환된 rows 배열을 그대로 반환한다', async () => {
    const mockRows = [MOCK_DEFAULT_CATEGORY_ROW, MOCK_CATEGORY_ROW];
    pool.query.mockResolvedValueOnce({ rows: mockRows });

    const result = await findAllByUser(USER_ID);

    expect(result).toEqual(mockRows);
    expect(result).toHaveLength(2);
  });

  it('rows 가 빈 배열이면 빈 배열을 반환한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await findAllByUser(USER_ID);

    expect(result).toEqual([]);
  });
});

// ==================================================================
// findByNameAndUser
// ==================================================================
describe('categoryRepository.findByNameAndUser', () => {
  it('pool.query 가 name 과 userId 파라미터로 호출된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await findByNameAndUser('업무', USER_ID);

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [, params] = pool.query.mock.calls[0];
    expect(params).toEqual(['업무', USER_ID]);
  });

  it('SQL 에 "LOWER(name) = LOWER($1)" 대소문자 무시 조건이 포함된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await findByNameAndUser('업무', USER_ID);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/LOWER\(name\) = LOWER\(\$1\)/i);
  });

  it('SQL 에 "user_id IS NULL OR user_id = $2" 조건이 포함된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await findByNameAndUser('업무', USER_ID);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/user_id IS NULL OR user_id = \$2/i);
  });

  it('결과가 존재하면 첫 번째 row 를 반환한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: CATEGORY_ID }] });

    const result = await findByNameAndUser('업무', USER_ID);

    expect(result).toEqual({ id: CATEGORY_ID });
  });

  it('결과가 없으면 null 을 반환한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await findByNameAndUser('없는카테고리', USER_ID);

    expect(result).toBeNull();
  });
});

// ==================================================================
// create
// ==================================================================
describe('categoryRepository.create', () => {
  it('pool.query 가 INSERT 쿼리로 호출된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_CATEGORY_ROW] });

    await create({ userId: USER_ID, name: '업무' });

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO categories/i);
  });

  it('userId 와 name 파라미터가 올바르게 전달된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_CATEGORY_ROW] });

    await create({ userId: USER_ID, name: '업무' });

    const [, params] = pool.query.mock.calls[0];
    expect(params[0]).toBe(USER_ID);
    expect(params[1]).toBe('업무');
  });

  it('SQL 에 is_default 값으로 false 가 포함된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_CATEGORY_ROW] });

    await create({ userId: USER_ID, name: '업무' });

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/false/i);
  });

  it('SQL 에 RETURNING 절이 포함된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_CATEGORY_ROW] });

    await create({ userId: USER_ID, name: '업무' });

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/RETURNING/i);
  });

  it('생성된 카테고리 row 를 camelCase 필드로 반환한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_CATEGORY_ROW] });

    const result = await create({ userId: USER_ID, name: '업무' });

    expect(result).toEqual(MOCK_CATEGORY_ROW);
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('isDefault');
    expect(result).toHaveProperty('createdAt');
  });
});

// ==================================================================
// findDefaultGeneralCategory
// ==================================================================
describe('categoryRepository.findDefaultGeneralCategory', () => {
  it("SQL 에 '일반' 카테고리 이름 조건이 포함된다", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 'default-id', name: '일반' }] });

    await findDefaultGeneralCategory();

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/일반/);
  });

  it('SQL 에 "is_default = true" 조건이 포함된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await findDefaultGeneralCategory();

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/is_default = true/i);
  });

  it('SQL 에 user_id IS NULL 조건이 포함된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await findDefaultGeneralCategory();

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/user_id IS NULL/i);
  });

  it('결과가 존재하면 첫 번째 row 를 반환한다', async () => {
    const mockRow = { id: 'default-id', name: '일반' };
    pool.query.mockResolvedValueOnce({ rows: [mockRow] });

    const result = await findDefaultGeneralCategory();

    expect(result).toEqual(mockRow);
  });

  it('결과가 없으면 null 을 반환한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await findDefaultGeneralCategory();

    expect(result).toBeNull();
  });
});

// ==================================================================
// findAccessible
// ==================================================================
describe('categoryRepository.findAccessible', () => {
  it('pool.query 가 categoryId 와 userId 파라미터로 호출된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: CATEGORY_ID }] });

    await findAccessible(USER_ID, CATEGORY_ID);

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [, params] = pool.query.mock.calls[0];
    expect(params).toEqual([CATEGORY_ID, USER_ID]);
  });

  it('SQL 에 "user_id IS NULL OR user_id = $2" 조건이 포함된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await findAccessible(USER_ID, CATEGORY_ID);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/user_id IS NULL OR user_id = \$2/i);
  });

  it('접근 가능한 카테고리가 존재하면 해당 row 를 반환한다', async () => {
    const mockRow = { id: CATEGORY_ID };
    pool.query.mockResolvedValueOnce({ rows: [mockRow] });

    const result = await findAccessible(USER_ID, CATEGORY_ID);

    expect(result).toEqual(mockRow);
  });

  it('접근 불가능한 카테고리(결과 없음)이면 null 을 반환한다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await findAccessible(USER_ID, 'other-cat-uuid');

    expect(result).toBeNull();
  });
});
