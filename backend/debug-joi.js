const Joi = require("joi");
const email = `test-auth-${Date.now()}@test.com`;
const schema = Joi.string().email().required();
const result = schema.validate(email);
console.log("Email:", email);
console.log("Result:", result.error ? result.error.details : "Success");
