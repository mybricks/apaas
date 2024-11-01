import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as path from "path";
import * as cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import { logger } from './utils/logger'
import { getExistedProjects } from './utils/get-projects'

import { HttpLogMiddleWare } from './middleware/http-log.middleware'

import { mountProjects } from './mount-projects'

const configuration = require('./../scripts/shared/read-config')


// Nestjs App 全局配置和入口 
import { AppModule } from "./app.module";


// 启动逻辑
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

   // 进程错误日志
   process.on("unhandledRejection", (e: Error) => {
    logger.error({ error: e }, 'unhandledRejection');
  });

  process.on('uncaughtException', (e: Error) => {
    logger.error({ error: e }, 'uncaughtException');
  });

  //支持解析 json 数据
  app.use(bodyParser.json({ limit: "100mb" }));

  // 支持解析 text/plain 类型数据
  app.use(bodyParser.text({ type: 'text/plain' }));

  app.enableCors({
    // origin: [],
    origin: true,
    allowedHeaders: "*",
    methods: "GET,PUT,POST,DELETE,UPDATE,PATCH,OPTIONS",
    credentials: true,
  });

  // cookie 解析
  app.use(cookieParser());
  
  // Http log
  app.use(HttpLogMiddleWare);

  mountProjects(app);

  const port = configuration?.port ?? 3106;
  await app.listen(port, async () => {
    console.log(`[MyBricks] 运行容器已启动，启动端口号为 ${port}`)
    // console.log(`当前可运行的项目如下：`)
    // console.log((await getExistedProjects('http://localhost:3106')).join('\n'))
  });
}


// 启动
bootstrap()