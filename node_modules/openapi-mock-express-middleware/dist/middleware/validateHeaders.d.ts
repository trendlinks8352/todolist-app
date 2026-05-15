import express from 'express';
declare const validateHeaders: (req: express.Request, res: express.Response, next: express.NextFunction) => void | express.Response;
export default validateHeaders;
