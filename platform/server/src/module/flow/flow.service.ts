import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
const fs = require('fs-extra');
import env from './../../utils/env'
const path = require('path');

@Injectable()
export default class FlowService {
  fileLocalFolder = env.FILE_LOCAL_STORAGE_FOLDER

  async saveFile({
    str,
    filename,
    folderPath
  }: {
    str: string | Buffer;
    filename: string;
    folderPath?: string;
  }) {
    if(!fs.existsSync(this.fileLocalFolder)) {
      fs.mkdirSync(this.fileLocalFolder)
    }
    if(folderPath) {
      const splitedArr = folderPath?.split('/')
      let currentPath = ''
      splitedArr?.forEach(subPath => {
        if(subPath) {
          currentPath = currentPath + `/${subPath}`
          const temp = path.join(this.fileLocalFolder, currentPath)
          if(!fs.existsSync(temp)) {
            fs.mkdirSync(temp)
          }
        }
      })
    }

    let visitPath = `${this.fileLocalFolder}/${filename}`
    if(folderPath) {
      visitPath = `${this.fileLocalFolder}/${folderPath}/${filename}`
    }
    fs.writeFileSync(visitPath, str)
    return folderPath ? `${folderPath}/${filename}` : `/${filename}`
  }

  async getFiles({subPath}: {subPath: string}) {
    let wholePath = path.join(this.fileLocalFolder, subPath)
    let fileMap = {}
    if(fs.existsSync(wholePath)) {
      const fileNames = fs.readdirSync(wholePath)
      fileNames?.forEach(fileName => {
        let [fileId, ext] = fileName?.split('.')
        fileMap[fileId] = path.join(wholePath, fileName)
      }) || []
      return fileMap
    } else {
      return fileMap
    }
  }

  async getFileContent(filePath) {
    let wholePath = path.join(this.fileLocalFolder, filePath)
    let fileInfo = null
    if(fs.existsSync(wholePath)) {
      const fileInfo = fs.readFileSync(wholePath)
      return fileInfo
    } else {
      return fileInfo
    }
  }

  async deleteFile({subPath, fullPath}: {subPath?: string, fullPath?: string}) {
    let wholePath;
    if(fullPath) {
      wholePath = fullPath;
    } else if(subPath){
      wholePath = path.join(this.fileLocalFolder, subPath)
    }
    if(fs.existsSync(wholePath)) {
      fs.unlinkSync(wholePath)
    }
    return true
  }
}
