"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const operations_1 = require("../operations");
const utils_1 = require("../utils");
const validateBody = (req, res, next) => {
    if (!res.locals.operation ||
        !(res.locals.operation instanceof operations_1.Operation) ||
        !(0, lodash_1.has)(res.locals.operation.operation, 'requestBody')) {
        return next();
    }
    const bodySchema = res.locals.operation.getBodySchema(req.get('content-type') || 'application/json');
    if (Object.keys(req.body).length && !bodySchema) {
        return res.status(400).json({
            message: 'Bad request. Invalid content type.',
        });
    }
    if (bodySchema) {
        const isBodyValid = utils_1.validator.validate(bodySchema, req.body);
        if (!isBodyValid) {
            return res.status(400).json({
                message: 'Bad request. Invalid request body.',
                errors: utils_1.validator.errors,
            });
        }
    }
    return next();
};
exports.default = validateBody;
//# sourceMappingURL=validateBody.js.map