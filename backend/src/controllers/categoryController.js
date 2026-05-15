'use strict';

const categoryService = require('../services/categoryService');
const { HTTP_STATUS } = require('../constants/constants');

async function getCategories(req, res, next) {
  console.log(`[Category] 목록 조회 요청 - userId: ${req.user.id}`);
  try {
    const result = await categoryService.getCategories(req.user.id);
    console.log(`[Category] 목록 조회 성공 - userId: ${req.user.id}, count: ${result.length ?? '-'}`);
    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  console.log(`[Category] 생성 요청 - userId: ${req.user.id}, name: ${req.body.name}`);
  try {
    const result = await categoryService.createCategory(req.user.id, req.body.name);
    console.log(`[Category] 생성 성공 - userId: ${req.user.id}, categoryId: ${result.id}`);
    res.status(HTTP_STATUS.CREATED).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getCategories, createCategory };
