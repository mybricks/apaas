import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
import * as axios from 'axios';
import { loadApps } from './../../utils/shared'

interface T_InstalledApp {
  version: string,
  homepage: string,
  title: string,
  namespace: string,
  icon: string,
  type: string,
  extName: string
  serverModuleDirectory?: string
  /** 根目录 */
  directory: string
}

@Injectable()
export default class AppService {
  constructor() {
  }

  private async getRemoteApps () {
    let remoteAppList = []
    const temp = (await (axios as any).post(
      "https://my.mybricks.world/central/api/channel/gateway", 
      {
        action: 'app_getAllLatestList',
        payload: JSON.stringify([])
      }
    )).data;
    if(temp.code === 1) {
      remoteAppList = temp.data
    } else {
      throw new Error(JSON.stringify(temp))
    }
    // 远端app地址增加标记位
    remoteAppList?.forEach(i => {
      i.isFromCentral = true
      // 回滚版本也加上标记位
      if(i.previousList) {
        i.previousList?.forEach(j => {
          j.isFromCentral = true
        })
      }
    })
    return remoteAppList
  }

  /** 获取已安装应用的版本 */
  async getInstalledAppsFromRemote() {
    const installList = await this.getAllInstalledList({ filterSystemApp: true });
    const installNamespaces = installList.map(a => a.namespace)
    const remoteList = await this.getRemoteApps();
    return remoteList.filter(a => installNamespaces.includes(a.namespace));
  }

  /** 获取所有应用的版本 */
  async getAllAppsFromRemote() {
    return await this.getRemoteApps()
  }

  async getAllInstalledList({ filterSystemApp }: {filterSystemApp: boolean}): Promise<T_InstalledApp[]> {
    const apps = loadApps()
      .concat({ // 由于物料中心迁移到平台，但是SDK中依然使用了installApp，所以这里不得不hack地添加一个
        title: '物料中心',
        description: 'mybricks 物料中心',
        namespace: 'mybricks-material',
        appName: 'mybricks-material',
        type: 'material',
        version: '0.2.46',
        exports: [
          {
            "name": "materialSelectorPage",
            "path": "/material-selector.html"
          }
        ],
      });
    return filterSystemApp ? apps.filter(t => t.type !== 'system') : apps;
  }

  async getInstalledApp({ namespace } : { namespace: string }) {
    const allInstallList = await this.getAllInstalledList({ filterSystemApp: false });
    return allInstallList.find(t => t.namespace === namespace)
  }
}
