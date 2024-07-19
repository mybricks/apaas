import * as fse from 'fs-extra';
import * as path from 'path'

import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import env from '../../utils/env'


@Injectable()
export default class AnalyseService {
  constructor() {
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async _cleanUnusedFiles() {
    try {
      const files = await fse.readdir(env.FILE_ANALYSIS_ONLINEUSERS_FOLDER);

      const deleteFiles = []

      for (let index = 0; index < files.length; index++) {
        const fileName = files[index];
        const filePath = path.join(env.FILE_ANALYSIS_ONLINEUSERS_FOLDER, fileName);

        if (!await fse.pathExists(filePath)) {
          deleteFiles.push(filePath);
        } else {
          const statInfo = await fse.stat(filePath); 
          const isBefore24Hour = (Date.now() - statInfo.atimeMs) < 7 * 24 * 60 * 60 * 1000;
          if (isBefore24Hour) {
            deleteFiles.push(filePath);
          }
        }
      }
      await Promise.all(deleteFiles.map(p => fse.remove(p)))

      Logger.info(`[清理日志文件] 清理成功，已清理 ${deleteFiles.length} 文件`)
    } catch (error) {
      Logger.error(`[清理日志文件] 清理失败，${error?.stack?.toString() ?? '未知错误'}`)
    }
  }
}
