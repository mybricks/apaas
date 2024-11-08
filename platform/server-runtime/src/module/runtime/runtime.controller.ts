import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Query,
  Param,
  Req,
  UseInterceptors,
  UseFilters,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fse from 'fs-extra';
import { ErrorExceptionFilter } from "./../../filter/exception.filter";

import { getServiceProject, execServiceToJson, debugPoolManager } from './../../utils/exec'
import { serviceLogger } from './../../utils/logger'
import env from './../../utils/env'

import { MiniAppService } from './../wechat/miniapp.service'


@Controller('/')
@UseFilters(ErrorExceptionFilter)
export default class RuntimeController {

  @Get('/service/:fileId/:serviceId')
  async apiRuntimeByJson_GET(
    @Body() body: any,
    @Query() query: any,
    @Req() req: Request,
    @Res() res: Response,
    @Param('fileId') fileId: string,
    @Param('serviceId') serviceId: string,
  ) {
    if (!fileId || !serviceId) {
      return res.status(200).send({
        code: -1,
        message: `fileId 或 serviceId 是必填项`
      })
    }
    
    const envType = req.headers['x-mybricks-target'] as string ?? 'prod';

    let scopePath = path.join(env.APP_PROJECT_BASE_PATH, envType);

    const { projectToJson, componentsMap } = await getServiceProject(fileId, scopePath)

    let startTime = Date.now();
    let rtValue
    try {
      rtValue = await execServiceToJson(projectToJson, {
        httpEnv: {
          query,
          body,
          req,
          res
        },
        runtimeEnv: {
          serviceId,
          database: projectToJson.database,
          componentsMap,
          logger: serviceLogger,
        },
        extraServices: {
          wechatMiniapp: new MiniAppService()
        }
      })
    } catch (error) {
      return res.status(200).send({
        code: -1,
        message: error?.message ?? '执行服务卡片失败，未知错误'
      })
    }

    return res.status(200).send({
      code: 1,
      data: rtValue,
      duration: Date.now() - startTime
    })
  }

  @Post('/service/:fileId/:serviceId')
  async apiRuntimeByJson_POST(
    @Body() body: any,
    @Query() query: any,
    @Req() req: Request,
    @Res() res: Response,
    @Param('fileId') fileId: string,
    @Param('serviceId') serviceId: string,
  ) {

    if (!fileId || !serviceId) {
      return res.status(200).send({
        code: -1,
        message: `fileId 或 serviceId 是必填项`
      })
    }

    const envType = req.headers['x-mybricks-target'] as string ?? 'prod';

    let scopePath = path.join(env.APP_PROJECT_BASE_PATH, envType);

    const { projectToJson, componentsMap } = await getServiceProject(fileId, scopePath)

    let startTime = Date.now();
    let rtValue
    try {
      rtValue = await execServiceToJson(projectToJson, {
        httpEnv: {
          query,
          body,
          req,
          res
        },
        runtimeEnv: {
          serviceId,
          database: projectToJson.database,
          componentsMap,
          logger: serviceLogger
        },
        extraServices: {
          wechatMiniapp: new MiniAppService()
        }
      })
    } catch (error) {
      return res.status(200).send({
        code: -1,
        message: error?.message ?? '执行服务卡片失败，未知错误'
      })
    }

    return res.status(200).send({
      code: 1,
      data: rtValue,
      duration: Date.now() - startTime
    })
  }

  @Post('/debug/start/:scopeId/:serviceId')
  async apiDebugStart(
    @Body() body: any,
    @Query() query: any,
    @Req() req: Request,
    @Res() res: Response,
    @Param('scopeId') scopeId: string,
    @Param('serviceId') serviceId: string,
  ) {

    if (!scopeId || !serviceId) {
      return res.status(200).send({
        code: -1,
        message: `scopeId 或 serviceId 是必填项`
      })
    }

    let scopePath = path.join(env.APP_PROJECT_BASE_PATH, 'only-debug');

    const { projectToJson, componentsMap } = await getServiceProject(scopeId, scopePath)

    let startTime = Date.now();
    let rtValue
    try {
      rtValue = await execServiceToJson(projectToJson, {
        httpEnv: {
          query,
          body,
          req,
          res
        },
        runtimeEnv: {
          serviceId,
          database: projectToJson.database,
          componentsMap,
          logger: serviceLogger,
        },
        debugEnv: {
          debuggerPanel: debugPoolManager.createDebugger(scopeId, serviceId)
        }
      })
    } catch (error) {
      return res.status(200).send({
        code: -1,
        message: error.message ?? '执行服务卡片失败，未知错误'
      })
    }

    return res.status(200).send({
      code: 1,
      data: rtValue,
      duration: Date.now() - startTime
    })
  }

  @Post('/debug/continue/:scopeId/:serviceId')
  async apiDebugContinue(
    @Param('scopeId') scopeId: string,
    @Param('serviceId') serviceId: string,
  ) {

    if (!scopeId || !serviceId) {
      return {
        code: -1,
        message: `scopeId 或 serviceId 是必填项`
      }
    }

    const serviceDebuggerItem = debugPoolManager.getDebugger(scopeId, serviceId)

    if (!serviceDebuggerItem) {
      return {
        code: -1,
        message: `当前服务没有可调试对象`
      }
    }
    await serviceDebuggerItem.debugger.next();
    
    return {
      code: 1,
    }
  }
  
}