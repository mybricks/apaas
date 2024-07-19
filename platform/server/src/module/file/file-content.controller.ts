import { Body, Controller, Get, Post, Query, UseFilters } from '@nestjs/common';
import * as moment from 'dayjs';

import FileContentDao from "../../dao/FileContentDao";

@Controller("/paas/api/fileContent")
export default class FileContentController {
  fileContentDao: FileContentDao;

  constructor() {
    this.fileContentDao = new FileContentDao();
  }

  @Post("/deleteInFile")
  async deleteInFile(@Body() body: { fileId: number; beforeAt?: number, beforeVersion?: string, beforeNVersion?: number }) {
    const { fileId, beforeAt, beforeVersion, beforeNVersion } = body
    if (!fileId) {
      return {
        code: -1,
        message: '参数有误，fileId 是必需参数'
      }
    }

    if (!beforeAt && !beforeVersion && !beforeNVersion) {
      return {
        code: -1,
        message: '参数有误，beforeAt 或 beforeVersion 或 beforeNVersion 是必需参数'
      }
    }

    try {
      if (beforeAt) {
        await this.fileContentDao.deleteInFileBeforeAt({ fileId, timestamp: beforeAt })
        return {
          code: 1,
          message: '删除成功'
        }
      }
  
      if (beforeVersion) {
        const { createTime } = await this.fileContentDao.getContentByVersionAndFileId({ fileId, version: beforeVersion })
        // @ts-ignore
        await this.fileContentDao.deleteInFileBeforeAt({ fileId, timestamp: moment(createTime).valueOf() })
        return {
          code: 1,
          message: '删除成功'
        }
      }

      if (typeof beforeNVersion === 'number') {
        const versions = await this.fileContentDao.getContentVersions({ fileId, limit: beforeNVersion, offset: 0 })
        const last = versions[versions.length - 1];
        // @ts-ignore
        await this.fileContentDao.deleteInFileBeforeAt({ fileId, timestamp: moment(last.createTime).valueOf() });
        return {
          code: 1,
          message: '删除成功'
        }
      }

    } catch (error) {
      return {
        code: -1,
        message: error?.message ? error?.message : '未知错误'
      }
    }
    return {
      code: -1,
      message: '未知错误'
    }
  }
}
