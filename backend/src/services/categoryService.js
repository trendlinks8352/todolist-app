'use strict';

const categoryRepository = require('../repositories/categoryRepository');
const { AppError } = require('../middlewares/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/constants');

async function getCategories(userId) {
  const categories = await categoryRepository.findAllByUser(userId);
  return { data: categories };
}

async function createCategory(userId, name) {
  // DC-04: 앞뒤 공백 trim
  const trimmedName = name.trim();

  // trim 후 빈 문자열 방지
  if (!trimmedName) {
    throw new AppError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      '카테고리 이름을 입력해주세요.'
    );
  }

  // BR-10: 대소문자 무시 중복 체크 (기본 카테고리 포함)
  const existing = await categoryRepository.findByNameAndUser(trimmedName, userId);
  if (existing) {
    throw new AppError(HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, '이미 사용 중인 카테고리 이름입니다.');
  }

  return categoryRepository.create({ userId, name: trimmedName });
}

async function validateCategoryAccess(userId, categoryId) {
  const category = await categoryRepository.findAccessible(userId, categoryId);
  if (!category) {
    throw new AppError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      '카테고리를 찾을 수 없습니다.'
    );
  }
}

module.exports = { getCategories, createCategory, validateCategoryAccess };
