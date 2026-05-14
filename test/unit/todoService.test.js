'use strict';

// ------------------------------------------------------------------ //
// todoService.test.js
// todoRepository, pool, dateUtils 를 jest.mock 으로 격리하여
// todoService 의 비즈니스 로직만 단위 테스트한다.
// ------------------------------------------------------------------ //

jest.mock('../../src/repositories/todoRepository');
jest.mock('../../src/db/pool', () => ({
  pool: { query: jest.fn() },
}));
jest.mock('../../src/utils/dateUtils');

const todoRepository = require('../../src/repositories/todoRepository');
const { pool } = require('../../src/db/pool');
const { isDateTodayOrFuture } = require('../../src/utils/dateUtils');
const todoService = require('../../src/services/todoService');
const { AppError } = require('../../src/middlewares/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../../src/constants/constants');

// ------------------------------------------------------------------ //
// 공통 픽스처
// ------------------------------------------------------------------ //
const USER_ID = 'user-uuid-1111';
const OTHER_USER_ID = 'user-uuid-9999';
const TODO_ID = 'todo-uuid-1111';
const CATEGORY_ID = 'cat-uuid-1111';

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

const COMPLETED_TODO = { ...MOCK_TODO, isCompleted: true, completedAt: '2024-06-01T00:00:00.000Z' };

beforeEach(() => {
  jest.clearAllMocks();
});

// ==================================================================
// createTodo
// ==================================================================
describe('todoService.createTodo', () => {
  const VALID_DATA = {
    title: '새 할일',
    description: '설명',
    dueDate: '2099-12-31',
    categoryId: CATEGORY_ID,
  };

  describe('성공 케이스', () => {
    beforeEach(() => {
      isDateTodayOrFuture.mockReturnValue(true);
      // 카테고리 접근 권한 있음
      pool.query.mockResolvedValue({ rows: [{ id: CATEGORY_ID }] });
      todoRepository.create.mockResolvedValue(MOCK_TODO);
    });

    it('유효한 입력 + 미래 dueDate → 할일 생성 성공 및 todo 반환', async () => {
      const result = await todoService.createTodo(USER_ID, VALID_DATA);
      expect(result).toEqual(MOCK_TODO);
    });

    it('todoRepository.create 가 올바른 인자로 호출된다', async () => {
      await todoService.createTodo(USER_ID, VALID_DATA);
      expect(todoRepository.create).toHaveBeenCalledWith({
        userId: USER_ID,
        categoryId: CATEGORY_ID,
        title: VALID_DATA.title,
        description: VALID_DATA.description,
        dueDate: VALID_DATA.dueDate,
      });
    });

    it('dueDate 없을 때 isDateTodayOrFuture 호출 안 함', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: CATEGORY_ID }] });
      todoRepository.create.mockResolvedValue(MOCK_TODO);

      await todoService.createTodo(USER_ID, { ...VALID_DATA, dueDate: undefined });
      expect(isDateTodayOrFuture).not.toHaveBeenCalled();
    });

    it('카테고리 접근 가능 → pool.query 가 카테고리 조회 쿼리로 호출된다', async () => {
      await todoService.createTodo(USER_ID, VALID_DATA);
      expect(pool.query).toHaveBeenCalledTimes(1);
      const [query, params] = pool.query.mock.calls[0];
      expect(query).toMatch(/categories/);
      expect(params).toContain(CATEGORY_ID);
      expect(params).toContain(USER_ID);
    });
  });

  describe('실패 케이스', () => {
    it('과거 dueDate → AppError(422, VALIDATION_ERROR) throw', async () => {
      isDateTodayOrFuture.mockReturnValue(false);

      await expect(
        todoService.createTodo(USER_ID, VALID_DATA)
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    });

    it('과거 dueDate → repository.create 호출 안 됨', async () => {
      isDateTodayOrFuture.mockReturnValue(false);

      await todoService.createTodo(USER_ID, VALID_DATA).catch(() => {});
      expect(todoRepository.create).not.toHaveBeenCalled();
    });

    it('카테고리 접근 불가 (빈 rows) → AppError(404, NOT_FOUND) throw', async () => {
      isDateTodayOrFuture.mockReturnValue(true);
      pool.query.mockResolvedValue({ rows: [] });

      await expect(
        todoService.createTodo(USER_ID, VALID_DATA)
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.NOT_FOUND,
        code: ERROR_CODES.NOT_FOUND,
      });
    });

    it('카테고리 접근 불가 → repository.create 호출 안 됨', async () => {
      isDateTodayOrFuture.mockReturnValue(true);
      pool.query.mockResolvedValue({ rows: [] });

      await todoService.createTodo(USER_ID, VALID_DATA).catch(() => {});
      expect(todoRepository.create).not.toHaveBeenCalled();
    });
  });
});

