import { NextFunction, Request } from "express";
import { Logger } from '@mybricks/rocker-commons';
import { formatBodyOrParamsData } from "../utils/traverse";
interface Option {
  appNamespaceList?: string[];
}

export function runtimeLogger(option: Option = {}) {
  const { appNamespaceList = [] } = option;

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
      Logger.info(`[application: ${application}] [timestamp: ${new Date().toLocaleString()}] [code: ${res.statusCode}] [method: ${req.method}] [refer: ${req.headers.referer}] [userAgent: ${req.headers['user-agent']}] [params: ${JSON.stringify(formattedParams || null)}] [path: ${req.path}] [ip: ${req.ip}]`);
    });
    next();
  };
}