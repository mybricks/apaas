import { Request, Response, NextFunction } from 'express';
// import { Logger } from '@mybricks/rocker-commons';

export function checkHealthMiddleware(req: Request, res: Response, next: NextFunction) {
  if ((req.method === 'HEAD' || req.method === 'GET') && (req.url === '/liveness')) {
    // Logger.info(`健康检查: ${req.method}, ${req.url}`);
    res.status(200).send('ok');
    return 
  }
  next();
};