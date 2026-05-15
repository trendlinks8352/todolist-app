"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isAuthenticated_1 = require("./isAuthenticated");
/* eslint-disable @typescript-eslint/no-unused-vars */
describe('isAuthenticated', () => {
    describe('checkAuthByType', () => {
        it('should authenticate unsuppoted security types', () => {
            const request = {};
            const securityScheme = {
                type: 'openIdConnect',
                openIdConnectUrl: 'http://some-url.com',
            };
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, request)).toBe(false);
        });
        it('should check auth for the oauth2 security type', () => {
            const securityScheme = {
                type: 'oauth2',
            };
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                header(name) {
                    return `Bearer ${name}`;
                },
            })).toBe(false);
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                header(name) {
                    return `Bearer ${name}`;
                },
            })).toBe(false);
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                header(name) {
                    return undefined;
                },
            })).toBe(true);
        });
        it('should check auth for the http basic security type', () => {
            const securityScheme = {
                type: 'http',
                scheme: 'basic',
            };
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                header(name) {
                    return `Basic ${name}`;
                },
            })).toBe(false);
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                header(name) {
                    return undefined;
                },
            })).toBe(true);
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                header(name) {
                    return `test ${name}`;
                },
            })).toBe(true);
        });
        it('should check auth for the http bearer security type', () => {
            const securityScheme = {
                type: 'http',
                scheme: 'bearer',
            };
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                header(name) {
                    return `Bearer ${name}`;
                },
            })).toBe(false);
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                header(name) {
                    return undefined;
                },
            })).toBe(true);
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                header(name) {
                    return `test ${name}`;
                },
            })).toBe(true);
        });
        it('should check auth for the apiKey security type in headers', () => {
            const securityScheme = {
                type: 'apiKey',
                in: 'header',
                name: 'api-key',
            };
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                header(name) {
                    return `${name}`;
                },
            })).toBe(false);
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                header(name) {
                    return undefined;
                },
            })).toBe(true);
        });
        it('should check auth for the apiKey security type in the query', () => {
            const securityScheme = {
                type: 'apiKey',
                in: 'query',
                name: 'authKey',
            };
            const query = {
                query: {
                    authKey: 'test',
                },
            };
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, query)).toBe(false);
            const wrongQuery = {
                query: {
                    someOtherKey: 'test',
                },
            };
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, wrongQuery)).toBe(true);
        });
        it('should check auth for the apiKey security type in cookies', () => {
            const securityScheme = {
                type: 'apiKey',
                in: 'cookie',
                name: 'authKey',
            };
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                cookies: {
                    authKey: 'test',
                },
            })).toBe(false);
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                cookies: {
                    someOtherKey: 'test',
                },
            })).toBe(true);
        });
        it('should authorize the apiKey security type of unknown type', () => {
            const securityScheme = {
                type: 'apiKey',
                in: 'unknown',
                name: 'authKey',
            };
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                cookies: {
                    authKey: 'test',
                },
            })).toBe(false);
            expect((0, isAuthenticated_1.checkAuthByType)(securityScheme, {
                cookies: {
                    someOtherKey: 'test',
                },
            })).toBe(false);
        });
    });
});
/* eslint-enable @typescript-eslint/no-unused-vars */
//# sourceMappingURL=isAuthenticated.spec.js.map