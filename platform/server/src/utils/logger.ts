import { init } from '@mybricks/rocker-commons';
import { MidLog } from 'mybricks-midlog';
import { maxAboutWord, maxLogRowContent } from '../constants';

import env from './env';

const fs = require('fs');
const readline = require('readline');

export function initLogger() {
  MidLog.config({
    env: process.env.NODE_ENV || 'production',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    vtrace: () => {},
    appender: [
      {
        type: 'TRACE',
        rollingFile: true,
        logdir: env.LOGS_BASE_FOLDER,
        name: 'info.log',
      },
      {
        type: 'DEBUG',
        rollingFile: true,
        logdir: env.LOGS_BASE_FOLDER,
        name: 'info.log',
      },
      {
        type: 'INFO',
        rollingFile: true,
        logdir: env.LOGS_BASE_FOLDER,
        name: 'info.log',
      },
      {
        type: 'WARN',
        rollingFile: true,
        logdir: env.LOGS_BASE_FOLDER,
        name: 'info.log',
      },
      {
        type: 'ERROR',
        rollingFile: true,
        logdir: env.LOGS_BASE_FOLDER,
        name: 'info.log',
      },
      {
        type: 'FATAL',
        rollingFile: true,
        logdir: env.LOGS_BASE_FOLDER,
        name: 'info.log',
      },
    ],
  });

  init({
    // @ts-ignore
    Logger: () => {
      return new MidLog();
    },
  });
}

export function readLastNLines(filePath, {searchValue, numLines}: { searchValue?: string, numLines: number }) {
  return new Promise((resolve, reject) => {
    const lines = [];
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream });

    rl.on('line', (line) => {
      // 这一行字符长度大于10000时，再去判断，内容大于24kb
      if(line.length > maxAboutWord && getStringBytes(line) > maxLogRowContent) {
        return
      }
      if(searchValue) {
        if(line.indexOf(searchValue) > -1) {
          lines.push(line);
        }
      } else {
        lines.push(line);
      }
      if (lines.length > numLines) {
        lines.shift();
        rl.close()
        fileStream.close()
        rl.removeAllListeners()
      }
    });

    rl.on('error', (err) => {
      reject(err);
    });

    rl.on('close', () => {
      resolve(lines);
    });

    fileStream.on('error', (err) => {
      reject(err);
    });
  });
}

/** 将文件从尾到头分块读取 */
export function readLastNLinesOfFile(filePath, { searchValue, numLines }: { searchValue?: string, numLines: number }) {
  /** 分配 buffer 大小，分配的内存量，以字节为单位 */
  const bufferSize = 100 * 1024;
  const buffer = Buffer.alloc(bufferSize);
  /** 返回一个文件描述符，用于后续对文件的读取、写入等操作 */
  const fileDescriptor = fs.openSync(filePath, 'r');

  const lineStack = [];
  let position = fs.statSync(filePath).size;
  let shouldTraverse = true;
  while (position > 0 && shouldTraverse) {
    /** 将从尾到头的文件内容分配给指定大小的 buffer */
    const bytesRead = fs.readSync(fileDescriptor, buffer, 0, bufferSize, position - bufferSize);
    /** 转为字符串，切分换行符 */
    const lines = buffer.toString('utf-8', 0, bytesRead).split('\n');

    /** 处理每个块中的行（从尾部到头部） */
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (!line) {
        continue;
      }

      if(searchValue) {
        if(line.indexOf(searchValue) > -1) {
          lineStack.push(line);
        }
      } else {
        lineStack.push(line);
      }

      if (lineStack.length >= numLines) {
        /** 当正好处于最后一行时，读取下一块内容，防止按块拆分，出现日志被切断的情况 */
        if (i === 0) {
          /** 将从尾到头的文件内容分配给指定大小的 buffer */
          const nextBytesRead = fs.readSync(fileDescriptor, buffer, 0, bufferSize, position - bytesRead - bufferSize);
          /** 转为字符串，切分换行符 */
          const nextLines = buffer.toString('utf-8', 0, nextBytesRead).split('\n');
          /** 只取下一块的最后一行，无脑补这一行 */
          lineStack.push(nextLines[nextLines.length - 1]);
        }
        shouldTraverse = false;
        break;
      }
    }

    position -= bytesRead;
  }

  fs.closeSync(fileDescriptor);

  return lineStack;
}


/** 返回字节数 */
export function getStringBytes(str: string, encoding: BufferEncoding = 'utf-8'): number {
  return Buffer.byteLength(str, encoding)
}

