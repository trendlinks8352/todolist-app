import express from 'express';
declare const validateQuery: (req: express.Request, res: express.Response, next: express.NextFunction) => void | express.Response;
export default validateQuery;
