import { Body, Controller, Get, Post, Query, Req, Headers, UseInterceptors, UploadedFile, UseFilters } from '@nestjs/common';
import * as fs from 'fs';
import * as fse from 'fs-extra'
import * as path from 'path';
import * as childProcess from 'child_process';
import { FileInterceptor } from '@nestjs/platform-express';
import { Logger } from '@mybricks/rocker-commons'
import * as axios from 'axios';
import { ErrorExceptionFilter } from "./../../filter/exception.filter";
import env from '../../utils/env'
import UserLogDao from '../../dao/UserLogDao';
import { lockUpgrade, unLockUpgrade } from '../../utils/lock';
import ConfigService from '../config/config.service';
import AppService from './apps.service';
import { USER_LOG_TYPE } from '../../constants'
const { getAppThreadName } = require('../../../env.js')
import { installAppFromFolder, installAppDeps } from './../../utils/install-apps'

const BLACK_APP_LIST = ['mybricks-app-login', 'mybricks-app-pcspa-for-bugu', 'mybricks-pc-page', 'mybricks-domain', 'mybricks-common-login', 'mybricks-app-pcspa-for-manatee']

@Controller("/paas/api/apps")
@UseFilters(ErrorExceptionFilter)
export default class AppsController {
  // appDao: AppDao;

  userLogDao: UserLogDao;

  // 控制是否重启
  shouldReload: boolean;
  // 是否正在重启
  isReloading: boolean;
  // 是否升级成功
  isSuccessUpgrade: boolean;

  configService: ConfigService;

  appService: AppService;

  constructor() {
    // this.appDao = new AppDao();
    this.userLogDao = new UserLogDao();
    this.isReloading = false;
    this.isSuccessUpgrade = false;
    this.shouldReload = false;
    this.configService = new ConfigService();
    this.appService = new AppService();
  }

  @Get("/getInstalledList")
  async getInstalledList() {
    const apps = await this.appService.getAllInstalledList({ filterSystemApp: true })
    return {
      code: 1,
      data: apps,
      msg: '成功!'
    };
  }


