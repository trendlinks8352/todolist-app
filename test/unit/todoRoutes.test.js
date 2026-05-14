'use strict';

// ------------------------------------------------------------------ //
// todoRoutes.test.js
// supertest + 테스트용 Express 미니앱으로 todo 라우트 통합 테스트.
//
// - todoService 전체를 jest.mock 으로 대체한다.
// - tokenUtils 를 jest.mock 으로 대체해 authenticate 미들웨어가
//   실제 JWT 검증을 수행하지 않도록 한다.
// - validate 미들웨어는 실제 구현(Joi 스키마 포함)을 사용한다.
// ------------------------------------------------------------------ //

jest.mock('../../src/services/todoService');
jest.mock('../../src/utils/tokenUtils');

const request = require('supertest');
const express = require('express');

const todoService = require('../../src/services/todoService');
const { verifyToken } = require('../../src/utils/tokenUtils');
const todoRouter = require('../../src/routes/todo.routes');
const { errorHandler } = require('../../src/middlewares/errorHandler');
const { AppError } = require('../../src/middlewares/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../../src/constants/constants');

// ------------------------------------------------------------------ //
// 테스트용 Express 앱 팩토리
// ------------------------------------------------------------------ //
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/todos', todoRouter);
  app.use(errorHandler);
  return app;
}

const app = buildApp();

// ------------------------------------------------------------------ //
// 공통 픽스처
// ------------------------------------------------------------------ //
const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const TODO_UUID = 'b1ffcd11-1d1c-5fg9-cc7e-7cc0ce491b22';
const USER_ID = 'user-uuid-0001';
const MOCK_USER = { id: USER_ID, email: 'test@test.com' };
const BEARER_TOKEN = 'Bearer valid.mock.token';

const MOCK_TODO = {
  id: TODO_UUID,
  userId: USER_ID,
  categoryId: VALID_UUID,
  title: '테스트 할일',
  description: '설명',
  dueDate: '2099-12-31',
  isCompleted: false,
  completedAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  category: { id: VALID_UUID, name: '일반', isDefault: true },
};

const MOCK_TODOS_RESULT = {
  data: [MOCK_TODO],
  pagination: { page: 1, size: 20, total: 1, totalPages: 1 },
};

const VALID_CREATE_BODY = {
  title: '새 할일',
  categoryId: VALID_UUID,
};

beforeEach(() => {
  jest.clearAllMocks();
  // 기본적으로 verifyToken 은 유효한 사용자를 반환
  verifyToken.mockReturnValue(MOCK_USER);
});

