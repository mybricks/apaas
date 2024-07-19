import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Query,
  Param,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  UseFilters,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as crypto from 'crypto';
import { ErrorExceptionFilter } from "../../filter/exception.filter";

import { createProjectService, createProjectFrontEnd } from './create-project'
import ProjectService from './project.service';
import { zipDirectory } from '../../utils'

import env from '../../utils/env'

import { DataBaseConfig, CompileTarget } from './types'

// TODO，支持配置
const PREFIX_URL = '/runtime'


@Controller('/paas/api/project')
@UseFilters(ErrorExceptionFilter)
export default class ProjectController {

  projectService: ProjectService = new ProjectService();

  @Post('/service/push')
  async pushServicePoroject(
    @Body('target') target: CompileTarget,
    @Body('json') json: any,
    @Body('database') databaseConfig: DataBaseConfig,
    @Body('fileId') fileId: string,
    @Body('version') version: string,
    @Req() req: any
  ) {
    let scopeId = '';
    let scopePath = '';

    try {
      switch (true) {
        case target === 'debug':
          scopeId = crypto.createHash('md5').update(`${req.headers['user-agent']}_${req.ip}_${fileId}`, 'utf-8').digest('hex');
          scopePath = env.APP_PROJECT_DEBUG_PATH;
          break;
        case target === 'staging':
          scopeId = fileId;
          scopePath = env.APP_PROJECT_STAGING_PATH;
          break;
        default:
          scopeId = fileId;
          scopePath = env.APP_PROJECT_PROD_PATH;
          break;
      }
      if (typeof scopeId === 'number') {
        scopeId = String(scopeId)
      }

      const database = await this.projectService.getDataBaseConnectOption(databaseConfig, target)

      await createProjectService(scopeId, scopePath, {
        metaInfo: {
          fileId,
          version,
        },
        database,
        toJson: json
      })
    } catch (error) {
      return {
        code: -1,
        message: error.message ?? '生成项目失败，未知错误'
      }
    }

    return {
      code: 1,
      data: {
        scopeId,
        requestPathPrefix: `${PREFIX_URL}/service/${scopeId}`
      },
    }
  }

  @Post('/frontEnd/push')
  async pushFrontEndPoroject(
    @Body('target') target: CompileTarget,
    @Body('files') files: any,
    @Body('fileId') fileId: string,
    @Body('version') version: string,
    @Body('appConfig') appConfig: any,
    @Req() req: Request
  ) {
    let scopeId = '';
    let scopePath = '';

    let rtUrl = ''

    try {
      switch (true) {
        case target === 'debug':
          scopeId = crypto.createHash('md5').update(`${req.headers['user-agent']}_${req.ip}_${fileId}`, 'utf-8').digest('hex');
          scopePath = env.APP_PROJECT_DEBUG_PATH;
          break;
        case target === 'staging':
          scopeId = fileId;
          scopePath = env.APP_PROJECT_STAGING_PATH;
          rtUrl = `/preview/${fileId}`
          break;
        default:
          scopeId = fileId;
          scopePath = env.APP_PROJECT_PROD_PATH;
          rtUrl = `/app/${fileId}`
          break;
      }
      if (typeof scopeId === 'number') {
        scopeId = String(scopeId)
      }

      await createProjectFrontEnd(scopeId, scopePath, {
        metaInfo: {
          fileId,
          version,
        },
        files
      })
    } catch (error) {
      return {
        code: -1,
        message: error.message ?? '生成项目失败，未知错误'
      }
    }

    return {
      code: 1,
      data: {
        requestPathPrefix: `${PREFIX_URL}${rtUrl}`
      }
    }
  }


  @Post('/download')
  async donwloadProject(
    @Body('target') target: 'prod' | 'staging',
    @Body('fileId') fileId: string,
    @Req() req: Request,
    @Res() response: Response
  ) {
    let scopeId = '';
    let scopePath = '';

    switch (true) {
      case target === 'staging':
        scopeId = fileId;
        scopePath = env.APP_PROJECT_STAGING_PATH;
        break;
      default:
        scopeId = fileId;
        scopePath = env.APP_PROJECT_PROD_PATH;
        break;
    }
    if (typeof scopeId === 'number') {
      scopeId = String(scopeId)
    }

    const targetFolder = path.join(scopePath, scopeId);

    if (!await fse.pathExists(targetFolder)) {
      return response.send({
        code: -1,
        message: `目标产物不存在：${fileId} ${target}`,
      })
    }

    const { targetPath, clean } = await zipDirectory(targetFolder, `${fileId}_${target}.zip`);

    response.once('close', () => {
      // 清理压缩包
      clean();
    })

    response.sendFile(targetPath);
  }

}