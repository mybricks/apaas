import * as path from 'path';
import * as fse from 'fs-extra'
import * as dayjs from 'dayjs';
import env from './env';

interface LoggerOptions {
  logDir?: string;
  cacheSize?: number;
  flushInterval?: number;
}

export class ChildLogger {
  private logDir: string;
  private cacheSize: number;
  private cache: Buffer;
  private flushInterval: number;

  private expireDay: number = 7;

  constructor(options: LoggerOptions = {}) {
    this.logDir = options.logDir;
    this.cacheSize = options.cacheSize || 10 * 1024; // 10KB
    this.cache = Buffer.alloc(0);
    this.flushInterval = options.flushInterval || 10000; // 5 seconds

    fse.ensureDirSync(this.logDir);
    this.startFlushInterval();
  }

  private async getExpiredLogFiles() {
    if (!this.expireDay || !await fse.pathExists(this.logDir)) {
      return []
    }

    const logFiles = await fse.readdir(this.logDir);
    const expiredFiles = [];
    for (let index = 0; index < logFiles.length; index++) {
      const logFile = logFiles[index];
      const logFileName = logFile.replace(path.extname(logFile), '');

      if (dayjs(logFileName).isBefore(dayjs().subtract(this.expireDay, 'day'))) {
        expiredFiles.push(path.resolve(this.logDir, logFile));
      }
    }

    return expiredFiles
  }

  private getLogFileName(time) {
    return path.join(this.logDir, `${dayjs(parseInt(time)).format('YYYY-MM-DD')}.log`);
  }

  private log(level, values: { [keyname: string]: string }) {
    const logEntry = {
      ...values,
      timestamp: Date.now(),
      level,
    };
    const logString = JSON.stringify(logEntry) + '\n';
    const logBuffer = Buffer.from(logString);

    this.cache = Buffer.concat([this.cache, logBuffer]);

    if (this.cache.length >= this.cacheSize) {
      this.flush();
    }
  }

  info(values) {
    this.log('INFO', values);
  }
  
  private async flush() {
    if (this.cache.length === 0) return;

    const logsByDate = this.groupLogsByDate();
    this.cache = Buffer.alloc(0);

    for (const [timestamp, logs] of Object.entries(logsByDate)) {
      const logFile = this.getLogFileName(timestamp);
      const data = logs.join('');
      try {
        await fse.appendFile(logFile, data);
      } catch (error) {
        console.error('Failed to write log file:', error);
      }
    }
  }

  public flushSync() {
    if (this.cache.length === 0) return;

    const logsByDate = this.groupLogsByDate();
    this.cache = Buffer.alloc(0);

    for (const [timestamp, logs] of Object.entries(logsByDate)) {
      const logFile = this.getLogFileName(timestamp);
      const data = logs.join('');
      try {
        fse.appendFileSync(logFile, data);
      } catch (error) {
        console.error('Failed to write log file:', error);
      }
    }
  }

  private groupLogsByDate(): { [timestamp: string]: string[] } {
    const logs = this.cache.toString().split('\n').filter(Boolean);
    return logs.reduce((acc, log) => {
      const logEntry = JSON.parse(log);
      const timestamp = logEntry.timestamp;
      if (!acc[timestamp]) {
        acc[timestamp] = [];
      }
      acc[timestamp].push(log + '\n');
      return acc;
    }, {});
  }

  private startFlushInterval() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  public async clearExpiredFiles () {
    const files = await this.getExpiredLogFiles();
    await Promise.all(files.map(filePath => fse.remove(filePath)))
  }
}

export class ChildLoggerAnalyzer {
  private filePath: string

  constructor(filePath) {
    this.filePath = filePath;
  }

  async readLines({ fromEnd = false, onLine, onComplete }) {
    const fileStats = await fse.stat(this.filePath);
    const fileSize = fileStats.size;
    const bufferSize = 1024 * 1024; // 1MB buffer size
    const buffer = Buffer.alloc(bufferSize);
    let fileDescriptor;
    let position = fromEnd ? fileSize : 0;
    let remaining = '';

    try {
      fileDescriptor = await fse.open(this.filePath, 'r');

      while (true) {
        const bytesRead = fromEnd
          ? await this._readFromEnd(fileDescriptor, buffer, position, bufferSize)
          : await this._readFromStart(fileDescriptor, buffer, position, bufferSize);

        if (bytesRead <= 0) break;

        const chunk = buffer.slice(0, bytesRead).toString('utf8');
        const lines = (remaining + chunk).split('\n');
        remaining = lines.pop(); // Save the last incomplete line

        if (fromEnd) lines.reverse();

        for (const line of lines) {
          const shouldContinue = await onLine(line);
          if (shouldContinue === false) {
            if (onComplete) onComplete();
            return;
          }
        }

        position = fromEnd ? position - bytesRead : position + bytesRead;
      }

      if (remaining) {
        await onLine(remaining);
      }

      if (onComplete) onComplete();
    } finally {
      if (fileDescriptor !== undefined) {
        await fse.close(fileDescriptor);
      }
    }
  }

  async _readFromStart(fd, buffer, position, bufferSize) {
    const { bytesRead } = await fse.read(fd, buffer, 0, bufferSize, position);
    return bytesRead;
  }

  async _readFromEnd(fd, buffer, position, bufferSize) {
    const readPosition = Math.max(0, position - bufferSize);
    const bytesToRead = Math.min(bufferSize, position);
    const { bytesRead } = await fse.read(fd, buffer, 0, bytesToRead, readPosition);
    return bytesRead;
  }

  async map(callback) {
    const results = [];
    await this.readLines({
      fromEnd: false,
      onLine: async (line) => {
        const logEntry = JSON.parse(line);
        const result = await callback(logEntry);
        results.push(result);
        return true; // Continue reading
      },
      onComplete: () => {
        return results;
      }
    });
    return results;
  }

  async mapFromEnd(callback) {
    const results = [];
    await this.readLines({
      fromEnd: true,
      onLine: async (line) => {
        const logEntry = JSON.parse(line);
        const result = await callback(logEntry);
        results.push(result);
        return true; // Continue reading
      },
      onComplete: () => {
        return results;
      }
    });
    return results;
  }

  async some(predicate) {
    let found = false;
    await this.readLines({
      fromEnd: false,
      onLine: async (line) => {
        const logEntry = JSON.parse(line);
        if (await predicate(logEntry)) {
          found = true;
          return false; // Stop reading if predicate is satisfied
        }
        return true; // Continue reading
      },
      onComplete: () => {
        return found;
      }
    });
    return found;
  }
}

export const UserOnlineLogger = new ChildLogger({
  logDir: path.join(env.FILE_ANALYSIS_ONLINEUSERS_FOLDER)
})