import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@mybricks/rocker-commons';
import * as compression from 'compression';
const userConfig = require('./../../../../scripts/shared/read-user-config.js')()

const _compression = compression();

const gzip = userConfig?.platformConfig?.gzip;

export function gzipMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    if (!!gzip && ['/paas/api/workspace/getFileContents', '/paas/api/workspace/getFullFile'].includes(req.path)) {
      const startHrTime = Date.now();
      _compression(req, res, () => {
        next()
      });
      res.on('finish', () => {
        Logger.info(`[compression: gzip] [path: ${req.originalUrl}] [duration: ${Date.now() - startHrTime}]`);
      });
    } else {
      next();
    }
  } catch (error) {
    Logger.error(`[gzip] ${req.originalUrl} 压缩失败，${error.stack?.toString()}`, error)
    next();
  }
};