// ==================================================================
// getTodos
// ==================================================================
describe('todoService.getTodos', () => {
  const FILTERS = { categoryId: CATEGORY_ID, isCompleted: false, page: 1, size: 10 };
  const MOCK_RESULT = {
    data: [MOCK_TODO],
    pagination: { page: 1, size: 10, total: 1, totalPages: 1 },
  };

  beforeEach(() => {
    todoRepository.find.mockResolvedValue(MOCK_RESULT);
  });

  it('todoRepository.find 가 userId + 필터를 합쳐서 호출된다', async () => {
    await todoService.getTodos(USER_ID, FILTERS);
    expect(todoRepository.find).toHaveBeenCalledWith({ userId: USER_ID, ...FILTERS });
  });

  it('반환값이 repository.find 결과와 일치한다', async () => {
    const result = await todoService.getTodos(USER_ID, FILTERS);
    expect(result).toEqual(MOCK_RESULT);
  });

  it('필터 없이 userId 만으로 호출 시 userId 포함하여 find 호출된다', async () => {
    await todoService.getTodos(USER_ID, {});
    expect(todoRepository.find).toHaveBeenCalledWith({ userId: USER_ID });
  });
});

// ==================================================================
// updateTodo
// ==================================================================
describe('todoService.updateTodo', () => {
  const UPDATE_FIELDS = { title: '수정된 제목' };

  describe('성공 케이스', () => {
    beforeEach(() => {
      todoRepository.findById.mockResolvedValue(MOCK_TODO);
      isDateTodayOrFuture.mockReturnValue(true);
      pool.query.mockResolvedValue({ rows: [{ id: CATEGORY_ID }] });
      todoRepository.update.mockResolvedValue({ ...MOCK_TODO, title: '수정된 제목' });
    });

    it('유효한 업데이트 → repository.update 가 올바른 인자로 호출된다', async () => {
      await todoService.updateTodo(USER_ID, TODO_ID, UPDATE_FIELDS);
      expect(todoRepository.update).toHaveBeenCalledWith(TODO_ID, UPDATE_FIELDS);
    });

    it('업데이트 결과 반환', async () => {
      const result = await todoService.updateTodo(USER_ID, TODO_ID, UPDATE_FIELDS);
      expect(result.title).toBe('수정된 제목');
    });

    it('categoryId 변경 시 카테고리 접근 권한 검증이 수행된다', async () => {
      const newCategoryId = 'cat-uuid-new';
      pool.query.mockResolvedValue({ rows: [{ id: newCategoryId }] });

      await todoService.updateTodo(USER_ID, TODO_ID, { categoryId: newCategoryId });
      expect(pool.query).toHaveBeenCalledTimes(1);
      const params = pool.query.mock.calls[0][1];
      expect(params).toContain(newCategoryId);
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 todo → AppError(404)', async () => {
      todoRepository.findById.mockResolvedValue(null);

      await expect(
        todoService.updateTodo(USER_ID, TODO_ID, UPDATE_FIELDS)
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.NOT_FOUND,
        code: ERROR_CODES.NOT_FOUND,
      });
    });

    it('타인 todo (userId 불일치) → AppError(403)', async () => {
      todoRepository.findById.mockResolvedValue({ ...MOCK_TODO, userId: OTHER_USER_ID });

      await expect(
        todoService.updateTodo(USER_ID, TODO_ID, UPDATE_FIELDS)
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.FORBIDDEN,
        code: ERROR_CODES.FORBIDDEN,
      });
    });

    it('과거 dueDate → AppError(422)', async () => {
      todoRepository.findById.mockResolvedValue(MOCK_TODO);
      isDateTodayOrFuture.mockReturnValue(false);

      await expect(
        todoService.updateTodo(USER_ID, TODO_ID, { dueDate: '2000-01-01' })
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    });

    it('categoryId 변경 + 접근 불가 → AppError(404)', async () => {
      todoRepository.findById.mockResolvedValue(MOCK_TODO);
      isDateTodayOrFuture.mockReturnValue(true);
      pool.query.mockResolvedValue({ rows: [] });

      await expect(
        todoService.updateTodo(USER_ID, TODO_ID, { categoryId: 'cat-uuid-new' })
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.NOT_FOUND,
        code: ERROR_CODES.NOT_FOUND,
      });
    });
  });
});

