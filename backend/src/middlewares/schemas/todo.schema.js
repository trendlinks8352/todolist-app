'use strict';

const Joi = require('joi');

const createTodoSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().allow('', null).optional(),
  dueDate: Joi.string().isoDate().optional().allow(null),
  categoryId: Joi.string().uuid().required(),
});

const updateTodoSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().allow('', null).optional(),
  dueDate: Joi.string().isoDate().optional().allow(null),
  categoryId: Joi.string().uuid().optional(),
});

const getTodosQuerySchema = Joi.object({
  categoryId: Joi.string().uuid().optional(),
  isCompleted: Joi.boolean().optional(),
  dueDateFrom: Joi.string().isoDate().optional(),
  dueDateTo: Joi.string().isoDate().optional(),
  page: Joi.number().integer().min(1).default(1),
  size: Joi.number().integer().min(1).max(100).default(20),
}).custom((value, helpers) => {
  if (value.dueDateFrom && value.dueDateTo && value.dueDateFrom > value.dueDateTo) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({
  'any.invalid': 'dueDateFrom은 dueDateTo보다 이전이어야 합니다.',
});

module.exports = { createTodoSchema, updateTodoSchema, getTodosQuerySchema };
