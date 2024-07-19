import * as fse from 'fs-extra';
import * as path from 'path'

import { Logger } from '@mybricks/rocker-commons';
import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule';

import { DataBaseConfig, MySqlCreateOption, CompileTarget, ServiceJson } from './types'

import env from '../../utils/env';

import FilePubDao from '../../dao/filePub.dao';


@Injectable()
export default class ProjectService {

  private filePubDao = new FilePubDao()

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
          const isBefore24Hour = (Date.now() - statInfo.atimeMs) < 24 * 60 * 60 * 1000;
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

  getDataBaseConnectOption = async (config: DataBaseConfig, target: CompileTarget): Promise<MySqlCreateOption | null> => {
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
}