// ==================================================================
// completeTodo
// ==================================================================
describe('todoService.completeTodo', () => {
  describe('성공 케이스', () => {
    it('isCompleted: false → true 로 토글, completedAt 현재 시간으로 설정', async () => {
      todoRepository.findById.mockResolvedValue({ ...MOCK_TODO, isCompleted: false });
      todoRepository.update.mockResolvedValue(COMPLETED_TODO);

      const before = Date.now();
      await todoService.completeTodo(USER_ID, TODO_ID);
      const after = Date.now();

      expect(todoRepository.update).toHaveBeenCalledTimes(1);
      const [, fields] = todoRepository.update.mock.calls[0];
      expect(fields.isCompleted).toBe(true);

      // completedAt 이 현재 시간 기준으로 설정됐는지 확인
      const completedAtMs = new Date(fields.completedAt).getTime();
      expect(completedAtMs).toBeGreaterThanOrEqual(before);
      expect(completedAtMs).toBeLessThanOrEqual(after);
    });

    it('isCompleted: true → false 로 토글, completedAt null 로 초기화 (BR-06)', async () => {
      todoRepository.findById.mockResolvedValue({ ...MOCK_TODO, isCompleted: true, completedAt: '2024-06-01T00:00:00.000Z' });
      todoRepository.update.mockResolvedValue({ ...MOCK_TODO, isCompleted: false, completedAt: null });

      await todoService.completeTodo(USER_ID, TODO_ID);

      const [, fields] = todoRepository.update.mock.calls[0];
      expect(fields.isCompleted).toBe(false);
      expect(fields.completedAt).toBeNull();
    });

    it('업데이트된 todo 를 반환한다', async () => {
      todoRepository.findById.mockResolvedValue(MOCK_TODO);
      todoRepository.update.mockResolvedValue(COMPLETED_TODO);

      const result = await todoService.completeTodo(USER_ID, TODO_ID);
      expect(result).toEqual(COMPLETED_TODO);
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 todo → AppError(404)', async () => {
      todoRepository.findById.mockResolvedValue(null);

      await expect(
        todoService.completeTodo(USER_ID, TODO_ID)
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.NOT_FOUND,
        code: ERROR_CODES.NOT_FOUND,
      });
    });

    it('타인 todo → AppError(403)', async () => {
      todoRepository.findById.mockResolvedValue({ ...MOCK_TODO, userId: OTHER_USER_ID });

      await expect(
        todoService.completeTodo(USER_ID, TODO_ID)
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.FORBIDDEN,
        code: ERROR_CODES.FORBIDDEN,
      });
    });

    it('404 발생 시 repository.update 는 호출되지 않는다', async () => {
      todoRepository.findById.mockResolvedValue(null);

      await todoService.completeTodo(USER_ID, TODO_ID).catch(() => {});
      expect(todoRepository.update).not.toHaveBeenCalled();
    });
  });
});

// ==================================================================
// deleteTodo
// ==================================================================
describe('todoService.deleteTodo', () => {
  describe('성공 케이스', () => {
    beforeEach(() => {
      todoRepository.findById.mockResolvedValue(MOCK_TODO);
      todoRepository.deleteById.mockResolvedValue(undefined);
    });

    it('소유권 확인 후 repository.deleteById 가 todoId 로 호출된다', async () => {
      await todoService.deleteTodo(USER_ID, TODO_ID);
      expect(todoRepository.deleteById).toHaveBeenCalledWith(TODO_ID);
      expect(todoRepository.deleteById).toHaveBeenCalledTimes(1);
    });

    it('undefined 를 반환한다 (204 응답 대응)', async () => {
      const result = await todoService.deleteTodo(USER_ID, TODO_ID);
      expect(result).toBeUndefined();
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 todo → AppError(404)', async () => {
      todoRepository.findById.mockResolvedValue(null);

      await expect(
        todoService.deleteTodo(USER_ID, TODO_ID)
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.NOT_FOUND,
        code: ERROR_CODES.NOT_FOUND,
      });
    });

    it('타인 todo → AppError(403)', async () => {
      todoRepository.findById.mockResolvedValue({ ...MOCK_TODO, userId: OTHER_USER_ID });

      await expect(
        todoService.deleteTodo(USER_ID, TODO_ID)
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.FORBIDDEN,
        code: ERROR_CODES.FORBIDDEN,
      });
    });

    it('404 발생 시 repository.deleteById 는 호출되지 않는다', async () => {
      todoRepository.findById.mockResolvedValue(null);

      await todoService.deleteTodo(USER_ID, TODO_ID).catch(() => {});
      expect(todoRepository.deleteById).not.toHaveBeenCalled();
    });

    it('403 발생 시 repository.deleteById 는 호출되지 않는다', async () => {
      todoRepository.findById.mockResolvedValue({ ...MOCK_TODO, userId: OTHER_USER_ID });

      await todoService.deleteTodo(USER_ID, TODO_ID).catch(() => {});
      expect(todoRepository.deleteById).not.toHaveBeenCalled();
    });
  });
});
