import express from 'express';
import { OpenAPIV3 } from 'openapi-types';
export declare const checkAuthByType: (securityScheme: OpenAPIV3.SecuritySchemeObject, req: express.Request) => boolean;
declare const isAuthorized: (req: express.Request, res: express.Response, next: express.NextFunction) => void | express.Response;
export default isAuthorized;
