import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Logger } from '@mybricks/rocker-commons'
import * as path from "path";
import * as cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import * as xmlparser from 'express-xml-bodyparser';

import { apiProxy as apiProxyMiddleWare } from './middleware/api.proxy.middleware';
import { timeout } from "./middleware/requestTimeout.middleware";
import { checkHealthMiddleware } from './middleware/checkHealth.middleware';
import { gzipMiddleware } from './middleware/gzip.middleware'


import { runtimeLogger } from './middleware/log.middleware';
import initDatabase from "./init-database";
import { onProcessExit } from './on-process-exit'
import { initLogger } from './utils/logger';

import { loadInstalledAppMeta, installedAppMount, installedAppRouterMount, installedAppMiddlewareMount } from './mount-installed-apps'

import env from './utils/env'

import { TIMEOUT_TIME } from './constants';

// Nestjs App 全局配置和入口 
import { AppModule } from "./app.module";

import { configuration } from './utils/shared'

// 启动逻辑
async function bootstrap() {
  // 日志功能
  initLogger()

  // 进程错误日志
  process.on("unhandledRejection", (e: Error) => {
    Logger.error(`[global error][unhandledRejection]: ${e?.stack ? e?.stack?.toString() : e?.message}`);
  });

  process.on('uncaughtException', (e: Error) => {
    Logger.error(`[global error][uncaughtException]: ${e?.stack ? e?.stack?.toString() : e?.message}`);
  });

  // 加载当前安装的所有应用
  const installedAppsMeta = await loadInstalledAppMeta();

  // 连接数据库
  initDatabase(installedAppsMeta.map(app => app.mapperFolderDirectory).filter(p => !!p));

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());
  app.use(xmlparser());

  // 根据加载的应用，支持对应的html渲染
  installedAppMount(app, installedAppsMeta);
  
  // 根据加载的应用，自动修改其API接口的路径
  installedAppRouterMount(app, installedAppsMeta)

  // 根据加载的应用，挂在中间件
  installedAppMiddlewareMount(app, installedAppsMeta)

  // 设置平台的静态资源路径
  app.useStaticAssets(env.PLATFORM_ASSETS_FOLDER, {
    prefix: "/",
    index: false,
    setHeaders: (res, path, stat) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cache-Control', 'private, max-age=0') // 平台文件不大，都走协商缓存
    },
    etag: true,
  });

  // 设置整个 mfs 的静态资源
  app.useStaticAssets(env.FILE_LOCAL_STORAGE_FOLDER, {
    prefix: `/${env.FILE_LOCAL_STORAGE_PREFIX}`,
    index: false,
    setHeaders: (res, path, stat) => {
      res.set('Access-Control-Allow-Origin', '*');
      if (path?.indexOf('.html') > -1) {
        res.set('Cache-Control', 'private, max-age=0') // html文件走协商缓存，private 为仅客户端可缓存，代理服务器不缓存
      } else {
        res.set('Cache-Control', `private, max-age=${60 * 60 * 24 * 7}`) // 其它文件走强缓存，7天内同名文件缓存，private 为仅客户端可缓存，代理服务器不缓存
      }
    },
    etag: true,
  });

  // 支持应用调试时的http代理
  app.use(apiProxyMiddleWare());

  app.use(bodyParser.json({ limit: "100mb" }));
  app.use(runtimeLogger({
    appNamespaceList: installedAppsMeta.map(app => app.namespace),
  }));

  app.use(checkHealthMiddleware);

  app.enableCors({
    // origin: [],
    origin: true,
    allowedHeaders: "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe",
    methods: "GET,PUT,POST,DELETE,UPDATE,PATCH,OPTIONS",
    credentials: true,
  });

  app.use(gzipMiddleware)
  
  // 支持接口的超时时间设置
  app.use(timeout(TIMEOUT_TIME))

  await app.listen(configuration?.platformConfig?.port || 3100);

  // 应用被结束或者重启时的操作
  onProcessExit({ app })
}


// 启动
bootstrap()