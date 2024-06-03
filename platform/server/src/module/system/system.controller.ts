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
          let msg = '';
          if(global?.MYBRICKS_PLATFORM_START_ERROR) {
            msg += global.MYBRICKS_PLATFORM_START_ERROR
          }
          await childProcess.execSync('unzip').toString()
          const reqUrl = `${domain}/paas/api/system/diagnostics`
          Logger.info(`诊断服务请求日志：${reqUrl}`)
          // @ts-ignore
          await axios.post(reqUrl, { action: "init"})
          msg += `\n 接口请求域名是：${domain}`
          
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
        msg: (e.message || '未知错误') + `\n后台服务请求域名是: ${domain}`
      }
    }
  }
}
