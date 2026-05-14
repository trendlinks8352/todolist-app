'use strict';

// ------------------------------------------------------------------ //
// todoRepository.test.js
// pool.query 를 jest.mock 으로 대체하여 실제 DB 연결 없이
// todoRepository 의 SQL 생성 및 반환값 처리를 단위 테스트한다.
// ------------------------------------------------------------------ //

jest.mock('../../src/db/pool', () => ({
  pool: { query: jest.fn() },
}));

const { pool } = require('../../src/db/pool');
const todoRepository = require('../../src/repositories/todoRepository');

// ------------------------------------------------------------------ //
// 공통 픽스처
// ------------------------------------------------------------------ //
const USER_ID = 'user-uuid-0001';
const TODO_ID = 'todo-uuid-0001';
const CATEGORY_ID = 'cat-uuid-0001';

const MOCK_TODO = {
  id: TODO_ID,
  userId: USER_ID,
  categoryId: CATEGORY_ID,
  title: '테스트 할일',
  description: '설명',
  dueDate: '2099-12-31',
  isCompleted: false,
  completedAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  category: { id: CATEGORY_ID, name: '일반', isDefault: true },
};

beforeEach(() => {
  // resetAllMocks: mock 호출 기록 + mockResolvedValueOnce 큐 모두 초기화
  jest.resetAllMocks();
});

