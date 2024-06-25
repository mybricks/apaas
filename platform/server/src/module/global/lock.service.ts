import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';

interface HandlingApp {
  appName?: string,
  appVersion?: string,
  filename?: string
  type: 'install' | 'uninstall',
  actionMessage?: string
  startAt?: number
}

@Injectable()
export default class LockService {

  private hanlingApp: null | HandlingApp = null

  constructor() {}

  query = () => {
    return this.hanlingApp
  }

  lock = (app: HandlingApp) => {
    if (this.hanlingApp) {
      if (this.hanlingApp.appName) {
        throw new Error(`当前应用 ${this.hanlingApp.appName} 正在执行操作 ${this.hanlingApp?.actionMessage}`);
      } else if (this.hanlingApp.filename) {
        throw new Error(`当前正在通过安装包 ${this.hanlingApp.filename} 执行离线安装应用操作`);
      }
    }

    this.hanlingApp = {
      ...app,
      startAt: new Date().getTime()
    }
  }

  unlock = () => {
    this.hanlingApp = null
  }
}
