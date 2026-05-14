'use strict';

const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-zA-Z])(?=.*\d).+$/)
    .required()
    .messages({
      'string.pattern.base': '비밀번호는 영문과 숫자를 각각 1자 이상 포함해야 합니다.',
      'string.min': '비밀번호는 8자 이상이어야 합니다.',
    }),
  name: Joi.string().min(1).max(100).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
