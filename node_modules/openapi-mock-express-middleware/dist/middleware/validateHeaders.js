"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const operations_1 = require("../operations");
const utils_1 = require("../utils");
const validateHeaders = (req, res, next) => {
    if (!res.locals.operation || !(res.locals.operation instanceof operations_1.Operation)) {
        return next();
    }
    const schemas = res.locals.operation.getParamsSchemas();
    if (schemas.header.properties && Object.keys(schemas.header.properties)) {
        const isHeadersValid = utils_1.validator.validate(schemas.header, req.headers);
        if (!isHeadersValid) {
            return res.status(400).json({
                message: 'Bad request. Invalid headers.',
                errors: utils_1.validator.errors,
            });
        }
    }
    return next();
};
exports.default = validateHeaders;
//# sourceMappingURL=validateHeaders.js.map