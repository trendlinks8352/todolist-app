'use strict';

const { verifyToken } = require('../utils/tokenUtils');
const { AppError } = require('./errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/constants');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log(`[Auth] 인증 실패 - Authorization 헤더 없음 (${req.method} ${req.path})`);
    return next(
      new AppError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        '인증이 필요합니다.'
      )
    );
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email };
    console.log(`[Auth] 토큰 검증 성공 - userId: ${decoded.id} (${req.method} ${req.path})`);
    next();
  } catch {
    console.log(`[Auth] 토큰 검증 실패 - 유효하지 않거나 만료된 토큰 (${req.method} ${req.path})`);
    next(
      new AppError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        '유효하지 않거나 만료된 토큰입니다.'
      )
    );
  }
}

module.exports = { authenticate };
