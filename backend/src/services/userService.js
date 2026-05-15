'use strict';

const userRepository = require('../repositories/userRepository');
const { AppError } = require('../middlewares/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/constants');

async function getMe(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, '사용자를 찾을 수 없습니다.');
  }
  return user;
}

async function updatePreferences(userId, { theme }) {
  const user = await userRepository.updateTheme(userId, theme);
  if (!user) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, '사용자를 찾을 수 없습니다.');
  }
  return { theme: user.theme };
}

async function deleteMe(userId) {
  await userRepository.deleteById(userId);
}

module.exports = { getMe, updatePreferences, deleteMe };
