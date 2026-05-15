"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_to_regexp_1 = require("path-to-regexp");
const operations_1 = require("../operations");
const utils_1 = require("../utils");
const validatePath = (req, res, next) => {
    if (!res.locals.operation || !(res.locals.operation instanceof operations_1.Operation)) {
        return next();
    }
    const schemas = res.locals.operation.getParamsSchemas();
    const matchPath = (0, path_to_regexp_1.match)(res.locals.operation.pathPattern);
    const matchObject = matchPath(req.path);
    if ((matchObject && matchObject.params) || schemas.path) {
        const isPathValid = utils_1.validator.validate(schemas.path, (matchObject && matchObject.params) || {});
        if (!isPathValid) {
            return res.status(400).json({
                message: 'Bad request. Invalid path params.',
                errors: utils_1.validator.errors,
            });
        }
    }
    return next();
};
exports.default = validatePath;
//# sourceMappingURL=validatePath.js.map