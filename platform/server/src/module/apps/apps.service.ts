import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
import * as axios from 'axios';
import env from '../../utils/env'

const fs = require('fs');
const path = require('path');

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

  async getAllInstalledList({ filterSystemApp }: {filterSystemApp: boolean}) {
    const appsFolder = env.getAppInstallFolder()
    if (!fs.existsSync(appsFolder)) {
      return []
    }
    const dirNames = fs.readdirSync(appsFolder);
    const apps = [];
    if (Array.isArray(dirNames)) {
      for (let l = dirNames.length, i = 0; i < l; i++) {
        const appName = dirNames[i];
        let pkgJson: any = {};
        const pkgFilePath = path.join(appsFolder, appName, "./package.json");
        if (fs.existsSync(pkgFilePath)) {
          pkgJson = JSON.parse(fs.readFileSync(pkgFilePath, "utf-8"));
          // 处理安装失败导致的异常数据
          if (Object.keys(pkgJson).length === 0) {
            continue;
          }
          if(appName.indexOf('_temp') !== -1) {
            continue
          }
          // 忽略平台型模块
          if(filterSystemApp && pkgJson?.mybricks?.type === 'system') {
            continue
          }
          const temp: any = {
            version: pkgJson?.version,
            homepage: `/${pkgJson.name}/index.html`, // 约定
            title: pkgJson?.mybricks?.title,
            namespace: pkgJson.name,
            description: pkgJson.description,
            icon: pkgJson?.mybricks?.icon,
            type: pkgJson?.mybricks?.type,
            extName: pkgJson?.mybricks?.extName,
            snapshot: pkgJson?.mybricks?.snapshot,
            exports: [],
          };
          // 应用设置页面
          if (pkgJson?.mybricks?.setting) {
            temp["setting"] = pkgJson?.mybricks?.setting;
          } else if (
            fs.existsSync(
              path.join(appsFolder, appName, "./assets/setting.html")
            )
          ) {
            // 约定的设置字段
            temp["setting"] = `/${pkgJson.name}/setting.html`; // 约定
          }
          // 应用设置页面
          if (pkgJson?.mybricks?.groupSetting) {
            temp["groupSetting"] = pkgJson?.mybricks?.groupSetting;
          } else if (
            fs.existsSync(
              path.join(appsFolder, appName, "./assets/groupSetting.html")
            )
          ) {
            // 约定的设置字段
            temp["groupSetting"] = `/${pkgJson.name}/groupSetting.html`; // 约定
          }
          if(
            fs.existsSync(
              path.join(appsFolder, appName, "./assets/index.html")
            ) || fs.existsSync(path.join(appsFolder, appName, "./pages"))
          ) {
            temp["_hasPage"] = true; // 约定
          }
          // 应用导出能力
          if (pkgJson?.mybricks?.serviceProvider) {
            for (let serviceName in pkgJson?.mybricks?.serviceProvider) {
              const val = pkgJson?.mybricks?.serviceProvider[serviceName];
              temp.exports.push({
                name: serviceName,
                path: `/${pkgJson.name}/${val}`,
              });
            }
          }
          if (pkgJson?.mybricks?.isSystem) {
            temp["isSystem"] = pkgJson?.mybricks?.isSystem;
          }
          apps.push(temp);
        }
      }
    }
    return apps
  }

  async getInstalledApp({ namespace } : { namespace: string }) {
    const allInstallList = await this.getAllInstalledList({ filterSystemApp: false });
    return allInstallList.find(t => t.namespace === namespace)
  }
}
