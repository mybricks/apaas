import * as path from "path";
import * as fs from 'fs';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express'
import { NextFunction, Request, Response, Application } from "express";

import env from './utils/env'

const AliasEnvMap = {
  ['only-debug']: 'only-debug',
  ['only-preview']: 'only-preview',
  prod: 'prod',
}

/** 如果通过 HTTP 访问静态资源中非front_end文件夹的资源，则不允许访问 */
function onlyFrontEndFolderCanAccess (req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/static') && req.path.indexOf('front_end') === -1) {
    // res.status(404).send('Not Found');
    res.status(403).send('Forbidden');
  } else {
    next();
  }
}

function forbiddenStaticAccessMiddleware (req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/static')) {
    // res.status(404).send('Not Found');
    res.status(403).send('Forbidden');
  } else {
    next();
  }
}


function redirectProjectMiddleware (req: Request, res: Response, next: NextFunction) {
  const matchedEnvKey = Object.keys(AliasEnvMap).find(path => req.path.startsWith(`/${path}`));
  if (!matchedEnvKey) { // 没命中则跳过
    return next();
  }

  // 命中的具体env
  const matchedEnv = AliasEnvMap[matchedEnvKey];

  const restPath = req.path.replace(`/${matchedEnvKey}`, '').split('/').filter(t => !!t);
  // 项目ID
  const projectId = restPath.shift();

  // API 接口，支持通过相对路径「环境/项目ID/api/服务ID」的方式请求
  if (restPath[0] === 'api' && restPath.length > 1) {
    req.url = `/service/${projectId}/${restPath[1]}`;
    req.headers['x-mybricks-target'] = matchedEnv
    return next()
  }

  // 前端文件，重定向到静态服务器
  let redirectPath = `/static/${matchedEnv}/${projectId}/front_end/${restPath.join('/')}`;
  req.url = redirectPath
  next();
}

export function mountProjects (app: NestExpressApplication) {
  // 处理不允许访问的静态资源路径
  app.use(forbiddenStaticAccessMiddleware)
  // 处理项目静态资源的 url 重定向
  app.use(redirectProjectMiddleware)
  // 启动静态资源服务器
  app.useStaticAssets(env.APP_PROJECT_BASE_PATH, {
    prefix: '/static',
    index: false,
    etag: true,
    extensions: ['html', 'htm']
  });
}

