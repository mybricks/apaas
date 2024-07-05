import { NestExpressApplication } from "@nestjs/platform-express";
import { shutdown } from '@mybricks/rocker-dao'
import { UserOnlineLogger } from './utils/child-logger'
import * as dayjs from 'dayjs'

const exitLog = {
  log: (str) => { // 生产环境下，可在 pm2 的 out 文件中看到
    console.log(`[application exit] [${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${str}`)
  },
  error: (str) => { // 生产环境下，可在 pm2 的 error 文件中看到
    console.error(`[application exit] [${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${str}`)
  }
}

/**
 * 进程被退出时需要执行的操作
 */
export const onProcessExit = async ({
  app
} : {
  app: NestExpressApplication
}) => {

  // pm2 stop发出的信号
  process.on('SIGINT', async () => {
    exitLog.log('[application exit] 应用关闭中...')
    try {
      exitLog.log('[application exit] 关闭数据库连接...')
      await shutdown();
      exitLog.log('[application exit] 应用关闭中...')
      await app.close();
      exitLog.log('[application exit] 日志写入中...')
      UserOnlineLogger.flushSync();
      exitLog.log('[application exit] 应用已退出')
      process.exit(0);
    } catch (error) {
      exitLog.error(`[appliacation exit] 退出失败 ${error?.stack?.toString()}`)
      process.exit(1);
    }
  })
}
