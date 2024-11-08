import * as fse from 'fs-extra';
import * as path from 'path'

import { Request } from 'express'
import * as crypto from 'crypto';
import * as os from 'os';

import { Logger } from '@mybricks/rocker-commons';
import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule';

import { DataBaseConfig, MySqlCreateOption, CompileTarget, EnvType, ServiceJson } from './types'

import env from '../../utils/env';

import FilePubDao from '../../dao/filePub.dao';


@Injectable()
export default class ProjectService {

  private filePubDao = new FilePubDao()


  /** 获取产物的项目路径 */
  public getProjectPath = async (id, envType: EnvType) => {
    let scopeId = id;
    let scopePath = path.join(env.APP_PROJECT_BASE_PATH, envType);
    if (typeof scopeId === 'number') {
      scopeId = String(scopeId)
    }
    const targetFolder = path.join(scopePath, scopeId);

    if (!await fse.pathExists(targetFolder)) {
      return null
    }
    return targetFolder
  }

  /** 编译成 仅包含前端产物 的形态 */
  public gennerateAsFrontEndApp = async (projectPath: string, { fileId, target }) => {
    if (!await fse.pathExists(projectPath)) {
      throw new Error(`项目 ${projectPath} 不存在`)
    }

    const tmpProjectPath = path.join(os.tmpdir(), `fe-app-${fileId}-${target}`);
    fse.ensureDir(tmpProjectPath);

    //复制产物代码
    const targetFilePath = path.join(tmpProjectPath, '_localstorage', '__app_projects__', target, fileId, 'front_end')
    await fse.ensureDir(targetFilePath)
    await fse.copy(projectPath, targetFilePath, { overwrite: true })

    return tmpProjectPath
  }

  /** 将项目编译成 Nodejs App 的形态 */
  public gennerateAsNodeJsApp = async (projectPath: string, { fileId, target, port }) => {
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
    await fse.writeJSON(configJsonPath, { appName: `${target}_${fileId}`, port: port ?? 3106 }, 'utf-8')

    //复制产物代码
    const targetFilePath = path.join(tmpProjectPath, '_localstorage', '__app_projects__', target, fileId)
    await fse.ensureDir(targetFilePath)
    await fse.copy(projectPath, targetFilePath, { overwrite: true })


    return tmpProjectPath
  }

  /** 从数据源应用中获取数据库信息 */
  public getDataBaseConnectOption = async (config: DataBaseConfig, envType: EnvType): Promise<MySqlCreateOption | null> => {
    if (!config?.filePubId) {
      return null
    }
    let connectOption = null as MySqlCreateOption
    try {
      const pubs = await this.filePubDao.query({ id: config.filePubId })
      const contentObj = JSON.parse(decodeURIComponent(pubs?.[0]?.content));
      switch (true) {
        case ['debug', 'only-debug', 'staging', 'only-perview'].includes(envType):
          connectOption = contentObj?.connectOption?.debug ?? null;
          break;
        case !!contentObj?.connectOption?.[envType]:
          connectOption = contentObj?.connectOption?.[envType];
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

  /** 定时清理调试和预览文件夹 */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async _cleanUnusedDebugFiles() {
    try {
      const shouldCleanEnvs = ['only-debug', 'only-preview'];

      let deleteFolders = [];

      for (let index = 0; index < shouldCleanEnvs.length; index++) {
        const envType = shouldCleanEnvs[index];
        const folders = await this.getWillCleanFilesByEnvType(envType)
        deleteFolders = [...folders, ...deleteFolders]
      }

      await Promise.all(deleteFolders.map(p => fse.remove(p)))
      Logger.info(`[清理服务文件] 清理成功，已清理 ${deleteFolders.length} 文件`)
    } catch (error) {
      Logger.error(`[清理服务文件] 清理失败，${error?.stack?.toString() ?? '未知错误'}`)
    }
  }

  /** 获取一个环境中应该被删除的文件，TODO，使用 LRU */
  private async getWillCleanFilesByEnvType(envType) {
    const envFolder = path.join(env.APP_PROJECT_BASE_PATH, envType);

    const deleteFolders = []

    const folders = await fse.readdir(envFolder);
    for (let index = 0; index < folders.length; index++) {
      const folder = folders[index];
      const metaFile = path.join(envFolder, folder, 'meta.json');
      const projectFolder = path.join(envFolder, folder)

      if (!await fse.pathExists(metaFile)) {
        deleteFolders.push(projectFolder);
      } else {
        const statInfo = await fse.stat(metaFile);
        const isBefore24Hour = (Date.now() - statInfo.atimeMs) >= 24 * 60 * 60 * 1000;
        if (isBefore24Hour) {
          deleteFolders.push(projectFolder);
        }
      }
    }
    return deleteFolders
  }
}