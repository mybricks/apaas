import {Body, Controller, Get, Param, Post, Query, Req, 
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { getOSInfo, getPlatformFingerPrint, uuid } from '../../utils/index';
import { Logger } from '@mybricks/rocker-commons';
// @ts-ignore
import * as axios from "axios";
import { STATUS_CODE, USER_LOG_TYPE } from '../../constants'
import ConfigService from '../config/config.service';
import env from './../../utils/env'
import * as fse from 'fs-extra'

const childProcess = require('child_process');
const path = require('path')
const fs = require('fs')

@Controller('/paas/api')
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

  @Post('/system/channel')
  async channel(@Body() body: any) {
    const { type, version, isAdministrator, payload, userId } = body;
    const systemConfig = await this.configService.getConfigByScope(['system'])
    if(systemConfig?.system?.config?.isPureIntranet) {
      return {
        code: -1,
        msg: '纯内网部署，暂不支持此功能'
      }
    }
    try {
      switch (type) {
        case 'reloadPlatform': {
          try {
            childProcess.exec(`npx pm2 reload all`)
            return {
              code: 1,
            };
          } catch(e) {
            return {
              code: -1,
              msg: e.message || '升级失败'
            }
          }
        }
        case 'getLatestNoticeList': {
          const res = (await (axios as any).post(
            `https://my.mybricks.world/central/api/channel/gateway`, 
            {
            action: "notice_latestList",
            payload: JSON.stringify({ isAdministrator })
          })).data
          return res
        }
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


  @Post('/system/reloadAll')
  async reloadAll() {
    childProcess.exec(`npx pm2 reload all`)
    return {
      code: 1,
    };
  }

  @Post('/system/diagnostics')
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
