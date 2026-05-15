import express from 'express';
declare const validatePath: (req: express.Request, res: express.Response, next: express.NextFunction) => void | express.Response;
export default validatePath;
