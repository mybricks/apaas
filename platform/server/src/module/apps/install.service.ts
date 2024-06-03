import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
import env from '../../utils/env'
import * as fse from 'fs-extra'
import * as path from 'path'
import * as childProcess from 'child_process';
@Injectable()
export default class InstallService {
  constructor() {
  }


  installAppDeps = async (appDir: string, forceInstall = false) => {
    if (!await fse.pathExists(appDir)) {
      throw new Error(`App ${appDir} not exist.`)
    }

    Logger.info(`[install node_modules]: 正在检测 ${appDir} 的node_modules，请稍后`)


    let packageJson: any = {};
    let depDir = null;
    let serverPath = null;

    try {
      packageJson = await fse.readJSON(path.join(appDir, 'package.json'));
      depDir = path.join(appDir, 'node_modules');
      serverPath = path.join(appDir, 'nodejs');
    } catch (error) {
      
    }

    // 非强制安装时，判断node_modules有就不安装了
    let shouldInstall = forceInstall ? true : !fse.existsSync(depDir);

    let logStr

    if (shouldInstall && (await fse.pathExists(serverPath)) && packageJson.dependencies) {
      Logger.info(`[install node_modules]: 开始安装 ${packageJson.name} 应用依赖 ${env.NPM_REGISTRY}，请稍后`)
      if(isYarnExist()) {
        logStr = childProcess.execSync(`yarn install --prod --registry=${env.NPM_REGISTRY}`, { cwd: appDir })
      } else {
        logStr = childProcess.execSync(`npm i --registry=${env.NPM_REGISTRY} --production`, { cwd: appDir })
      }

      if (logStr.indexOf('npm ERR') !== -1) {
        throw new Error(logStr)
      }

    } else {
      Logger.info(`[install node_modules]: 检测到 ${packageJson.name} 依赖已安装，跳过依赖安装`)
    }
  }
}


function isYarnExist() {
  let result;
  try{
    childProcess.execSync('which yarn').toString()
    result = true
  } catch(e) {
    result = false
  }
  return result
}