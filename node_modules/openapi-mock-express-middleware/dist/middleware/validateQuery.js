"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const operations_1 = require("../operations");
const utils_1 = require("../utils");
const validateQuery = (req, res, next) => {
    if (!res.locals.operation || !(res.locals.operation instanceof operations_1.Operation)) {
        return next();
    }
    const schemas = res.locals.operation.getParamsSchemas();
    if ((schemas.query.properties && Object.keys(schemas.query.properties)) ||
        (req.query && Object.keys(req.query))) {
        const isQueryValid = utils_1.validator.validate(schemas.query, req.query);
        if (!isQueryValid) {
            return res.status(400).json({
                message: 'Bad request. Invalid query string.',
                errors: utils_1.validator.errors,
            });
        }
    }
    return next();
};
exports.default = validateQuery;
//# sourceMappingURL=validateQuery.js.map