// ==================================================================
// find
// ==================================================================
describe('todoRepository.find', () => {
  describe('기본 조건 (userId 만)', () => {
    beforeEach(() => {
      // COUNT 쿼리 응답 → DATA 쿼리 응답 순서로 설정
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [MOCK_TODO, { ...MOCK_TODO, id: 'todo-uuid-0002' }] });
    });

    it('pool.query 가 COUNT + DATA 쿼리로 2번 호출된다', async () => {
      await todoRepository.find({ userId: USER_ID });
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('첫 번째 쿼리는 COUNT 를 포함한다', async () => {
      await todoRepository.find({ userId: USER_ID });
      const firstCall = pool.query.mock.calls[0];
      expect(firstCall[0]).toMatch(/COUNT/i);
    });

    it('두 번째 쿼리는 LIMIT / OFFSET 을 포함한다', async () => {
      await todoRepository.find({ userId: USER_ID });
      const secondCall = pool.query.mock.calls[1];
      expect(secondCall[0]).toMatch(/LIMIT/i);
      expect(secondCall[0]).toMatch(/OFFSET/i);
    });

    it('반환값 구조가 { data, pagination } 형태이다', async () => {
      const result = await todoRepository.find({ userId: USER_ID });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
    });

    it('pagination 에 page, size, total, totalPages 가 포함된다', async () => {
      const result = await todoRepository.find({ userId: USER_ID });
      expect(result.pagination).toMatchObject({
        page: 1,
        size: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('data 배열에 두 개의 todo 가 포함된다', async () => {
      const result = await todoRepository.find({ userId: USER_ID });
      expect(result.data).toHaveLength(2);
    });
  });

  describe('categoryId 필터', () => {
    beforeEach(() => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [MOCK_TODO] });
    });

    it('COUNT 쿼리에 category_id 조건이 포함된다', async () => {
      await todoRepository.find({ userId: USER_ID, categoryId: CATEGORY_ID });
      const countQuery = pool.query.mock.calls[0][0];
      expect(countQuery).toMatch(/category_id/);
    });

    it('COUNT 쿼리 파라미터에 categoryId 값이 포함된다', async () => {
      await todoRepository.find({ userId: USER_ID, categoryId: CATEGORY_ID });
      const countParams = pool.query.mock.calls[0][1];
      expect(countParams).toContain(CATEGORY_ID);
    });
  });

  describe('isCompleted 필터', () => {
    beforeEach(() => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [MOCK_TODO] });
    });

    it('COUNT 쿼리에 is_completed 조건이 포함된다', async () => {
      await todoRepository.find({ userId: USER_ID, isCompleted: false });
      const countQuery = pool.query.mock.calls[0][0];
      expect(countQuery).toMatch(/is_completed/);
    });

    it('COUNT 쿼리 파라미터에 isCompleted 값이 포함된다', async () => {
      await todoRepository.find({ userId: USER_ID, isCompleted: false });
      const countParams = pool.query.mock.calls[0][1];
      expect(countParams).toContain(false);
    });
  });

  describe('dueDateFrom / dueDateTo 필터', () => {
    beforeEach(() => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [MOCK_TODO] });
    });

    it('COUNT 쿼리에 due_date >= 조건이 포함된다', async () => {
      await todoRepository.find({ userId: USER_ID, dueDateFrom: '2099-01-01' });
      const countQuery = pool.query.mock.calls[0][0];
      expect(countQuery).toMatch(/due_date\s*>=/);
    });

    it('COUNT 쿼리에 due_date <= 조건이 포함된다', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [MOCK_TODO] });

      await todoRepository.find({ userId: USER_ID, dueDateTo: '2099-12-31' });
      const countQuery = pool.query.mock.calls[0][0];
      expect(countQuery).toMatch(/due_date\s*<=/);
    });
  });

  describe('페이지네이션', () => {
    beforeEach(() => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '50' }] })
        .mockResolvedValueOnce({ rows: [] });
    });

    it('page=3, size=10 → DATA 쿼리 파라미터에 size=10, offset=20 이 포함된다', async () => {
      await todoRepository.find({ userId: USER_ID, page: 3, size: 10 });
      const dataParams = pool.query.mock.calls[1][1];
      // 마지막 두 파라미터가 [size, offset] = [10, 20]
      const lastTwo = dataParams.slice(-2);
      expect(lastTwo).toEqual([10, 20]);
    });

    it('page=1, size=20(기본) → offset=0', async () => {
      await todoRepository.find({ userId: USER_ID });
      const dataParams = pool.query.mock.calls[1][1];
      const lastTwo = dataParams.slice(-2);
      expect(lastTwo).toEqual([20, 0]);
    });

    it('totalPages 가 Math.ceil(total/size) 로 계산된다', async () => {
      const result = await todoRepository.find({ userId: USER_ID, page: 1, size: 10 });
      // total=50, size=10 → totalPages=5
      expect(result.pagination.totalPages).toBe(5);
    });
  });

  describe('빈 결과', () => {
    beforeEach(() => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });
    });

    it('data 빈 배열 반환', async () => {
      const result = await todoRepository.find({ userId: USER_ID });
      expect(result.data).toEqual([]);
    });

    it('total=0 이면 totalPages=0 반환', async () => {
      const result = await todoRepository.find({ userId: USER_ID });
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });
});

// ==================================================================
// findById
// ==================================================================
describe('todoRepository.findById', () => {
  it('존재하는 id → todo 객체 반환', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_TODO] });

    const result = await todoRepository.findById(TODO_ID);
    expect(result).toEqual(MOCK_TODO);
  });

  it('존재하지 않는 id → null 반환', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await todoRepository.findById('nonexistent-id');
    expect(result).toBeNull();
  });

  it('pool.query 가 id 파라미터로 호출된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_TODO] });

    await todoRepository.findById(TODO_ID);
    expect(pool.query).toHaveBeenCalledTimes(1);
    const [, params] = pool.query.mock.calls[0];
    expect(params).toEqual([TODO_ID]);
  });
});

