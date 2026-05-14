'use strict';

const authService = require('../services/authService');
const { HTTP_STATUS } = require('../constants/constants');

async function register(req, res, next) {
  console.log(`[Auth] 회원가입 요청 - email: ${req.body.email}`);
  try {
    const result = await authService.register(req.body);
    console.log(`[Auth] 회원가입 성공 - userId: ${result.user.id}, email: ${result.user.email}`);
    res.status(HTTP_STATUS.CREATED).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  console.log(`[Auth] 로그인 요청 - email: ${req.body.email}`);
  try {
    const result = await authService.login(req.body);
    console.log(`[Auth] 로그인 성공 - userId: ${result.user.id}, email: ${result.user.email}`);
    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  console.log(`[Auth] 로그아웃 요청 - userId: ${req.user?.id}`);
  try {
    const result = authService.logout();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout };
