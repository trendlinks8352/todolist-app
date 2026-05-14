'use strict';

const todoRepository = require('../repositories/todoRepository');
const { pool } = require('../db/pool');
const { isDateTodayOrFuture } = require('../utils/dateUtils');
const { AppError } = require('../middlewares/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/constants');

/**
 * 카테고리 접근 권한 검증
 * 기본 카테고리(user_id IS NULL) 또는 요청 사용자 소유 카테고리만 허용 (BR-05)
 */
async function validateCategoryAccess(userId, categoryId) {
  const { rows } = await pool.query(
    'SELECT id FROM categories WHERE id = $1 AND (user_id IS NULL OR user_id = $2)',
    [categoryId, userId]
  );
  if (rows.length === 0) {
    throw new AppError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      '카테고리를 찾을 수 없습니다.'
    );
  }
}

/**
 * 할일 생성 (BR-03, BR-05, BR-07)
 */
async function createTodo(userId, { title, description, dueDate, categoryId }) {
  // BR-07: dueDate는 오늘 이후만 허용
  if (dueDate && !isDateTodayOrFuture(dueDate)) {
    throw new AppError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      '종료예정일은 오늘 이후 날짜여야 합니다.'
    );
  }

  // BR-05: 카테고리 접근 권한 검증
  await validateCategoryAccess(userId, categoryId);

  return todoRepository.create({ userId, categoryId, title, description, dueDate });
}

/**
 * 할일 목록 조회 (BR-03: userId 필터로 소유권 보장)
 */
async function getTodos(userId, filters) {
  return todoRepository.find({ userId, ...filters });
}

/**
 * 할일 수정 (BR-03, BR-07)
 */
async function updateTodo(userId, todoId, fields) {
  // BR-03: 존재 및 소유권 검증
  const todo = await todoRepository.findById(todoId);
  if (!todo) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, '할일을 찾을 수 없습니다.');
  }
  if (todo.userId !== userId) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, '접근 권한이 없습니다.');
  }

  // BR-07: dueDate 날짜 검증
  if (fields.dueDate && !isDateTodayOrFuture(fields.dueDate)) {
    throw new AppError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      '종료예정일은 오늘 이후 날짜여야 합니다.'
    );
  }

  // BR-05: 카테고리 변경 시 접근 권한 검증
  if (fields.categoryId) {
    await validateCategoryAccess(userId, fields.categoryId);
  }

  return todoRepository.update(todoId, fields);
}

/**
 * 할일 완료 토글 (BR-03, BR-06)
 */
async function completeTodo(userId, todoId) {
  // BR-03: 존재 및 소유권 검증
  const todo = await todoRepository.findById(todoId);
  if (!todo) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, '할일을 찾을 수 없습니다.');
  }
  if (todo.userId !== userId) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, '접근 권한이 없습니다.');
  }

  // BR-06: 완료 처리 시 completedAt 자동 기록/초기화
  const newIsCompleted = !todo.isCompleted;
  return todoRepository.update(todoId, {
    isCompleted: newIsCompleted,
    completedAt: newIsCompleted ? new Date().toISOString() : null,
  });
}

/**
 * 할일 삭제 (BR-03)
 */
async function deleteTodo(userId, todoId) {
  // BR-03: 존재 및 소유권 검증
  const todo = await todoRepository.findById(todoId);
  if (!todo) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, '할일을 찾을 수 없습니다.');
  }
  if (todo.userId !== userId) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, '접근 권한이 없습니다.');
  }

  await todoRepository.deleteById(todoId);
}

module.exports = { createTodo, getTodos, updateTodo, completeTodo, deleteTodo };
