import { Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';
import env from './../../utils/env'
import * as path from 'path';
import * as dayjs from 'dayjs'

import { ChildLoggerAnalyzer } from './../../utils/child-logger'

@Injectable()
export default class OnlineUserService {

  constructor() {

  }

  async analyseByDay(date?: number) {
    const targetDay = date ? dayjs(date) : dayjs();
    const childLogger = new ChildLoggerAnalyzer(path.join(env.FILE_ANALYSIS_ONLINEUSERS_FOLDER, `${targetDay.format('YYYY-MM-DD')}.log`))
    const userLastActiveMap = new Map<string, number>();
    const fileLastActiveMap = new Map<string, { lastActiveAt: number; userId: string, lastActiveReferer: string }>();
    const userOnlineTimeMap = new Map<string, { accOnlineTime: number; lastTimestamp: number }>();

    // 在线时长累计标准区间，小于这个值才能被累计
    const visitWindow = 10000;

    await childLogger.map(record => {
      // 记录访问过的用户
      userLastActiveMap.set(record.userId, record.timestamp);

      // 记录今天所有被访问过的文件
      fileLastActiveMap.set(record.fileId, { lastActiveAt: record.timestamp, userId: record.userId, lastActiveReferer: record.refer });

      // 计算所有用户的在线时长
      if (userOnlineTimeMap.has(record.userId)) {
        const { accOnlineTime, lastTimestamp } = userOnlineTimeMap.get(record.userId);
        const duration = record.timestamp - lastTimestamp
        if (duration > 0) {
          if (duration < visitWindow) { // 小于窗口时间，计入这一次的间隔时间
            userOnlineTimeMap.set(record.userId, {
              accOnlineTime: accOnlineTime + duration,
              lastTimestamp: record.timestamp
            });
          } else { // 大于窗口时间，重置 lastTimestamp 用于给下一次计数
            userOnlineTimeMap.set(record.userId, {
              accOnlineTime: accOnlineTime,
              lastTimestamp: record.timestamp
            });
          }
        }
      } else {
        userOnlineTimeMap.set(record.userId, {
          accOnlineTime: 0,
          lastTimestamp: record.timestamp
        });
      }
    })

    const activeUsers = Array.from(userLastActiveMap.entries()).map(([userId, lastActiveAt]) => ({
      userId,
      lastActiveAt,
    }));

    const activeFiles = Array.from(fileLastActiveMap.entries()).map(([fileId, item]) => ({
      ...item,
      fileId
    })).sort((a, b) => b.lastActiveAt - a.lastActiveAt).slice(0, 30);

    const topOnlineUsers = Array.from(userOnlineTimeMap.entries()).map(([userId, record]) => ({
      userId,
      accOnlineTime: record.accOnlineTime,
    })).sort((a, b) => b.accOnlineTime - a.accOnlineTime).slice(0, 30);;

    return {
      activeUsers,
      activeFiles,
      topOnlineUsers,
    }
  }

}
