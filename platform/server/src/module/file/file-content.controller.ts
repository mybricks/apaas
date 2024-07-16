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
  async deleteInFile(@Body() body: { fileId: number; beforeAt?: number, beforeVersion?: string }) {
    const { fileId, beforeAt, beforeVersion } = body
    if (!fileId) {
      return {
        code: -1,
        message: '参数有误，fileId 是必需参数'
      }
    }

    if (!beforeAt && !beforeVersion) {
      return {
        code: -1,
        message: '参数有误，beforeAt 或者 beforeVersion 是必需参数'
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
