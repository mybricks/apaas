import { NextFunction, Request, Response } from "express";
import { Logger } from '@mybricks/rocker-commons';
import { formatBodyOrParamsData } from "../utils/traverse";
import { ChildLogger } from '../utils/child-logger'
import env from '../utils/env'
import * as path from 'path'

import { configuration } from './../utils/shared'

interface Option {
  appNamespaceList?: string[];
}

export function runtimeLogger(option: Option = {}) {
  const { appNamespaceList = [] } = option;

  const childLogger = new ChildLogger({
    logDir: path.join(env.FILE_ANALYSIS_ONLINEUSERS_FOLDER)
  })

  const openMonitor = configuration?.platformConfig?.openMonitor;

  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now()
    let duration;
    res.on('finish', () => {
      duration = Date.now() - startTime
    })
    res.on('close', () => {
      if (!duration) {
        duration = Date.now() - startTime
      }
      if (!['/paas/api/file/getCooperationUsers'].includes(req.path)) {
        const application = appNamespaceList.find(namespace => req.originalUrl?.startsWith?.(`/${namespace}`)) || 'platform';
        Logger.info(`[application: ${application}] [code: ${res.statusCode}] [method: ${req.method}] [duration: ${duration}] [path: ${req.path}] [url: ${req.originalUrl}] [ip: ${req.ip}] [refer: ${req.headers.referer}] [userAgent: ${req.headers['user-agent']}]`);
      } else if (openMonitor) {
        try {
          childLogger.info({
            ...(getParamsFromReq(req) ?? {}),
            refer: req.headers.referer,
            userAgent: req.headers['user-agent'],
          })
        } catch (error) {

        }
      }
    });
    next();
  };
}


function getParamsFromReq(req: Request) {
  let formattedParams = req.query;
  try {
    formattedParams = formatBodyOrParamsData(req.query);
  } catch (err) {
    formattedParams = req.query;
  }
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    formattedParams = req.body;
    try {
      formattedParams = formatBodyOrParamsData(req.body);
    } catch (err) {
      formattedParams = req.body;
    }
  }

  return formattedParams ?? {}
}