// ==================================================================
// GET /api/todos
// ==================================================================
describe('GET /api/todos', () => {
  describe('인증 실패', () => {
    it('Authorization 헤더 없이 요청 시 401 반환', async () => {
      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('401 응답 body 에 UNAUTHORIZED 코드가 포함된다', async () => {
      const res = await request(app).get('/api/todos');
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('verifyToken 이 throw 하면 401 반환', async () => {
      verifyToken.mockImplementation(() => { throw new Error('jwt expired'); });
      const res = await request(app).get('/api/todos').set('Authorization', BEARER_TOKEN);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('성공', () => {
    beforeEach(() => {
      todoService.getTodos.mockResolvedValue(MOCK_TODOS_RESULT);
    });

    it('유효한 인증 → 200 반환', async () => {
      const res = await request(app).get('/api/todos').set('Authorization', BEARER_TOKEN);
      expect(res.status).toBe(HTTP_STATUS.OK);
    });

    it('응답 body 에 data 배열이 포함된다', async () => {
      const res = await request(app).get('/api/todos').set('Authorization', BEARER_TOKEN);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('응답 body 에 pagination 객체가 포함된다', async () => {
      const res = await request(app).get('/api/todos').set('Authorization', BEARER_TOKEN);
      expect(res.body).toHaveProperty('pagination');
    });

    it('todoService.getTodos 가 req.user.id + query 로 호출된다', async () => {
      await request(app)
        .get('/api/todos')
        .query({ page: '2', size: '10' })
        .set('Authorization', BEARER_TOKEN);

      expect(todoService.getTodos).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ page: 2, size: 10 })
      );
    });

    it('page, size 쿼리 파라미터가 숫자로 변환되어 서비스에 전달된다', async () => {
      await request(app)
        .get('/api/todos')
        .query({ page: '3', size: '5' })
        .set('Authorization', BEARER_TOKEN);

      const [, query] = todoService.getTodos.mock.calls[0];
      expect(query.page).toBe(3);
      expect(query.size).toBe(5);
    });
  });

  describe('유효성 오류', () => {
    it('categoryId 가 UUID 형식이 아니면 422 반환', async () => {
      const res = await request(app)
        .get('/api/todos')
        .query({ categoryId: 'not-a-uuid' })
        .set('Authorization', BEARER_TOKEN);
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('dueDateFrom > dueDateTo 이면 422 반환', async () => {
      const res = await request(app)
        .get('/api/todos')
        .query({ dueDateFrom: '2099-12-31', dueDateTo: '2099-01-01' })
        .set('Authorization', BEARER_TOKEN);
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('page=0 이면 422 반환', async () => {
      const res = await request(app)
        .get('/api/todos')
        .query({ page: '0' })
        .set('Authorization', BEARER_TOKEN);
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('size=101 이면 422 반환', async () => {
      const res = await request(app)
        .get('/api/todos')
        .query({ size: '101' })
        .set('Authorization', BEARER_TOKEN);
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });
  });
});

// ==================================================================
// POST /api/todos
// ==================================================================
describe('POST /api/todos', () => {
  describe('인증 실패', () => {
    it('Authorization 헤더 없이 요청 시 401 반환', async () => {
      const res = await request(app).post('/api/todos').send(VALID_CREATE_BODY);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('유효성 오류', () => {
    it('categoryId 누락 시 422 반환', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', BEARER_TOKEN)
        .send({ title: '제목만' });
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('categoryId 누락 시 응답 fields 에 categoryId 항목이 포함된다', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', BEARER_TOKEN)
        .send({ title: '제목만' });
      expect(Array.isArray(res.body.error.fields)).toBe(true);
      expect(res.body.error.fields.some((f) => f.field === 'categoryId')).toBe(true);
    });

    it('title 누락 시 422 반환', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', BEARER_TOKEN)
        .send({ categoryId: VALID_UUID });
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('title 누락 시 응답 fields 에 title 항목이 포함된다', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', BEARER_TOKEN)
        .send({ categoryId: VALID_UUID });
      expect(Array.isArray(res.body.error.fields)).toBe(true);
      expect(res.body.error.fields.some((f) => f.field === 'title')).toBe(true);
    });

    it('categoryId 가 UUID 형식이 아니면 422 반환', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', BEARER_TOKEN)
        .send({ title: '제목', categoryId: 'invalid-uuid' });
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });
  });

  describe('성공', () => {
    beforeEach(() => {
      todoService.createTodo.mockResolvedValue(MOCK_TODO);
    });

    it('유효한 요청 → 201 반환', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', BEARER_TOKEN)
        .send(VALID_CREATE_BODY);
      expect(res.status).toBe(HTTP_STATUS.CREATED);
    });

    it('응답 body 에 생성된 todo 가 포함된다', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', BEARER_TOKEN)
        .send(VALID_CREATE_BODY);
      expect(res.body).toMatchObject({ id: MOCK_TODO.id, title: MOCK_TODO.title });
    });

    it('todoService.createTodo 가 userId + body 로 호출된다', async () => {
      await request(app)
        .post('/api/todos')
        .set('Authorization', BEARER_TOKEN)
        .send(VALID_CREATE_BODY);
      expect(todoService.createTodo).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ title: VALID_CREATE_BODY.title, categoryId: VALID_CREATE_BODY.categoryId })
      );
    });
  });

  describe('서비스 에러 전파', () => {
    it('서비스에서 404 AppError → 404 응답', async () => {
      todoService.createTodo.mockRejectedValue(
        new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, '카테고리를 찾을 수 없습니다.')
      );
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', BEARER_TOKEN)
        .send(VALID_CREATE_BODY);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('서비스에서 422 AppError → 422 응답', async () => {
      todoService.createTodo.mockRejectedValue(
        new AppError(HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR, '종료예정일은 오늘 이후여야 합니다.')
      );
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', BEARER_TOKEN)
        .send(VALID_CREATE_BODY);
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });
  });
});

// ==================================================================
// PUT /api/todos/:id
// ==================================================================
describe('PUT /api/todos/:id', () => {
  describe('인증 실패', () => {
    it('Authorization 헤더 없이 요청 시 401 반환', async () => {
      const res = await request(app)
        .put(`/api/todos/${TODO_UUID}`)
        .send({ title: '수정' });
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('성공', () => {
    beforeEach(() => {
      todoService.updateTodo.mockResolvedValue({ ...MOCK_TODO, title: '수정된 제목' });
    });

    it('유효한 요청 → 200 반환', async () => {
      const res = await request(app)
        .put(`/api/todos/${TODO_UUID}`)
        .set('Authorization', BEARER_TOKEN)
        .send({ title: '수정된 제목' });
      expect(res.status).toBe(HTTP_STATUS.OK);
    });

    it('todoService.updateTodo 가 userId, todoId, body 로 호출된다', async () => {
      await request(app)
        .put(`/api/todos/${TODO_UUID}`)
        .set('Authorization', BEARER_TOKEN)
        .send({ title: '수정된 제목' });
      expect(todoService.updateTodo).toHaveBeenCalledWith(
        USER_ID,
        TODO_UUID,
        expect.objectContaining({ title: '수정된 제목' })
      );
    });

    it('빈 body (모든 필드 optional) → 200 반환', async () => {
      const res = await request(app)
        .put(`/api/todos/${TODO_UUID}`)
        .set('Authorization', BEARER_TOKEN)
        .send({});
      expect(res.status).toBe(HTTP_STATUS.OK);
    });
  });

  describe('서비스 에러 전파', () => {
    it('서비스에서 403 AppError → 403 응답', async () => {
      todoService.updateTodo.mockRejectedValue(
        new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, '접근 권한이 없습니다.')
      );
      const res = await request(app)
        .put(`/api/todos/${TODO_UUID}`)
        .set('Authorization', BEARER_TOKEN)
        .send({ title: '수정' });
      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
    });

    it('서비스에서 404 AppError → 404 응답', async () => {
      todoService.updateTodo.mockRejectedValue(
        new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, '할일을 찾을 수 없습니다.')
      );
      const res = await request(app)
        .put(`/api/todos/${TODO_UUID}`)
        .set('Authorization', BEARER_TOKEN)
        .send({ title: '수정' });
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('403 응답 body 에 FORBIDDEN 코드가 포함된다', async () => {
      todoService.updateTodo.mockRejectedValue(
        new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, '접근 권한이 없습니다.')
      );
      const res = await request(app)
        .put(`/api/todos/${TODO_UUID}`)
        .set('Authorization', BEARER_TOKEN)
        .send({ title: '수정' });
      expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });
});

// ==================================================================
// PATCH /api/todos/:id/complete
// ==================================================================
describe('PATCH /api/todos/:id/complete', () => {
  describe('인증 실패', () => {
    it('Authorization 헤더 없이 요청 시 401 반환', async () => {
      const res = await request(app).patch(`/api/todos/${TODO_UUID}/complete`);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('성공', () => {
    beforeEach(() => {
      todoService.completeTodo.mockResolvedValue({
        ...MOCK_TODO,
        isCompleted: true,
        completedAt: '2024-06-01T00:00:00.000Z',
      });
    });

    it('유효한 요청 → 200 반환', async () => {
      const res = await request(app)
        .patch(`/api/todos/${TODO_UUID}/complete`)
        .set('Authorization', BEARER_TOKEN);
      expect(res.status).toBe(HTTP_STATUS.OK);
    });

    it('응답 body 에 completedAt 필드가 포함된다', async () => {
      const res = await request(app)
        .patch(`/api/todos/${TODO_UUID}/complete`)
        .set('Authorization', BEARER_TOKEN);
      expect(res.body).toHaveProperty('completedAt');
      expect(res.body.completedAt).not.toBeNull();
    });

    it('todoService.completeTodo 가 userId, todoId 로 호출된다', async () => {
      await request(app)
        .patch(`/api/todos/${TODO_UUID}/complete`)
        .set('Authorization', BEARER_TOKEN);
      expect(todoService.completeTodo).toHaveBeenCalledWith(USER_ID, TODO_UUID);
    });
  });

  describe('서비스 에러 전파', () => {
    it('서비스에서 403 AppError → 403 응답', async () => {
      todoService.completeTodo.mockRejectedValue(
        new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, '접근 권한이 없습니다.')
      );
      const res = await request(app)
        .patch(`/api/todos/${TODO_UUID}/complete`)
        .set('Authorization', BEARER_TOKEN);
      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
    });

    it('서비스에서 404 AppError → 404 응답', async () => {
      todoService.completeTodo.mockRejectedValue(
        new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, '할일을 찾을 수 없습니다.')
      );
      const res = await request(app)
        .patch(`/api/todos/${TODO_UUID}/complete`)
        .set('Authorization', BEARER_TOKEN);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });
});

// ==================================================================
// DELETE /api/todos/:id
// ==================================================================
describe('DELETE /api/todos/:id', () => {
  describe('인증 실패', () => {
    it('Authorization 헤더 없이 요청 시 401 반환', async () => {
      const res = await request(app).delete(`/api/todos/${TODO_UUID}`);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('성공', () => {
    beforeEach(() => {
      todoService.deleteTodo.mockResolvedValue(undefined);
    });

    it('유효한 요청 → 204 반환', async () => {
      const res = await request(app)
        .delete(`/api/todos/${TODO_UUID}`)
        .set('Authorization', BEARER_TOKEN);
      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT);
    });

    it('204 응답 본문이 비어 있다', async () => {
      const res = await request(app)
        .delete(`/api/todos/${TODO_UUID}`)
        .set('Authorization', BEARER_TOKEN);
      expect(res.text).toBe('');
    });

    it('todoService.deleteTodo 가 userId, todoId 로 호출된다', async () => {
      await request(app)
        .delete(`/api/todos/${TODO_UUID}`)
        .set('Authorization', BEARER_TOKEN);
      expect(todoService.deleteTodo).toHaveBeenCalledWith(USER_ID, TODO_UUID);
    });
  });

  describe('서비스 에러 전파', () => {
    it('서비스에서 403 AppError → 403 응답', async () => {
      todoService.deleteTodo.mockRejectedValue(
        new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, '접근 권한이 없습니다.')
      );
      const res = await request(app)
        .delete(`/api/todos/${TODO_UUID}`)
        .set('Authorization', BEARER_TOKEN);
      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
    });

    it('서비스에서 404 AppError → 404 응답', async () => {
      todoService.deleteTodo.mockRejectedValue(
        new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, '할일을 찾을 수 없습니다.')
      );
      const res = await request(app)
        .delete(`/api/todos/${TODO_UUID}`)
        .set('Authorization', BEARER_TOKEN);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('403 응답 body 에 FORBIDDEN 코드가 포함된다', async () => {
      todoService.deleteTodo.mockRejectedValue(
        new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, '접근 권한이 없습니다.')
      );
      const res = await request(app)
        .delete(`/api/todos/${TODO_UUID}`)
        .set('Authorization', BEARER_TOKEN);
      expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('404 응답 body 에 NOT_FOUND 코드가 포함된다', async () => {
      todoService.deleteTodo.mockRejectedValue(
        new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, '할일을 찾을 수 없습니다.')
      );
      const res = await request(app)
        .delete(`/api/todos/${TODO_UUID}`)
        .set('Authorization', BEARER_TOKEN);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });
});
