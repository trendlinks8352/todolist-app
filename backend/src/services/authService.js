'use strict';

const userRepository = require('../repositories/userRepository');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/tokenUtils');
const { AppError } = require('../middlewares/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/constants');

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    theme: user.theme,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function register({ email, password, name }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AppError(HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, '이미 사용 중인 이메일입니다.');
  }

  const hashed = await hashPassword(password);
  const user = await userRepository.create({ email, password: hashed, name });
  const accessToken = generateToken({ id: user.id, email: user.email });

  return { accessToken, user: formatUser(user) };
}

async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new AppError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED,
      '이메일 또는 비밀번호가 올바르지 않습니다.'
    );
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new AppError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED,
      '이메일 또는 비밀번호가 올바르지 않습니다.'
    );
  }

  const accessToken = generateToken({ id: user.id, email: user.email });

  return { accessToken, user: formatUser(user) };
}

function logout() {
  return { message: '로그아웃되었습니다.' };
}

module.exports = { register, login, logout };
