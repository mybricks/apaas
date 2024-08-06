import {Body, Controller, Get, Param, Post, Query, Req, 
  Res,
  UploadedFile,
  UseInterceptors,
  UseFilters,
} from '@nestjs/common';
import { getOSInfo, getProcessStartTime, getPlatformFingerPrint, MemoryState } from '../../utils/index';
import { Logger } from '@mybricks/rocker-commons';
// @ts-ignore
import * as axios from "axios";
import { STATUS_CODE, USER_LOG_TYPE } from '../../constants'
import ConfigService from '../config/config.service';
import env from './../../utils/env'
import * as fse from 'fs-extra'
import * as dayjs from 'dayjs'
import { configuration, getNodeVersion, getPM2Version, loadApps } from './../../utils/shared';
import { ErrorExceptionFilter } from './../../filter/exception.filter';

const childProcess = require('child_process');
const path = require('path')

@Controller('/paas/api/system')
@UseFilters(ErrorExceptionFilter)
export default class SystemController {

  configService: ConfigService;

  constructor() {
    this.configService = new ConfigService();
  }

  async _sendReport(content: string) {
    const res = (await (axios as any).post(
      `https://my.mybricks.world/central/api/channel/gateway`, 
      {
      action: "log_report",
      payload: content
    }).data)

    return res
  }

  @Get('/monitor/overview')
  async getMonitorOverview() {
    return {
      code: 1,
      data: {
        startAt: dayjs(getProcessStartTime()).format('YYYY-MM-DD HH:mm:ss'),
        os: getOSInfo(),
        nodeVersion: getNodeVersion(),
        pm2Version: getPM2Version(),
        pm2Name: configuration.platformConfig?.appName,
        isPureIntranet: !!configuration.platformConfig?.isPureIntranet
      }
    }
  }

  @Get('/monitor/pingCenter')
  async monitorPingCenter() {

  }

  @Get('/monitor/apps')
  async getMonitorApps() {
    const apps = loadApps();
    return {
      code: 1,
      data: apps.map(app => {
        return {
          title: app.title,
          namespace: app.namespace,
          version: app.version,
          isSystem: app.isSystem,
          ...MemoryState.appStatus.getStatus(app.namespace)
        }
      })
    }
  }

  @Get('/monitor/diagnostics')
  async getMonitorDiagnostics() {
    let result = []

    try {
      const status = MemoryState.appStatus.getStatus('mybricks-material')
      if (status?.fe?.status && status?.server?.status) {
        result.push({
          title: '物料中心检测',
          type: 'material_check',
          level: 'success',
          error: null,
        })
      } else {
        result.push({
          title: '物料中心检测',
          type: 'material_check',
          level: 'error',
          error: '物料中心已安装但未正常加载，请检查'
        })
      }
    } catch (error) {
      result.push({
        title: '物料中心检测',
        type: 'material_check',
        level: 'error',
        error: '物料中心未安装，请务必先安装物料中心'
      })
    }

    try {
      childProcess.execSync('unzip').toString()
      result.push({
        title: 'unzip命令检查',
        type: 'unzip_check',
        level: 'success',
        error: null,
      })
    } catch (error) {
      result.push({
        title: 'unzip命令检查',
        type: 'unzip_check',
        level: 'warn',
        error: error?.stack?.toString(),
      })
    }

    try {
      const ManacoEditorAssets = path.join(env.FILE_LOCAL_STORAGE_FOLDER, 'editor_assets', 'monaco-editor');
      const isExist = await fse.pathExists(ManacoEditorAssets)
      const MaterialExternalAssets = path.join(env.FILE_LOCAL_STORAGE_FOLDER, 'mybricks_material_externals');
      const isMaterialExternalExist = await fse.pathExists(MaterialExternalAssets)
      if (isExist && isMaterialExternalExist) {
        result.push({
          title: '静态资源依赖检测',
          type: 'assets_check',
          level: 'success',
        })
      } else {
        result.push({
          title: '静态资源依赖检测',
          type: 'assets_check',
          level: 'error',
          error: '部分文件缺失，请联系管理员确认，可通过 npm run prepare:start 补全文件'
        })
      }

      try {
        result = result.concat(MemoryState.appStatus.items.map(item => {
          const isPass = !item?.server ? true : !!item?.server?.status;
          return {
            title: `应用检查：${item.namespace}`,
            type: 'app_check',
            level: isPass ? 'success' : 'error',
            error: isPass ? null : item?.server?.desc 
          }
        }))
      } catch (error) {}
    } catch (error) {
      result.push({
        title: '静态资源依赖检测',
        type: 'assets_check',
        level: 'error',
        error: `发现异常，请与管理员确认 externalFilesStoragePath 是否配置正确，错误详情：${error.message ?? '未知错误'}`
      })
    }

    return {
      code: 1,
      data: result
    }
  }