  @Get("/getLatestAllFromSource")
  async getLatestAllFromSource() {
    const systemConfig = await this.configService.getConfigByScope(['system'])
    if(systemConfig?.system?.config?.isPureIntranet) {
      return {
        code: 1,
        data:[],
        msg: '纯内网部署，暂不支持此功能'
      }
    }
    try {
      let remoteAppList = []
      let mergedList = []
      try {
        const currentInstallList = (await this.appService.getAllInstalledList({ filterSystemApp: true }))?.map(i => {
          return {
            namespace: i.namespace,
            version: i.version,
            extName: i.extName,
            title: i.title,
          }
        })
        
        if(false) {
        } else {
          const temp = (await (axios as any).post(
            "https://my.mybricks.world/central/api/channel/gateway", 
            {
              action: 'app_getAllLatestList',
              payload: JSON.stringify(currentInstallList)
            }
          )).data;
          if(temp.code === 1) {
            remoteAppList = temp.data
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
        }
        // let tempList = localAppList.concat(remoteAppList)
        let tempList = [].concat(remoteAppList)
        // 去重: 本地优先级更高
        let nsMap = {}
        tempList?.forEach(i => {
          if(!nsMap[i.namespace]) {
            mergedList.push(i)
            nsMap[i.namespace] = true
          }
        }) 
      } catch(e) {
        Logger.info(e.message)
        Logger.info(e?.stack?.toString())
      }

      return {
        code: 1,
        data: mergedList.filter(t => !BLACK_APP_LIST.includes(t.namespace))
      }
    } catch (e) {
      return {
        code: -1,
        data: [],
        msg: e.toString()
      }
    }
  }

  @Post("/update")
  async appUpdate(@Body() body, @Req() req) {
    const { namespace, version, isFromCentral, userId } = body;
    const logPrefix = `[安装应用]：${namespace}@${version} `;

    try {
      Logger.info(logPrefix + '开启了冲突检测')
      await lockUpgrade()
    } catch(e) {
      Logger.info(logPrefix + e.message)
      Logger.info(logPrefix + e?.stack?.toString())
      await unLockUpgrade({ force: true })
      Logger.info(`${logPrefix} 解锁成功，可继续升级应用`);
      return {
        code: -1,
        msg: '当前已有升级任务，请稍后重试'
      }
    }

    let remoteApps = [];
    try {
      if(isFromCentral) {
        const temp = (await (axios as any).post(
          "https://my.mybricks.world/central/api/channel/gateway", 
          {
            action: 'app_getAppByNamespace_Version',
            payload: { namespace, version }
          }
        )).data;
        if(temp.code === 1) {
          remoteApps = temp.data
        }
      } else {
        // remoteApps = await this.appDao.queryLatestApp();
      }
    } catch (e) {
      Logger.info(`${logPrefix} 获取远程应用版本失败: ${e?.stack?.toString()}`);
    }

    if (!remoteApps.length) {
      await unLockUpgrade({ force: true })
      Logger.info(`${logPrefix} 解锁成功，可继续升级应用`);
      return { code: 0, message: "升级失败，查询最新应用失败" };
    }
    /** 应用中心是否存在此应用 */
    const remoteApp = remoteApps.find((a) => a.namespace === namespace);

    /** 不存在返回错误 */
    if (!remoteApp) {
      return { code: 0, message: "升级失败，不存在此应用" };
    }
    Logger.info(`${logPrefix} 安装应用的最新版本：${remoteApp.version}`);
    const remoteAppInstallInfo = JSON.parse(remoteApp.installInfo || "{}");
    /** 已安装应用 */
    const installedAppPkgPath = path.join(env.getAppInstallFolder(), namespace, 'package.json');
    let installedApp = fse.existsSync(installedAppPkgPath) ? fse.readJSONSync(installedAppPkgPath, { encoding: 'utf-8' }) : null;
    let installPkgName = "";
    let logInfo = null;
    let needServiceUpdate = !remoteAppInstallInfo?.noServiceUpdate;

    if (!installedApp) {
      needServiceUpdate = true;
      /** 新加应用 */
      installPkgName = remoteApp.namespace;

      logInfo = {
        action: 'install',
        type: 'application',
        installType: remoteApp.installType || 'npm',
        preVersion: '',
        version: remoteApp.version,
        namespace: installPkgName,
        name: remoteApp.name || installPkgName,
        content: '安装新应用：' + (remoteApp.name || installPkgName) + '，版本号：' + version,
      };
    } else {
      installPkgName = remoteApp.namespace;
      let preVersion = installedApp.version;
      if (!needServiceUpdate) {
        const temp = (await (axios as any).post(
          "https://my.mybricks.world/central/api/channel/gateway",
          {
            action: 'app_checkServiceUpdateByNamespaceAndVersion',
            payload: JSON.stringify({ namespace, version: preVersion, nextVersion: remoteApp.version }),
          }
        )).data;
        if(temp.code === 1) {
          needServiceUpdate = temp.data?.needServiceUpdate;
        }
      }

      logInfo = {
        action: 'install',
        type: 'application',
        installType: remoteApp.installType,
        preVersion,
        version,
        namespace: installPkgName,
        name: remoteApp.name || installPkgName,
        content: `更新应用：${remoteApp.name || installPkgName}，版本从 ${preVersion} 到 ${remoteApp.version}`,
      };

      Logger.info(logPrefix + '更新版本', installedApp)
    }

    Logger.info(logPrefix + "开始下载应用");
    const downloadStartTime = Date.now();

    const serverModulePath = path.join(
      env.getAppInstallFolder(),
      `./${installPkgName}/nodejs/index.module.ts`
    );
    if (fs.existsSync(serverModulePath) && needServiceUpdate && logInfo) {
      logInfo.content += ', 服务已更新'
    }

    const tempFolder = path.join(__dirname, '../../../../../_tempapp_')
    try {
      const zipFilePath = path.join(tempFolder, `${namespace}.zip`)

      await fse.ensureDir(tempFolder);
      await fse.emptydir(tempFolder);
      const res = (await (axios as any).post(
        'https://my.mybricks.world/central/api/channel/gateway',
        {
          action: 'app_downloadByVersion',
          payload: JSON.stringify({
            namespace: namespace,
            version: version
          })
        })).data
      if (res.code !== 1) {
        Logger.error(`${logPrefix} 应用 ${namespace} 安装失败，跳过...`)
        Logger.error(`${logPrefix} 错误是 ${res.msg}`)
        await fse.remove(tempFolder)
        await unLockUpgrade({ force: true })
        Logger.info(`${logPrefix} 解锁成功，可继续升级应用`);
        return { code: 0, message: '下载应用失败，请重试' };
      }

      Logger.info(`${logPrefix} 资源包下载成功 ${zipFilePath}}，耗时${Date.now() - downloadStartTime}ms，开始持久化`)

      await fse.writeFile(zipFilePath, Buffer.from(res.data.data));

      Logger.info(`${logPrefix} 开始解压文件`)
      const zipStartTime = Date.now();
      childProcess.execSync(`unzip -o ${zipFilePath} -d ${tempFolder}`, {
        stdio: 'inherit' // 不inherit输出会导致 error: [Circular *1]
      })
      Logger.info(`${logPrefix} 解压文件结束，耗时${Date.now() - zipStartTime}ms`)
      
      const subFolders = fs.readdirSync(tempFolder)
      let unzipFolderSubpath = ''
      Logger.info(`${logPrefix} subFolders: ${JSON.stringify(subFolders)}}`)
      for(let name of subFolders) {
        if(name.indexOf('.') === -1 && name !== '__MACOSX') {
          unzipFolderSubpath = name
          break
        }
      }
      const unzipFolderPath = path.join(tempFolder, unzipFolderSubpath)

      const destAppDir = path.join(env.getAppInstallFolder(), installPkgName)

      Logger.info(`${logPrefix} 开始安装APP`)
      await installAppFromFolder(unzipFolderPath, destAppDir, { namespace: installPkgName || '未知namespace' }, { logPrefix })

      Logger.info(`${logPrefix} 安装node_modules中`)
      await installAppDeps(unzipFolderPath, destAppDir, needServiceUpdate);
      Logger.info(`${logPrefix} 安装node_modules成功`)

      Logger.info(`${logPrefix} 平台更新成功，准备写入操作日志`)
      if (logInfo) {
        await this.userLogDao.insertLog({ type: USER_LOG_TYPE.APPS_INSTALL_LOG, userId, logContent: JSON.stringify({ ...logInfo, status: 'success' }) });
      }
    } catch (e) {
      if (logInfo) {
        await this.userLogDao.insertLog({ type: USER_LOG_TYPE.APPS_INSTALL_LOG, userId, logContent: JSON.stringify({ ...logInfo, status: 'error' }) });
        logInfo = null;
      }
      Logger.info(logPrefix + e.message);
      Logger.info(logPrefix + e?.stack?.toString())

      fse.removeSync(tempFolder)

      await unLockUpgrade({ force: true })
      Logger.info(`${logPrefix} 解锁成功，可继续升级应用`);

      return { code: -1, message: e.message };
    }

    await fse.remove(tempFolder)

    if (fs.existsSync(serverModulePath)) {
      if(!needServiceUpdate) {
        Logger.info(logPrefix + "有service，但是未更新服务端，无需重启");
      } else {
        Logger.info(logPrefix + "有service，即将重启服务");
        await this.restartServer()
      }
    } else {
      Logger.info(logPrefix + "无service，无需重启");
    }

    Logger.info(logPrefix + "解锁成功，可继续升级应用");
    // 解锁
    await unLockUpgrade({ force: true })
    return { code: 1, data: null, message: "安装成功" };
  }

  @Get("/update/status")
  async checkAppUpdateStatus(
    @Query("namespace") namespace: string,
    @Query("version") version: string,
    @Query("action") action: string
  ) {
    // 重启服务
    try {
      const app = await this.appService.getAppFromInstalled({ namespace });
      if (app || (action === 'uninstall' && !app)) {
        return { code: 1, message: '重启成功' };
      }
    } catch (e) {
      Logger.info("安装应用失败");
      Logger.info(e.message);
      Logger.info(e?.stack?.toString())
    }
    return { code: -1, data: null, message: "安装应用失败" };
  }

  @Post("/offlineUpdate")
  @UseInterceptors(FileInterceptor('file'))
  async appOfflineUpdate(@Req() req, @Body() body, @UploadedFile() file) {
    const logPrefix = `[离线安装应用]：${file.originalname} `;

    try {
      Logger.info(`${logPrefix} 开启了冲突检测`)
      await lockUpgrade()
    } catch(e) {
      Logger.info(e)
      Logger.info(e?.stack?.toString())
      return {
        code: -1,
        msg: '当前已有升级任务，请稍后重试'
      }
    }
    const tempFolder = path.join(__dirname, '../../../../../_tempapp_');
    await fse.ensureDir(tempFolder);
    await fse.emptydir(tempFolder);
    try {
      const zipFilePath = path.join(tempFolder, `./${file.originalname}`)
      Logger.info(`${logPrefix} 开始持久化压缩包`)
      fs.writeFileSync(zipFilePath, file.buffer);
      childProcess.execSync(`which unzip`).toString()
      Logger.info(`${logPrefix} 开始解压文件`)
      childProcess.execSync(`unzip -o ${zipFilePath} -d ${tempFolder}`, {
        stdio: 'inherit' // 不inherit输出会导致 error: [Circular *1]
      })
      
      const subFolders = fs.readdirSync(tempFolder)
      let unzipFolderSubpath = ''
      Logger.info(`${logPrefix} subFolders: ${JSON.stringify(subFolders)}}`)
      for(let name of subFolders) {
        if(name.indexOf('.') === -1 && name !== '__MACOSX') {
          unzipFolderSubpath = name
          break
        }
      }
      const unzipFolderPath = path.join(tempFolder, unzipFolderSubpath)
      const pkg = require(path.join(unzipFolderPath, './package.json'))
      Logger.info(`${logPrefix} pkg: ${JSON.stringify(pkg)}`)

      const destAppDir = path.join(env.getAppInstallFolder(), pkg.name)
      
      Logger.info(`${logPrefix} 准备安装APP ${pkg.name}`)
      await installAppFromFolder(unzipFolderPath, destAppDir, { namespace: pkg.name || '未知namespace' }, { logPrefix })

      Logger.info(`${logPrefix} 安装node_modules中`)
      await installAppDeps(unzipFolderPath, destAppDir, true);
      Logger.info(`${logPrefix} 安装node_modules成功`)

      Logger.info(`${logPrefix} 平台更新成功，准备写入操作日志`)
      await this.userLogDao.insertLog({ type: USER_LOG_TYPE.APPS_INSTALL_LOG, userId: req?.query?.userId,
        logContent: JSON.stringify(
          {
            action: 'install',
            type: 'application',
            installType: 'local',
            namespace: pkg.name || '未知namespace',
            name: pkg?.mybricks?.title || '未知title',
            content: `更新应用：${pkg?.mybricks?.title}，离线安装成功，服务已更新`,
          }
        )
      });

      await fse.remove(tempFolder)
    } catch(e) {
      Logger.info(`${logPrefix} 安装应用失败！！ 错误信息是 ${e.message}`)
      Logger.info(`${logPrefix} ${e?.stack?.toString()}`)
      fse.removeSync(tempFolder)

      await unLockUpgrade({ force: true })
      Logger.info(`${logPrefix} 解锁成功，可继续升级应用`);

      return { code: -1, message: e.message };
    }
    
    Logger.info(`${logPrefix} 解锁成功，可继续升级应用`);
    // 解锁
    await unLockUpgrade({ force: true })

    // 重启服务器
    await this.restartServer();

    return { code: 1, message: "安装成功" };
  }

  /**
   * @description 重启服务器
   */
  private async restartServer () {
    // 注意：日志是异步的，关闭太快可能会丢
    if (env.isProd()) {
      Logger.info('开始重启服务')
      setTimeout(() => {
        // 重启服务
        childProcess.exec(
          `npx pm2 reload ${getAppThreadName()}`,
          {
            cwd: path.join(process.cwd()),
          },
          (error, stdout, stderr) => {
            if (error) {
              Logger.info(`[offlineUpdate]: exec error: ${error}`);
              return;
            }
            Logger.info(`[offlineUpdate]: stdout: ${stdout}`);
            Logger.info(`[offlineUpdate]: stderr: ${stderr}`);
          }
        );
      }, 500)
    } else {
      setTimeout(() => {
        process.exit();
      }, 5000)
      console.log(' 安装应用成功，开发环境，请自行重启服务')
    }
  }
}
