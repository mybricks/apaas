import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
import { exec, spawn } from 'child_process';
import { Observable } from 'rxjs';

@Injectable()
export default class CommandService {

  private readonly whitelist: { command: string; args?: string[] }[] = [
    { command: 'npm', args: ['install', '*'] },
    { command: 'npm', args: ['i', '*'] },
    { command: 'npm', args: ['-v'] },
    { command: 'npm', args: ['ls'] },
    { command: 'ls' },
    { command: 'pm2', args: ['-v'] },
    { command: 'pm2', args: ['ls'] },
    { command: 'pm2', args: ['ls', '*'] },
    { command: 'pm2', args: ['logs'] },
    { command: 'pm2', args: ['logs', '*'] },
  ];

  /** 直接输出，仅输出最后一段 */
  exec = (commandLine: string, { cwd }): Observable<string> => {
    return new Observable((observer) => {
      const [command, ...args] = this.parseCommandLine(commandLine);

      if (!this.isCommandWhitelisted(command, args) || this.containsUnsafeCharacters(commandLine)) {
        observer.error(`${commandLine}\n当前命令不在白名单内，不可执行`);
        observer.complete();
        return;
      }

      exec(commandLine, { cwd }, (error, stdout, stderr) => {
        if (error) {
          observer.next(stderr);
        } else {
          observer.next(stdout);
        }
        observer.complete();
      });
    });
  }

  /** 流式输出 */
  spawn = (commandLine: string, { cwd }): Observable<string> => {
    return new Observable((observer) => {
      const [command, ...args] = this.parseCommandLine(commandLine);

      if (!this.isCommandWhitelisted(command, args) || this.containsUnsafeCharacters(commandLine)) {
        observer.error(`${commandLine}\n当前命令不在白名单内，不可执行`);
        observer.complete();
        return;
      }

      const childProcess = spawn(command, args, { cwd, shell: true });

      childProcess.stdout.on('data', (data) => {
        observer.next(data.toString());
      });

      childProcess.stderr.on('data', (data) => {
        observer.next(data.toString());
      });

      childProcess.on('error', (error) => {
        observer.error(error.message);
      });

      childProcess.on('close', (code) => {
        observer.complete();
      });
    });
  }

  private parseCommandLine(commandLine: string): string[] {
    // 简单的命令行解析器，可以根据需要进行扩展
    return commandLine.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  }

  private isCommandWhitelisted(command: string, args: string[]): boolean {
    for (const entry of this.whitelist) {
      if (entry.command === command) {
        if (!entry.args || this.argsMatch(entry.args, args)) {
          return true;
        }
      }
    }
    return false;
  }

  private argsMatch(whitelistArgs: string[], commandArgs: string[]): boolean {
    if (whitelistArgs.length > commandArgs.length) {
      return false;
    }
    for (let i = 0; i < whitelistArgs.length; i++) {
      if (whitelistArgs[i] !== '*' && whitelistArgs[i] !== commandArgs[i]) {
        return false;
      }
    }
    return true;
  }

  private containsUnsafeCharacters(commandLine: string): boolean {
    // 检查命令行中是否包含不安全的字符
    const unsafePattern = /[;&|]/;
    return unsafePattern.test(commandLine);
  }
}
