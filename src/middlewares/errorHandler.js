'use strict';

const { HTTP_STATUS, ERROR_CODES } = require('../constants/constants');

class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

// Express 4단 에러 핸들러 (반드시 파라미터 4개)
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    console.log(`[Error] AppError ${err.statusCode} - code: ${err.code}, message: ${err.message} (${req.method} ${req.path})`);
    const body = {
      error: {
        code: err.code,
        message: err.message,
      },
    };
    if (err.fields) {
      body.error.fields = err.fields;
    }
    return res.status(err.statusCode).json(body);
  }

  // 예상치 못한 에러 → 500
  console.error(`[Error] 예상치 못한 오류 (${req.method} ${req.path}):`, err);
  const isProduction = process.env.NODE_ENV === 'production';
  const response = {
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: '서버 내부 오류가 발생했습니다.',
    },
  };

  if (!isProduction) {
    response.error.stack = err.stack;
  }

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
}

module.exports = { AppError, errorHandler };
