'use strict';

const { AppError } = require('./errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/constants');

function validate(schema, target = 'body') {
  return (req, res, next) => {
    const data = target === 'query' ? req.query : req.body;
    const { error, value } = schema.validate(data, { abortEarly: false, convert: true });

    if (error) {
      const fields = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      const appError = new AppError(
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ERROR,
        '입력값이 유효하지 않습니다.'
      );
      appError.fields = fields;
      return next(appError);
    }

    // Joi의 default 적용 및 타입 변환 결과를 req에 반영
    // Express 5에서 req.query는 prototype getter-only이므로 own property로 오버라이드
    if (target === 'query') {
      Object.defineProperty(req, 'query', {
        get: () => value,
        configurable: true,
      });
    } else {
      req.body = value;
    }

    next();
  };
}

module.exports = { validate };
