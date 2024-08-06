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
import * as os from 'os'
import { ErrorExceptionFilter } from "../../filter/exception.filter";

import { createProjectService, createProjectFrontEnd } from './create-project'
import ProjectService from './project.service';
import { zipDirectory } from '../../utils'

import env from '../../utils/env'

import { DataBaseConfig, CompileTarget } from './types'


@Controller('/paas/api/project')
@UseFilters(ErrorExceptionFilter)
export default class ProjectController {

  projectService: ProjectService = new ProjectService();

  @Post('/service/push')
  async pushServicePoroject(
    @Body() body: any,
    @Req() req: Request,
  ) {

    const { target, database: databaseConfig, json, fileId, version }: { target: CompileTarget, database: DataBaseConfig, json: any, fileId: string, version: string } = body ?? {}

    let scopeId = '';
    let scopePath = '';

    switch (true) {
      case target === 'debug':
        scopeId = this.projectService.getDebugFingerprint(fileId, req, body);
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

    const { projectPath } = await createProjectService(scopeId, scopePath, {
      metaInfo: {
        fileId,
        version,
      },
      database,
      toJson: json
    })


    return {
      code: 1,
      data: {
        projectPath,
        scopeId,
        requestPathPrefix: `/service/${scopeId}`
      },
    }
  }

  @Post('/frontEnd/push')
  async pushFrontEndPoroject(
    @Body() body: any,
    @Req() req: Request,
  ) {

    const { target, files, fileId, version }: { target: CompileTarget, files: any[], fileId: string, version: string } = body ?? {}

    let scopeId = '';
    let scopePath = '';
    let rtUrl = ''

    switch (true) {
      case target === 'debug':
        scopeId = this.projectService.getDebugFingerprint(fileId, req, body);
        scopePath = env.APP_PROJECT_DEBUG_PATH;
        break;
      case target === 'staging':
        scopeId = fileId;
        scopePath = env.APP_PROJECT_STAGING_PATH;
        rtUrl = `/preview/${fileId}/index`;
        break;
      default:
        scopeId = fileId;
        scopePath = env.APP_PROJECT_PROD_PATH;
        rtUrl = `/app/${fileId}/index`
        break;
    }
    if (typeof scopeId === 'number') {
      scopeId = String(scopeId)
    }

    const { projectPath } = await createProjectFrontEnd(scopeId, scopePath, {
      metaInfo: {
        fileId,
        version,
      },
      files
    })

    return {
      code: 1,
      data: {
        projectPath,
        requestPathPrefix: `${rtUrl}`
      }
    }
  }


  @Get('/download')
  async donwloadProject(
    @Query('target') target: 'prod' | 'staging',
    @Query('fileId') fileId: string,
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

    const projectPath = await this.projectService.getProjectPath(fileId, target);

    const tmpProjectPath = await this.projectService.gennerateAsNodeJsApp(projectPath, { fileId, target });

    const targetPath = await zipDirectory(tmpProjectPath, `${fileId}_${target}.zip`);

    response.once('close', () => {
      // 清理压缩包
      try {
        fse.remove(targetPath)
      } catch (error) {}
      // 清理生成的临时项目目录
      try {
        fse.remove(tmpProjectPath)
      } catch (error) {}
    })

    response.sendFile(targetPath);
  }

}