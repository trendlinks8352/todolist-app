import express from 'express';
declare const validateBody: (req: express.Request, res: express.Response, next: express.NextFunction) => void | express.Response;
export default validateBody;
