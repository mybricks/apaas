
import { NextFunction, Request, Response } from "express";
import pinoHttp from 'pino-http';
import { logger } from './../utils/logger'

export const HttpLogMiddleWare = async (req: Request, res: Response, next: NextFunction) => {
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          headers: {
            'origin': req.headers['origin'],
            'host': req.headers['host'],
            'referer': req.headers['referer'],
            'user-agent': req.headers['user-agent'],
            'x-mybricks-target': req.headers['x-mybricks-target'],
          }
        }
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        }
      }
    }
  })(req, res, next)
}