// ==================================================================
// create
// ==================================================================
describe('todoRepository.create', () => {
  const CREATE_INPUT = {
    userId: USER_ID,
    categoryId: CATEGORY_ID,
    title: '새 할일',
    description: '설명',
    dueDate: '2099-06-30',
  };

  beforeEach(() => {
    // INSERT RETURNING id → findById 조회 순서
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: TODO_ID }] })
      .mockResolvedValueOnce({ rows: [MOCK_TODO] });
  });

  it('INSERT 쿼리 후 findById 를 호출해 생성된 todo 를 반환한다', async () => {
    const result = await todoRepository.create(CREATE_INPUT);
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(result).toEqual(MOCK_TODO);
  });

  it('INSERT 쿼리의 파라미터 순서가 올바르다 (userId, categoryId, title, description, dueDate)', async () => {
    await todoRepository.create(CREATE_INPUT);
    const insertParams = pool.query.mock.calls[0][1];
    expect(insertParams[0]).toBe(USER_ID);
    expect(insertParams[1]).toBe(CATEGORY_ID);
    expect(insertParams[2]).toBe('새 할일');
    expect(insertParams[3]).toBe('설명');
    expect(insertParams[4]).toBe('2099-06-30');
  });

  it('description undefined → null 로 INSERT 된다', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: TODO_ID }] })
      .mockResolvedValueOnce({ rows: [MOCK_TODO] });

    await todoRepository.create({ ...CREATE_INPUT, description: undefined });
    const insertParams = pool.query.mock.calls[0][1];
    expect(insertParams[3]).toBeNull();
  });

  it('dueDate undefined → null 로 INSERT 된다', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: TODO_ID }] })
      .mockResolvedValueOnce({ rows: [MOCK_TODO] });

    await todoRepository.create({ ...CREATE_INPUT, dueDate: undefined });
    const insertParams = pool.query.mock.calls[0][1];
    expect(insertParams[4]).toBeNull();
  });
});

// ==================================================================
// update
// ==================================================================
describe('todoRepository.update', () => {
  beforeEach(() => {
    // 이전 describe 블록의 남은 mockResolvedValueOnce 오염 방지
    pool.query.mockReset();
    // UPDATE 쿼리 → findById 쿼리
    pool.query
      .mockResolvedValueOnce({ rows: [] })           // UPDATE
      .mockResolvedValueOnce({ rows: [MOCK_TODO] }); // findById
  });

  it('title 만 업데이트 시 SET 절에 title 이 포함된다', async () => {
    await todoRepository.update(TODO_ID, { title: '수정된 제목' });
    const updateQuery = pool.query.mock.calls[0][0];
    expect(updateQuery).toMatch(/title\s*=/);
  });

  it('동적 SET 절에 updated_at = NOW() 가 포함된다', async () => {
    await todoRepository.update(TODO_ID, { title: '수정' });
    const updateQuery = pool.query.mock.calls[0][0];
    expect(updateQuery).toMatch(/updated_at\s*=\s*NOW\(\)/i);
  });

  it('isCompleted / completedAt 필드도 SET 절에 포함된다', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [MOCK_TODO] });

    await todoRepository.update(TODO_ID, {
      isCompleted: true,
      completedAt: '2024-06-01T00:00:00.000Z',
    });
    const updateQuery = pool.query.mock.calls[0][0];
    expect(updateQuery).toMatch(/is_completed\s*=/);
    expect(updateQuery).toMatch(/completed_at\s*=/);
  });

  it('UPDATE 후 findById 를 호출해 최신 todo 를 반환한다', async () => {
    const result = await todoRepository.update(TODO_ID, { title: '수정' });
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(result).toEqual(MOCK_TODO);
  });

  it('UPDATE 쿼리의 WHERE 절에 todo id 가 파라미터로 전달된다', async () => {
    await todoRepository.update(TODO_ID, { title: '수정' });
    const updateParams = pool.query.mock.calls[0][1];
    expect(updateParams).toContain(TODO_ID);
  });
});

// ==================================================================
// deleteById
// ==================================================================
describe('todoRepository.deleteById', () => {
  it('DELETE 쿼리가 호출된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await todoRepository.deleteById(TODO_ID);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('DELETE 쿼리에 id 파라미터가 전달된다', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await todoRepository.deleteById(TODO_ID);
    const [query, params] = pool.query.mock.calls[0];
    expect(query).toMatch(/DELETE/i);
    expect(params).toEqual([TODO_ID]);
  });
});
