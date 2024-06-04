import { Injectable } from '@nestjs/common';
import UserLogDao from '../../dao/UserLogDao';
import { Logger } from '@mybricks/rocker-commons';
import { USER_LOG_TYPE } from '../../constants';

import env from './../../utils/env';

const fs = require('fs');
const path = require('path');
const child_process = require('child_process')


@Injectable()
export default class LogService {

  userLogDao: UserLogDao;

  constructor() {
    this.userLogDao = new UserLogDao()
  }


  async savePageOperateLog(param: { content: string, userId: string, relationToken: number }) {
    const res = this.userLogDao.insertLog({ 
      type: USER_LOG_TYPE.PAGE_CHANGE_LOG as number,
      logContent: param.content,
      userId: param.userId || '0',
      relationToken: param.relationToken
     })
     return res
  }

  async getPageSaveOperateListsByFileIds(param: { fileIds: number[] }) {
    const list = await this.userLogDao.queryPageSaveOperateList({ fileIds: param.fileIds, type: USER_LOG_TYPE.PAGE_CHANGE_LOG })
    return {
      list
    }
  }
  
  async getOperateLog(param: { limit: number, offset: number }) {
    const [total, list] = await Promise.all([
      this.userLogDao.queryTotalOfAll({ type: [USER_LOG_TYPE.APPS_INSTALL_LOG, USER_LOG_TYPE.PLATOFRM_INSTALL_LOG, USER_LOG_TYPE.APPS_UNINSTALL_LOG] }),
      this.userLogDao.queryDetailOfAll({...param, type: [USER_LOG_TYPE.APPS_INSTALL_LOG, USER_LOG_TYPE.PLATOFRM_INSTALL_LOG, USER_LOG_TYPE.APPS_UNINSTALL_LOG]})
    ]);
    return {
      total,
      list
    }
  }

  async _processFileLineByLine({ sourceFilePath }) {
    return new Promise((resolve, reject) => {
      const sourceFilePathReadStream = fs.createReadStream(sourceFilePath, 'utf8');
      const result = []
  
        let remaining = '';
        sourceFilePathReadStream.on('data', (chunk) => {
          let lines = (remaining + chunk).split('\n');
          remaining = lines.pop();
          lines.forEach(processLine);
        });
  
        sourceFilePathReadStream.on('end', () => {
          if (remaining) {
            processLine(remaining);
          }
          resolve(result)
        });
  
        function processLine(line) {
          if(line.indexOf('[requestPerformance]') !== -1) {
            const [a,b,c,timestamp,e,apiPath,cost] = line.match(/(?<=\[)([^\]]*)(?=\])/g)
            if(timestamp && cost && cost) {
              result.push({
                url: apiPath,
                cost: Number(cost),
                timestamp: timestamp
              })
            }
          }
        }
    })
  }

  async offlineAnalyzeInterfacePerformance() {
    const pendingFileList = []
    if(!fs.existsSync(env.LOGS_BASE_FOLDER)) {
      Logger.info('日志不存在')
      return
    }
    if(!fs.existsSync(env.FILE_ANALYSIS_PERFORMANCE_FOLDER)) {
      child_process.execSync(`cd ${env.FILE_LOCAL_STORAGE_FOLDER} && mkdir -p ${env.FILE_ANALYSIS_PERFORMANCE_FOLDER}`)
    }
    const alreadyList = fs.readdirSync(env.FILE_ANALYSIS_PERFORMANCE_FOLDER)
    const sourceList = fs.readdirSync(path.join(env.LOGS_BASE_FOLDER, './application'))
    
    sourceList?.forEach((item) => {
      const [a, b] = item.split('-')
      if(b) {
        const [date] = b.split('.')
        pendingFileList.push(date)
      }
    })
    for (let date of pendingFileList) {
      if(!alreadyList.includes(date)) {
        const sourceFilePath = path.join(env.LOGS_BASE_FOLDER, `./application/application-${date}.log`)
        const result = await this._processFileLineByLine({ sourceFilePath })
        fs.writeFileSync(path.join(env.FILE_ANALYSIS_PERFORMANCE_FOLDER, `./${date}.json`), JSON.stringify(result, null, 2))
      }
    }
  }

}
