import pino, { destination } from 'pino';
// import { LoggerService } from '@nestjs/common';
import * as fse from 'fs-extra'
import * as rfs from 'rotating-file-stream';
import env from './env'

fse.ensureDirSync(env.LOGS_BASE_FOLDER);

const logStream = rfs.createStream('app.log', {
  interval: '1d', // 按日滚动
  path: env.LOGS_BASE_FOLDER,
  maxFiles: 10, // 最大日志文件数量，旧的文件将被删除
});

export const logger = pino({
  // transport: {
  //   target: 'pino-pretty',
  //   options: {
  //     colorize: false,
  //     ignore: 'pid,hostname', // 忽略不需要的字段
  //   }
  // }
}, logStream);

export const serviceLogger = logger.child({ module: 'service' })


// const logger = pino({ name: 'my-logger' }, pino.destination(env.LOGS_BASE_FOLDER))

// export class ApplicationLogger implements LoggerService {
//   log(message: any, ...optionalParams: any[]) {
      
//   }
//   error(message: any, ...optionalParams: any[]) {
      
//   }
//   warn(message: any, ...optionalParams: any[]) {
      
//   }
// }


// export const ApplicationLogger = logger.child({ module: 'application' })


