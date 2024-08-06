import * as fse from 'fs-extra';
import * as path from 'path'

import { Request } from 'express'
import * as crypto from 'crypto';
import * as os from 'os';

import { Logger } from '@mybricks/rocker-commons';
import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule';

import { DataBaseConfig, MySqlCreateOption, CompileTarget, ServiceJson } from './types'

import env from '../../utils/env';

import FilePubDao from '../../dao/filePub.dao';


@Injectable()
export default class ProjectService {

  private filePubDao = new FilePubDao()


  /** 获取产物的项目路径 */
  public getProjectPath = async (id, target: CompileTarget) => {
    let scopeId = '';
    let scopePath = '';

    switch (true) {
      case target === 'staging':
        scopeId = id;
        scopePath = env.APP_PROJECT_STAGING_PATH;
        break;
      default:
        scopeId = id;
        scopePath = env.APP_PROJECT_PROD_PATH;
        break;
    }
    if (typeof scopeId === 'number') {
      scopeId = String(scopeId)
    }
    const targetFolder = path.join(scopePath, scopeId);

    if (!await fse.pathExists(targetFolder)) {
      return null
    }
    return targetFolder
  }

  /** 将项目编译成 Nodejs App 的形态 */
  public gennerateAsNodeJsApp = async (projectPath: string, { fileId, target }) => {
    if (!await fse.pathExists(projectPath)) {
      throw new Error(`项目 ${projectPath} 不存在`)
    }

    const projectMetaFilePath = path.resolve(projectPath, 'meta.json');

    const metaInfo = await fse.readJSON(projectMetaFilePath, 'utf-8');

    if (!metaInfo?.fileId || !metaInfo?.version) {
      throw new Error(`项目 ${projectPath} 的 meta.json 文件缺少 fileId 或 version 字段`)
    }

    const tmpProjectPath = path.join(os.tmpdir(), `node-app-${fileId}-${target}`);
    fse.ensureDir(tmpProjectPath);

    // 复制代码工程
    const runtimeProjectFolder = path.resolve(__dirname, './../../../../server-runtime');
    const copyList = ['src', 'scripts', 'ecosystem.config.js', 'index.js', 'nodemon.json', 'package.json', 'tsconfig.json'];

    await Promise.all(copyList.map(async (name) => {
      return fse.copy(path.join(runtimeProjectFolder, name), path.join(tmpProjectPath, name), { overwrite: true })
    }))

    // 写入 config.json
    const configJsonPath = path.resolve(tmpProjectPath, 'config.json')
    await fse.writeJSON(configJsonPath, { appName: `${target}_${fileId}`, port: 3106 }, 'utf-8')

    //复制产物代码
    const targetFilePath = path.join(tmpProjectPath, '_localstorage', '__app_projects__', target, fileId)
    await fse.ensureDir(targetFilePath)
    await fse.copy(projectPath, targetFilePath, { overwrite: true })


    return tmpProjectPath
  }

  /** 从数据源应用中获取数据库信息 */
  public getDataBaseConnectOption = async (config: DataBaseConfig, target: CompileTarget): Promise<MySqlCreateOption | null> => {
    if (!config?.filePubId) {
      return null
    }
    let connectOption = null as MySqlCreateOption
    try {
      const pubs = await this.filePubDao.query({ id: config.filePubId })
      const contentObj = JSON.parse(decodeURIComponent(pubs?.[0]?.content));
      switch (true) {
        case target === 'debug' || target === 'staging':
          connectOption = contentObj?.connectOption?.debug ?? null;
          break;
        case target === 'prod':
          connectOption = contentObj?.connectOption?.prod ?? null;
          break;
        default:
          connectOption = contentObj?.connectOption?.prod ?? null;
          break;
      }

    } catch (error) {
      Logger.error(`[project-getDatabase] 获取数据库信息失败，${error?.stack?.toString() ?? '未知错误'}`)
    }
    
    return connectOption
  }


  /** 分配调试时的 uuid */
  public getDebugFingerprint = (fileId, req: Request, body: any) => {
    let prefix = '';
    if (req?.headers) {
      prefix = `${req.headers['user-agent']}_${req.ip}_${fileId}`
    } else if (body?.req?.headers?.['user-agent'] && body?.req?.ip) {
      prefix = `${body?.req?.headers?.['user-agent']}_${body?.req?.ip}_${fileId}`
    } else {
      throw new Error(`debug 空间分配失败，用户标识信息缺失`)
    }
    return crypto.createHash('md5').update(`${req.headers['user-agent']}_${req.ip}_${fileId}`, 'utf-8').digest('hex');
  }
  
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async _cleanUnusedDebugFiles() {
    try {
      const folders = await fse.readdir(env.APP_PROJECT_DEBUG_PATH);

      const deleteFolders = []

      for (let index = 0; index < folders.length; index++) {
        const folder = folders[index];
        const metaFile = path.join(env.APP_PROJECT_DEBUG_PATH, folder, 'meta.json');

        if (!await fse.pathExists(metaFile)) {
          deleteFolders.push(folder);
        } else {
          const statInfo = await fse.stat(metaFile); 
          const isBefore24Hour = (Date.now() - statInfo.atimeMs) >= 24 * 60 * 60 * 1000;
          if (isBefore24Hour) {
            deleteFolders.push(folder);
          }
        }
      }
      await Promise.all(deleteFolders.map(name => fse.remove(path.join(env.APP_PROJECT_DEBUG_PATH, name))))
      Logger.info(`[清理服务文件] 清理成功，已清理 ${deleteFolders.length} 文件`)
    } catch (error) {
      Logger.error(`[清理服务文件] 清理失败，${error?.stack?.toString() ?? '未知错误'}`)
    }
  }
}