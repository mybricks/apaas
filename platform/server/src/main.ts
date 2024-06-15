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

import { runtimeLogger } from './middleware/log.middleware';
import initDatabase from "./init-database";
import { initLogger } from './utils/logger';

import { loadInstalledAppMeta, installedAppMount, installedAppRouterMount } from './mount-installed-apps'

import env from './utils/env'

import { TIMEOUT_TIME } from './constants';

// Nestjs App 全局配置和入口 
import { AppModule } from "./app.module";

const userConfig = require('./../../../scripts/shared/read-user-config.js')()

// 启动逻辑
async function bootstrap() {
  // 日志功能
  initLogger()

  // 进程错误日志
  process.on("unhandledRejection", (e: any) => {
    Logger.info(`[global error][unhandledRejection]: \n`);
    Logger.info(e.message)
    Logger.info(e?.stack?.toString())
  });

  // 加载当前安装的所有应用
  const installedAppsMeta = await loadInstalledAppMeta();

  // 连接数据库
  initDatabase(installedAppsMeta.map(app => app.mapperFolderDirectory).filter(p => !!p));

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 根据加载的应用，支持对应的html渲染
  installedAppMount(app, installedAppsMeta);
  // 根据加载的应用，自动修改其API接口的路径

  installedAppRouterMount(app, installedAppsMeta)


  // 设置平台的静态资源路径
  app.useStaticAssets(env.PLATFORM_ASSETS_FOLDER, {
    prefix: "/",
    index: false,
    setHeaders: (res, path, stat) => {
      res.set('Access-Control-Allow-Origin', '*');
      // if (path?.indexOf('.js') > -1 || path?.indexOf('.css') > -1) {
      //   res.set('Cache-Control', 'no-cache') // 1d
      // }
    },
    etag: true,
    lastModified: true,
  });

  // 设置整个 mfs 的静态资源
  app.useStaticAssets(env.FILE_LOCAL_STORAGE_FOLDER, {
    prefix: `/${env.FILE_LOCAL_STORAGE_PREFIX}`,
    index: false,
    setHeaders: (res, path, stat) => {
      res.set('Access-Control-Allow-Origin', '*');
      // res.set('Cache-Control', 'max-age=86400000') // 1d
    },
    etag: true,
    lastModified: true,
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


  app.use(cookieParser());
	app.use(xmlparser());

  // 支持接口的超时时间设置
  app.use(timeout(TIMEOUT_TIME))

  await app.listen(userConfig?.platformConfig?.port || 3100);
}


// 启动
bootstrap()