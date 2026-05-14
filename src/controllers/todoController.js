'use strict';

const todoService = require('../services/todoService');
const { HTTP_STATUS } = require('../constants/constants');

async function getTodos(req, res, next) {
  console.log(`[Todo] 목록 조회 요청 - userId: ${req.user.id}, query: ${JSON.stringify(req.query)}`);
  try {
    const result = await todoService.getTodos(req.user.id, req.query);
    console.log(`[Todo] 목록 조회 성공 - userId: ${req.user.id}, count: ${result.length ?? result.data?.length ?? '-'}`);
    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

async function createTodo(req, res, next) {
  console.log(`[Todo] 생성 요청 - userId: ${req.user.id}, title: ${req.body.title}`);
  try {
    const result = await todoService.createTodo(req.user.id, req.body);
    console.log(`[Todo] 생성 성공 - userId: ${req.user.id}, todoId: ${result.id}`);
    res.status(HTTP_STATUS.CREATED).json(result);
  } catch (err) {
    next(err);
  }
}

async function updateTodo(req, res, next) {
  console.log(`[Todo] 수정 요청 - userId: ${req.user.id}, todoId: ${req.params.id}`);
  try {
    const result = await todoService.updateTodo(req.user.id, req.params.id, req.body);
    console.log(`[Todo] 수정 성공 - userId: ${req.user.id}, todoId: ${req.params.id}`);
    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

async function completeTodo(req, res, next) {
  console.log(`[Todo] 완료 토글 요청 - userId: ${req.user.id}, todoId: ${req.params.id}`);
  try {
    const result = await todoService.completeTodo(req.user.id, req.params.id);
    console.log(`[Todo] 완료 토글 성공 - userId: ${req.user.id}, todoId: ${req.params.id}, isCompleted: ${result.isCompleted}`);
    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteTodo(req, res, next) {
  console.log(`[Todo] 삭제 요청 - userId: ${req.user.id}, todoId: ${req.params.id}`);
  try {
    await todoService.deleteTodo(req.user.id, req.params.id);
    console.log(`[Todo] 삭제 성공 - userId: ${req.user.id}, todoId: ${req.params.id}`);
    res.status(HTTP_STATUS.NO_CONTENT).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { getTodos, createTodo, updateTodo, completeTodo, deleteTodo };
