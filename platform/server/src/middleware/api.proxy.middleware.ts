import { NextFunction, Request } from "express";
import { TIMEOUT_TIME } from '../constants';
const proxy = require('express-http-proxy');
const URL = require('url');

interface Option {
  proxyTarget?: string;
}

export function apiProxy(option: Option = {}) {
  return async (req: Request, res, next: NextFunction) => {
    try {
      let url = req.headers['X-Target-Url'] || req.headers['x-target-url'];
      const regex = /(?:https?:\/\/)?(?:www\.)?([^\/]+)/;
      const host = url?.match?.(regex)?.[1];

      if (!/(?:\/[^\/]*)?\/paas\/api\/proxy/.test(req.path) || !url || !host) {
        return next();
      }
      /** 防止代理到自身，造成死循环 */
      if (host === req.hostname) return next();

      const origin = url.match(/(https?:\/\/)?(?:www\.)?([^\/]+)/)?.[0];
      req.url = url.replace(origin, '');
      req.headers.origin = origin;
      req.headers.host = host;

      return proxy(url, {
        limit: '100mb',
        timeout: TIMEOUT_TIME,
        proxyReqPathResolver: req => {
          const parse = URL.parse(req.url, true);
          parse.query = { ...(parse.query || {}), ...req.query };
          let url = req.url.split('?')[0];

          if (Object.keys(parse.query).length) {
            Object.keys(req.query).forEach(key => {
              url += `${url.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(req.query[key])}`;
            });
          }

          return url;
        },
        proxyErrorHandler: function(err, res, next) {
          switch (err && err.code) {
            case 'ENOTFOUND': { return res.status(500).send({ statusCode: 500, message: '请求域名 DNS 解析错误，请检查请求域名配置' }); }
            case 'ECONNREFUSED': { return res.status(500).send({ statusCode: 500, message: '请求服务拒绝连接，请检查请求域名对应服务端是否正常' }); }
            case 'ECONNRESET': { return res.status(500).send({ statusCode: 500, message: 'socket hang up，请确认服务端处理逻辑是否正常' }); }
            default: { next(err); }
          }
        }
      })(req, res, next);
    } catch (e) {
      return next();
    }
  };
}
