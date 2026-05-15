'use strict';

const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
});

module.exports = { createCategorySchema };
