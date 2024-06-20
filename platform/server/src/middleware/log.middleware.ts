import { NextFunction, Request } from "express";
import { Logger } from '@mybricks/rocker-commons';
import { formatBodyOrParamsData } from "../utils/traverse";
import { ChildLogger } from '../utils/child-logger'
import env from '../utils/env'
import * as path from 'path'
const userConfig = require('./../../../../scripts/shared/read-user-config.js')();

interface Option {
  appNamespaceList?: string[];
}

export function runtimeLogger(option: Option = {}) {
  const { appNamespaceList = [] } = option;

  const childLogger = new ChildLogger({
    logDir: path.join(env.FILE_ANALYSIS_ONLINEUSERS_FOLDER)
  })

  const openMonitor = userConfig?.platformConfig?.openMonitor;

  return async (req: Request, res, next: NextFunction) => {
    let formattedParams = req.query;
    try {
      formattedParams = formatBodyOrParamsData(req.query);
    } catch (err) {
      formattedParams = req.query;
    }
    const application = appNamespaceList.find(namespace => req.path?.startsWith?.(`/${namespace}`)) || 'platform';

    if (req.method !== 'GET' && req.method !== 'DELETE') {
      formattedParams = req.body;
      try {
        formattedParams = formatBodyOrParamsData(req.body);
      } catch (err) {
        formattedParams = req.body;
      }
    }

    res.on('close', () => {
      if (!['/paas/api/file/getCooperationUsers'].includes(req.path)) {
        Logger.info(`[application: ${application}] [code: ${res.statusCode}] [method: ${req.method}] [refer: ${req.headers.referer}] [userAgent: ${req.headers['user-agent']}] [params: ${JSON.stringify(formattedParams || null)}] [path: ${req.path}] [ip: ${req.ip}]`);
      } else if (openMonitor) {
        try {
          childLogger.info({
            ...(formattedParams ?? {}),
            refer: req.headers.referer,
            userAgent:req.headers['user-agent'],
          })
        } catch (error) {
          
        }
      }
    });
    next();
  };
}