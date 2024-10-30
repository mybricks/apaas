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

import { DataBaseConfig, EnvType, ServiceComlib } from './types'
interface ServicePushConfig {
  envType: EnvType,
  database: DataBaseConfig,
  json: any,
  fileId: string,
  version: string,
  serviceComlibs: ServiceComlib[]
}
interface FePushConfig {
  envType: EnvType,
  files: any[],
  fileId: string,
  version: string
}

@Controller('/paas/api/project')
@UseFilters(ErrorExceptionFilter)
export default class ProjectController {

  projectService: ProjectService = new ProjectService();

  @Post('/service/push')
  async pushServicePoroject(
    @Body() body: any,
    @Req() req: Request,
  ) {

    const { envType = 'only-debug', database: databaseConfig, json, fileId, version, serviceComlibs }: ServicePushConfig = body ?? {}

    let scopeId = envType === 'only-debug' ? this.projectService.getDebugFingerprint(fileId, req, body) : fileId;
    let scopePath = path.join(env.APP_PROJECT_BASE_PATH, envType);
    if (typeof scopeId === 'number') {
      scopeId = String(scopeId)
    }

    const database = await this.projectService.getDataBaseConnectOption(databaseConfig, envType)

    const { projectPath } = await createProjectService(scopeId, scopePath, {
      metaInfo: {
        fileId,
        version
      },
      serviceComlibs,
      database,
      toJson: json
    })


    return {
      code: 1,
      data: {
        projectPath,
        scopeId,
      },
    }
  }

  // @Post('/frontEnd/push')
  // async pushFrontEndPoroject(
  //   @Body() body: any,
  //   @Req() req: Request,
  // ) {

  //   const { envType, files, fileId, version }: FePushConfig = body ?? {}

  //   let scopeId = envType === 'only-debug' ? this.projectService.getDebugFingerprint(fileId, req, body) : fileId;
  //   let scopePath = path.join(env.APP_PROJECT_BASE_PATH, envType);
  //   if (typeof scopeId === 'number') {
  //     scopeId = String(scopeId)
  //   }
  //   let rtUrl = `/${envType}/${fileId}/index`;

  //   const { projectPath } = await createProjectFrontEnd(scopeId, scopePath, {
  //     files
  //   })

  //   return {
  //     code: 1,
  //     data: {
  //       projectPath,
  //       requestPathPrefix: `${rtUrl}`
  //     }
  //   }
  // }


  // @Get('/download')
  // async donwloadProject(
  //   @Query('target') target: 'prod' | 'staging',
  //   @Query('fileId') fileId: string,
  //   @Query('port') port: number,
  //   @Res() response: Response,
  //   @Query('type') zipType?: 'fe' | 'app',
  // ) {
  //   const projectPath = await this.projectService.getProjectPath(fileId, target);

  //   let tmpProjectPath
  //   let targetPath

  //   switch(true) {
  //     case zipType === 'fe': {
  //       tmpProjectPath = await this.projectService.gennerateAsFrontEndApp(projectPath, { fileId, target });
  //       targetPath = await zipDirectory(tmpProjectPath, `${fileId}_${target}_front_end.zip`);
  //       break;
  //     }
  //     default: {
  //       tmpProjectPath = await this.projectService.gennerateAsNodeJsApp(projectPath, { fileId, target, port });
  //       targetPath = await zipDirectory(tmpProjectPath, `${fileId}_${target}.zip`);
  //       break;
  //     }
  //   }

  //   response.once('close', () => {
  //     // 清理压缩包
  //     try {
  //       fse.remove(targetPath)
  //     } catch (error) { }
  //     // 清理生成的临时项目目录
  //     try {
  //       fse.remove(tmpProjectPath)
  //     } catch (error) { }
  //   })

  //   response.sendFile(targetPath);
  // }

}