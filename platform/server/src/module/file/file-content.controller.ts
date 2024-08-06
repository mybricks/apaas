import { Body, Controller, Get, Post, Query, UseFilters } from '@nestjs/common';
import * as moment from 'dayjs';

import FileContentDao from "../../dao/FileContentDao";

@Controller("/paas/api/fileContent")
export default class FileContentController {
  fileContentDao: FileContentDao;

  constructor() {
    this.fileContentDao = new FileContentDao();
  }

  @Post("/deleteInMutiFile")
  async deleteInMutiFile(@Body() body: { fileId: number; beforeAt?: number, beforeVersion?: string, beforeNVersion?: number }) {
    const { fileId, beforeNVersion } = body
    if (!fileId) {
      return {
        code: -1,
        message: '参数有误，fileId 是必需参数'
      }
    }

    if (!beforeNVersion) {
      return {
        code: -1,
        message: '参数有误，beforeNVersion 是必需参数'
      }
    }

    const remainFileContentIdSet = new Set<number>();
    const deleteFileContentIdSet = new Set<number>();

    try {
      // 获取需要保留的 fileContentId
      const remainVersions = await this.fileContentDao.getContentVersions({ fileId, offset: 0, limit: Number(beforeNVersion), withContent: true });
      for (const version of remainVersions) {
        remainFileContentIdSet.add(version.id)
        try {
          const pages = JSON.parse(version.content).dumpJson?.pages;
          if (Array.isArray(pages)) {
            for (const page of pages) {
              remainFileContentIdSet.add(page.fileContentId)
            }
          }
        } catch (error) { }
      }

      if (remainFileContentIdSet.size === 0) {
        throw new Error('删除异常，不存在需要保留的版本')
      }

      // 获取需要删除的 fileContentId
      const versions = await this.fileContentDao.getContentVersions({ fileId, offset: Number(beforeNVersion), withContent: true });
      for (const version of versions) {
        deleteFileContentIdSet.add(version.id)
        // console.log('版本号', version.id)
        try {
          const pages = JSON.parse(version.content).dumpJson?.pages;
          if (Array.isArray(pages)) {
            for (const page of pages) {
              // console.log('文件', page.fileContentId)
              deleteFileContentIdSet.add(page.fileContentId)
            }
          }
        } catch (error) { }
      }

      if (deleteFileContentIdSet.size === 0) {
        throw new Error('删除失败，不存在需要删除的记录')
      }

      for (const id of deleteFileContentIdSet) {
        if (!remainFileContentIdSet.has(id)) {
          // 处理不在 remainFileContentIdSet 中的 id
          await this.fileContentDao.hardDelete({
            id,
          });
        }
      }
    } catch (error) {
      return {
        code: -1,
        message: error?.message ? error?.message : '未知错误'
      }
    }

    return {
      code: 1,
      remainFileContentIds: Array.from(remainFileContentIdSet),
      message: '删除成功'
    }
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
