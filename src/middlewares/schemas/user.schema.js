'use strict';

const Joi = require('joi');

const updatePreferencesSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark').required().messages({
    'any.only': 'theme은 light 또는 dark만 허용됩니다.',
    'any.required': 'theme은 필수 값입니다.',
  }),
});

module.exports = { updatePreferencesSchema };
