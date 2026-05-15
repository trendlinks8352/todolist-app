"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuthByType = void 0;
const lodash_1 = require("lodash");
const operations_1 = require("../operations");
const checkAuthByType = (securityScheme, req) => {
    switch (securityScheme.type) {
        case 'apiKey':
            if (securityScheme.in === 'header') {
                return req.header(securityScheme.name) === undefined;
            }
            if (securityScheme.in === 'query') {
                return req.query[securityScheme.name] === undefined;
            }
            if (securityScheme.in === 'cookie') {
                return req.cookies[securityScheme.name] === undefined;
            }
            return false;
        case 'http': {
            const authHeader = req.header('Authorization');
            if (!authHeader) {
                return true;
            }
            return securityScheme.scheme === 'basic'
                ? !authHeader.startsWith('Basic')
                : !authHeader.startsWith('Bearer');
        }
        case 'oauth2': {
            const authHeader = req.header('Authorization');
            if (!authHeader) {
                return true;
            }
            return !authHeader.startsWith('Bearer');
        }
        default:
            return false;
    }
};
exports.checkAuthByType = checkAuthByType;
const isAuthorized = (req, res, next) => {
    if (!res.locals.operation || !(res.locals.operation instanceof operations_1.Operation)) {
        return next();
    }
    const securityRequirements = res.locals.operation.getSecurityRequirements();
    const { securitySchemes } = res.locals.operation;
    if (securityRequirements.some((schemes) => schemes &&
        securitySchemes &&
        Object.keys(schemes).some((scheme) => {
            const securityScheme = (0, lodash_1.get)(securitySchemes, scheme);
            return !!securityScheme && (0, exports.checkAuthByType)(securityScheme, req);
        }))) {
        return res.status(401).json({ message: 'Unauthorized request' });
    }
    return next();
};
exports.default = isAuthorized;
//# sourceMappingURL=isAuthenticated.js.map