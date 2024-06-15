import { Body, Controller, Get, Post, Query, Req, Res, UseInterceptors, UploadedFile, UseFilters } from '@nestjs/common';
import * as fs from 'fs';
import * as fse from 'fs-extra'
import * as path from 'path';
import * as childProcess from 'child_process';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Logger } from '@mybricks/rocker-commons'
import * as axios from 'axios';
import { ErrorExceptionFilter } from "./../../filter/exception.filter";
import env from '../../utils/env'
import UserLogDao from '../../dao/UserLogDao';
import { lockUpgrade, unLockUpgrade } from '../../utils/lock';
import ConfigService from '../config/config.service';
import AppService from './apps.service';
import { USER_LOG_TYPE } from '../../constants'
import { installAppFromFolder } from './../../utils/install-apps'
import { pick } from './../../utils'
const userConfig = require('./../../../../../scripts/shared/read-user-config.js')()

/** 临时解压app，安装依赖的地方 */
const TEMP_FOLDER_PATH = path.join(__dirname, '../../../../../_tempapp_')

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
      data: apps.map(a => pick(a, ['title', 'description', 'version', '_hasPage', 'namespace', 'icon', 'homepage', 'extName', 'exports', 'setting', 'groupSetting'])),
      msg: '成功!'
    };
  }

  @Get("/getLatestInstalledAppFromSource")
  async getLatestInstalledAppFromSource() {
    try {
      const appList = await this.appService.getInstalledAppsFromRemote();
      return {
        code: 1,
        data: appList
      }
    } catch (e) {
      Logger.error(e.message)
      Logger.error(e?.stack?.toString())
      return {
        code: -1,
        data: [],
        msg: e.message
      }
    }
  }

  @Get("/getLatestAllAppFromSource")
  async getLatestAllAppFromSource() {
    try {
      const WHITE_LIST = ['mybricks-app-pcspa', 'mybricks-material', 'mybricks-app-pc-cdm', 'mybricks-app-mpsite', 'mybricks-app-theme'];
      const appList = await this.appService.getAllAppsFromRemote();
      return {
        code: 1,
        data: appList.filter(t => WHITE_LIST.includes(t.namespace))
      }
    } catch (e) {
      Logger.error(e.message)
      Logger.error(e?.stack?.toString())
      return {
        code: -1,
        data: [],
        msg: e.message
      }
    }
  }

  @Post("/update")
  async appUpdate(@Body() body, @Req() req, @Res() res: Response) {
    const { namespace, version, isFromCentral, userId } = body;
    const logPrefix = `[安装应用]：${namespace}@${version} `;

    const response200 = async (content) => {
      await unLockUpgrade({ force: true })
      Logger.info(`${logPrefix} 解锁成功，可继续升级应用`);
      res.status(200).send(content);
    }

    try {
      Logger.info(logPrefix + '开启了冲突检测')
      await lockUpgrade()
    } catch(e) {
      Logger.info(logPrefix + e.message)
      Logger.info(logPrefix + e?.stack?.toString())
      res.status(200).send({
        code: -1,
        msg: '当前已有升级任务，请稍后重试'
      });
      return
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
      await response200({ code: 0, message: "升级失败，查询最新应用失败" })
      return
    }
    /** 应用中心是否存在此应用 */
    const remoteApp = remoteApps.find((a) => a.namespace === namespace);

    /** 不存在返回错误 */
    if (!remoteApp) {
      await response200({ code: 0, message: "升级失败，不存在此应用" })
      return
    }
    Logger.info(`${logPrefix} 安装应用的最新版本：${remoteApp.version}`);
    const remoteAppInstallInfo = JSON.parse(remoteApp.installInfo || "{}");
    /** 已安装应用 */

    const installedApp = await this.appService.getInstalledApp({ namespace });

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

      Logger.info(logPrefix + '更新版本')
    }

    Logger.info(logPrefix + "开始下载应用");
    const downloadStartTime = Date.now();

    if (installedApp?.serverModuleDirectory && needServiceUpdate && logInfo) {
      logInfo.content += ', 服务已更新'
    }

    const destAppDir = installedApp?.directory ? installedApp.directory : path.join(env.getAppInstallFolder(), installPkgName)
    try {
      const zipFilePath = path.join(TEMP_FOLDER_PATH, `${namespace}.zip`)

      await fse.ensureDir(TEMP_FOLDER_PATH);
      await fse.emptydir(TEMP_FOLDER_PATH);
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
        await fse.remove(TEMP_FOLDER_PATH)
        await response200({ code: 0, message: '下载应用失败，请重试' })
        return
      }

      Logger.info(`${logPrefix} 资源包下载成功 ${zipFilePath}}，耗时${Date.now() - downloadStartTime}ms，开始持久化`)

      await fse.writeFile(zipFilePath, Buffer.from(res.data.data));

      Logger.info(`${logPrefix} 开始解压文件`)
      const zipStartTime = Date.now();
      childProcess.execSync(`unzip -o ${zipFilePath} -d ${TEMP_FOLDER_PATH}`, {
        stdio: 'inherit' // 不inherit输出会导致 error: [Circular *1]
      })
      Logger.info(`${logPrefix} 解压文件结束，耗时${Date.now() - zipStartTime}ms`)
      
      const subFolders = fs.readdirSync(TEMP_FOLDER_PATH)
      let unzipFolderSubpath = ''
      Logger.info(`${logPrefix} subFolders: ${JSON.stringify(subFolders)}}`)
      for(let name of subFolders) {
        if(name.indexOf('.') === -1 && name !== '__MACOSX') {
          unzipFolderSubpath = name
          break
        }
      }
      const unzipFolderPath = path.join(TEMP_FOLDER_PATH, unzipFolderSubpath)


      Logger.info(`${logPrefix} 开始安装APP`)
      await installAppFromFolder(unzipFolderPath, destAppDir, { namespace: installPkgName || '未知namespace', needInstallDeps: needServiceUpdate }, { logPrefix })
      Logger.info(`${logPrefix} 安装APP成功`)

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

      fse.removeSync(TEMP_FOLDER_PATH)

      await response200({ code: -1, message: e.message })
      return
    }

    await fse.remove(TEMP_FOLDER_PATH)

    await response200({ code: 1, data: null, message: "安装成功" })

    const serverModulePath = path.join(
      destAppDir,
      `/nodejs/index.module.ts`
    );
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
  }

  @Post("/uninstall")
  async uninstallApp(@Body() body, @Req() req, @Res() res: Response) {
    const { namespace, userId, name } = body;
    const logPrefix = `[卸载应用 ${namespace}]：`;

    const response200 = async (content) => {
      await unLockUpgrade({ force: true })
      Logger.info(`${logPrefix} 解锁成功，可继续操作应用`);
      res.status(200).send(content);
    }

    try {
      Logger.info(logPrefix + '开启了冲突检测')
      await lockUpgrade()
    } catch(e) {
      Logger.info(logPrefix + e.message)
      Logger.info(logPrefix + e?.stack?.toString())
      res.status(200).send({
        code: -1,
        msg: '当前已有系统任务，请稍后重试'
      });
      return
    }

    const uninstallApp = await this.appService.getInstalledApp({ namespace })

    /** 不存在返回错误 */
    if (!uninstallApp) {
      await response200({ code: 0, message: "卸载失败，不存在此应用" })
      return;
    }

    Logger.info(`${logPrefix} 版本号：${uninstallApp.version}`);
    const logInfo = {
      action: 'uninstall',
      type: 'application',
      preVersion: uninstallApp.version,
      version: uninstallApp.version,
      namespace,
      name: name || namespace,
      content: `卸载应用：${name || namespace}，版本号：${uninstallApp.version}`,
    };

    try {
      await fse.remove(uninstallApp.directory);
      await this.userLogDao.insertLog({ type: USER_LOG_TYPE.APPS_UNINSTALL_LOG, userId, logContent: JSON.stringify({ ...logInfo, status: 'success' }) });
    } catch (e) {
      await this.userLogDao.insertLog({ type: USER_LOG_TYPE.APPS_UNINSTALL_LOG, userId, logContent: JSON.stringify({ ...logInfo, status: 'error' }) });

      Logger.info(logPrefix + e.message);
      Logger.info(logPrefix + e?.stack?.toString())

      await response200({ code: -1, message: e.message })
      return
    }

    Logger.info(logPrefix + "卸载应用成功，即将重启服务");
    await response200({ code: 1, data: null, message: '卸载成功' })

    // 重启服务器
    await this.restartServer();
  }

  @Get("/update/status")
  async checkAppUpdateStatus(
    @Query("namespace") namespace: string,
    @Query("version") version: string,
    @Query("action") action: string
  ) {
    // 重启服务
    try {
      const app = await this.appService.getInstalledApp({ namespace });
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
  async appOfflineUpdate(@Req() req, @Body() body, @Res() res: Response, @UploadedFile() file) {
    const logPrefix = `[离线安装应用]：${file.originalname} `;

    const response200 = async (content) => {
      await unLockUpgrade({ force: true })
      Logger.info(`${logPrefix} 解锁成功，可继续升级应用`);
      res.status(200).send(content);
    }

    try {
      Logger.info(logPrefix + '开启了冲突检测')
      await lockUpgrade()
    } catch(e) {
      Logger.info(logPrefix + e.message)
      Logger.info(logPrefix + e?.stack?.toString())
      res.status(200).send({
        code: -1,
        msg: '当前已有升级任务，请稍后重试'
      });
      return
    }

    await fse.ensureDir(TEMP_FOLDER_PATH);
    await fse.emptydir(TEMP_FOLDER_PATH);
    try {
      const zipFilePath = path.join(TEMP_FOLDER_PATH, `./${file.originalname}`)
      Logger.info(`${logPrefix} 开始持久化压缩包`)
      fs.writeFileSync(zipFilePath, file.buffer);
      childProcess.execSync(`which unzip`).toString()
      Logger.info(`${logPrefix} 开始解压文件`)
      childProcess.execSync(`unzip -o ${zipFilePath} -d ${TEMP_FOLDER_PATH}`, {
        stdio: 'inherit' // 不inherit输出会导致 error: [Circular *1]
      })
      
      const subFolders = fs.readdirSync(TEMP_FOLDER_PATH)
      let unzipFolderSubpath = ''
      Logger.info(`${logPrefix} subFolders: ${JSON.stringify(subFolders)}}`)
      for(let name of subFolders) {
        if(name.indexOf('.') === -1 && name !== '__MACOSX') {
          unzipFolderSubpath = name
          break
        }
      }
      const unzipFolderPath = path.join(TEMP_FOLDER_PATH, unzipFolderSubpath)
      const pkg = require(path.join(unzipFolderPath, './package.json'))
      Logger.info(`${logPrefix} pkg: ${JSON.stringify(pkg)}`)

      const installedApp = await this.appService.getInstalledApp({ namespace: pkg.name });
      const destAppDir = installedApp?.directory ? installedApp.directory : path.join(env.getAppInstallFolder(), pkg.name)
      
      Logger.info(`${logPrefix} 准备安装APP ${pkg.name}`)
      await installAppFromFolder(unzipFolderPath, destAppDir, { namespace: pkg.name || '未知namespace', needInstallDeps: true }, { logPrefix })
      Logger.info(`${logPrefix} 安装APP成功`)

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

      await fse.remove(TEMP_FOLDER_PATH)
    } catch(e) {
      Logger.info(`${logPrefix} 安装应用失败！！ 错误信息是 ${e.message}`)
      Logger.info(`${logPrefix} ${e?.stack?.toString()}`)
      fse.removeSync(TEMP_FOLDER_PATH)

      await response200({ code: -1, message: e.message })
      return
    }
    
    await response200({ code: 1, message: "安装成功" })

    // 重启服务器
    await this.restartServer();
  }

  /**
   * @description 重启服务器
   */
  private async restartServer () {
    if (env.isProd()) {
      Logger.info('开始重启服务')
      setTimeout(() => {
        // 重启服务
        childProcess.exec(
          `npx pm2 reload ${userConfig?.platformConfig?.appName}`,
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
      }, 800)
      console.log('安装 / 卸载应用成功，开发环境，请自行重启服务')
    }
  }
}