import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Query,
  Param,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import LogService from './log.service';
import { Logger } from '@mybricks/rocker-commons';

import env from './../../utils/env'

const cp = require('child_process')
const fs = require('fs')
const path = require('path')
import { readLastNLinesOfFile } from '../../utils/logger';


@Controller('/paas/api/log')
export default class LogsController {
  logService: LogService;

  constructor() {
    this.logService = new LogService()
  }

  @Post('/runtimeLog/search')
  async search(@Body('searchValue') searchValue: string, @Body('line') line: number) {
    try {
      const LINES = line || 100
      const fileName = path.join(env.LOGS_BASE_FOLDER, './application/application.log')
      let logStr;

      // if (searchValue) {
      //   logStr = cp.execSync(`tail -n ${LINES} ${fileName} | grep '${searchValue}' | awk '{ if (length($0) > 2000) print substr($0, 1, 2000) "..."; else print }'`, { maxBuffer: 3 * 1024 * 1024 }).toString()
      // } else {
      //   logStr = cp.execSync(`tail -n ${LINES} ${fileName} | awk '{ if (length($0) > 2000) print substr($0, 1, 2000) "..."; else print }'`, { maxBuffer: 3 * 1024 * 1024 }).toString()
      // }
      const logStack: any = await readLastNLinesOfFile(fileName, { searchValue, numLines: LINES })
      logStr = logStack.join('\n')

      return {
        code: 1,
        data: {
          content: logStr
        }
      }
    } catch (e) {
      Logger.warn('获取运行日志失败')
      return {
        code: -1,
        msg: e.message || '更新失败'
      }
    }
  }


  @Post('/operateLog/search')
  async getOperateLog(
    @Body('pageNum') pageNum: number,
    @Body('pageSize') pageSize: number
  ) {
    const curPageNum = pageNum ? Number(pageNum) : 1;
    const curPageSize = pageSize ? Number(pageSize) : 20;
    const result = await this.logService.getOperateLog({ limit: curPageSize, offset: curPageSize * (curPageNum - 1) })
    return {
      code: 1,
      data: {
        pageNum: curPageNum,
        pageSize: curPageSize,
        ...result
      }
    }
  }

  @Post('/runtimeLog/monitor/interfacePerformanceList')
  interfacePerformanceList() {
    try {
      if (fs.existsSync(env.FILE_ANALYSIS_PERFORMANCE_FOLDER) === false) {
        return {
          code: -1,
          msg: '数据生产中（T+1生效）'
        }
      }
      const list = fs.readdirSync(env.FILE_ANALYSIS_PERFORMANCE_FOLDER)
      const data = [];
      list.forEach((item) => {
        if (item?.indexOf('.json') !== -1) {
          data.push(item.replace('.json', ''))
        }
      })

      return {
        code: 1,
        data: data
      }
    } catch (e) {
      Logger.warn('获取运行日志失败')
      return {
        code: -1,
        msg: e.message || '更新失败'
      }
    }
  }

  @Post('/runtimeLog/monitor/interfacePerformanceDetail')
  interfacePerformanceDetail(@Body('date') date: string) {
    try {
      const filePath = path.join(env.FILE_ANALYSIS_PERFORMANCE_FOLDER, `./${date}.json`)
      const fileData = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(fileData);
      let averageCost = 0;
      const map = {}
      for (let api of data) {
        if (!map[api.url]) {
          map[api.url] = api.cost
        } else {
          map[api.url] = (map[api.url] + api.cost) * 0.5
        }
        averageCost += api.cost
      }
      if (data.length > 0) {
        averageCost = averageCost / data.length
      }
      return {
        code: 1,
        data: {
          result: {
            averageCost
          },
          detail: map
        }
      }
    } catch (e) {
      Logger.warn('获取运行日志失败')
      return {
        code: -1,
        msg: e.message || '更新失败'
      }
    }
  }

  @Post('/runtimeLog/monitor/immediateAnalyze')
  async immediateAnalyze() {
    try {
      Logger.info(`[analyzeLogTask]: 开始分析日志`)
      await this.logService.offlineAnalyzeInterfacePerformance()
      Logger.info(`[analyzeLogTask]: 日志分析完毕`)
      return {
        code: 1,
        msg: '分析成功'
      }
    } catch (e) {
      Logger.info(`[analyzeLogTask]: 日志分析失败: ${e.message}`)
      return {
        code: -1,
        msg: e.message || '分析失败'
      }
    }
  }
}