  @Post('/channel')
  async channel(@Body() body: any) {
    const { type, version, isAdministrator, payload, userId } = body;
    if(configuration?.platformConfig?.isPureIntranet) {
      return {
        code: -1,
        msg: '纯内网部署，暂不支持此功能'
      }
    }
    try {
      switch (type) {
        case 'connect': {
          // 每次进来初始化，上报一次数据
          await this._sendReport(JSON.stringify({
            uuid: getPlatformFingerPrint(),
            namespace: 'platform',
            content: {
              // ...info,
              platformInfo: getOSInfo() 
            }
          }))
          return {
            code: 1,
            msg: 'succeed' 
          }
        }
        case 'report': {
          const res = await this._sendReport(JSON.stringify({
            uuid: getPlatformFingerPrint(),
            namespace: payload.namespace,
            content: payload
          }))
          return res
        }
      }
      return {
        code: -1,
        msg: '未知指令'
      }
    } catch(e) {
      Logger.info(e)
      Logger.info(e?.stack?.toString())
      return {
        code: -1,
        msg: `[${type}]:` + e.message
      }
    }
  }

  @Post('/diagnostics')
  async diagnostics(@Body('action') action, @Body('payload') payload) {
    const domain = 'https://my.mybricks.world';
    try {
      switch(action) {
        case 'init': {
          return {
            code: 1,
            msg: 'success'
          }
        }
        case 'envCheck': {
          let msg = '开始检测\n';
          if(global?.MYBRICKS_PLATFORM_START_ERROR) {
            msg += global.MYBRICKS_PLATFORM_START_ERROR
          } else {
            msg += '\n[启动报错检测]：未发现异常'
          }

          try {
            await childProcess.execSync('unzip').toString()
            msg+= `\n[unzip命令检测]：未发现异常`
          } catch (error) {
            msg+= `\n[unzip命令检测]：执行unzip命令失败 ${error.message}`
          }
          
          const fetchStartTimestamp = Date.now();
          try {
            msg += `\n[中心化服务探测]：开始检测，请求域名是 ${domain}\n`
            const reqUrl = `${domain}/paas/api/system/diagnostics`
            // @ts-ignore
            await axios.post(reqUrl, { action: "init"})
            msg+= `[中心化服务探测]：耗时${Date.now() - fetchStartTimestamp}ms，未发现异常`
          } catch (error) {
            msg+= `[中心化服务探测]：耗时${Date.now() - fetchStartTimestamp}ms，失败 ${error.message ?? '未知错误'}`
          }

          try {
            msg += `\n[必要资源检测]：开始检测`
            const ManacoEditorAssets = path.join(env.FILE_LOCAL_STORAGE_FOLDER, 'editor_assets', 'monaco-editor');
            const isExist = await fse.pathExists(ManacoEditorAssets)
            const MaterialExternalAssets = path.join(env.FILE_LOCAL_STORAGE_FOLDER, 'mybricks_material_externals');
            const isMaterialExternalExist = await fse.pathExists(MaterialExternalAssets)
            if (isExist && isMaterialExternalExist) {
              msg += `\n[必要资源检测]：未发现异常`
            } else {
              msg += `\n[必要资源检测]：文件缺失，请联系管理员确认，可通过 npm run prepare:start 补全文件`
            }
          } catch (error) {
            msg += `\n[必要资源检测]：发现异常，请与管理员确认 externalFilesStoragePath 是否配置正确 \n`
            msg += `\n[必要资源检测]：${error.message ?? '未知错误'}\n`
          }

          try {
            msg += `\n[重启服务检测]：开始检测`
            if (!configuration?.platformConfig?.appName) {
              throw new Error('当前未配置 platformConfig 的 appName，请联系管理员配置')
            }
            msg += `\n[重启服务检测]：当前平台配置 appName 为${configuration.platformConfig.appName}`
            if (process.env.pm_id) {
              const appName = getAppNameById(process.env.pm_id);
              if (appName && appName !== configuration.platformConfig.appName) {
                throw new Error(`当前启动的 appName 与配置的 appName 不相等\n 建议管理员 pm2 delete ${appName}，并使用 npm run reload 重启平台`)
              }
              msg += `\n[重启服务检测]：当前平台PM2 Id 为 ${process.env.pm_id}，name为 ${appName}`
            }
            msg += `\n[重启服务检测]：未发现异常`
          } catch (error) {
            msg += `\n[重启服务检测]：${error.message ?? '未知错误'}`
          }
          
          return {
            code: 1,
            msg
          }
        }
      }
    } catch(e) {
      Logger.info(`诊断服务出错：${e.message}`)
      Logger.info(`诊断服务出错：${e?.stack?.toString()}`)
      return {
        code: -1,
        msg: `诊断服务出错：${e.message ?? '未知错误'}`
      }
    }
  }
}


function getAppNameById(pm_id) {
  try {
    const stdout = childProcess.execSync(`pm2 info ${pm_id}`).toString();
    const nameMatch = stdout.match(/Describing process with id \d+ - name (\S+)/);
    if (!nameMatch?.[1]) {
      const nameMatch2 = stdout.match(/monitor CPU and Memory usage (\S+)/);
      if (!nameMatch2?.[1]) {
        return nameMatch2[1].trim()
      }
    } else {
      return nameMatch[1].trim()
    }
  } catch (error) {

  }
}