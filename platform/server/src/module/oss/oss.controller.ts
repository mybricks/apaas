import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Query,
  Param,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { getRealDomain } from '../../utils/index';
import FlowService from './../flow/flow.service';
import OssService from './oss.service';
import { uuid } from '../../utils/index';
import * as path from 'path';
import env from './../../utils/env'

@Controller('/paas/api/oss')
export default class OssController {
  flowService: FlowService;
  ossService: OssService;

  constructor() {
    this.ossService = new OssService();
    this.flowService = new FlowService();
  }

  @Post('/uploadFile')
  @UseInterceptors(FileInterceptor('file'))
  async saveFile(@Body() body, @Request() request, @UploadedFile() uploadFile) {
    const ossConfig = await this.ossService.getOssConfig();
    const file = uploadFile || body.file;
    const { openOss, cdnDomain, ...configItem } = ossConfig || {}

    if (openOss) {
      try {
        let { url } = await this.ossService.saveFile({
          buffer: file.buffer,
          name: body?.fileName ? body?.fileName : `${uuid()}-${new Date().getTime()}${path.extname(file.originalname)}`,
          path: body.folderPath,
        }, configItem);

        if (cdnDomain) { // 替换正则
          const domainReg = /^(https?:\/\/)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/; 
          url = url.replace(domainReg, cdnDomain)
        }
        return { data: { url }, code: 1 };
      } catch (err) {
        return { code: -1, msg: `上传失败: ${err}`, message: `上传失败: ${err}` };
      }
    }

    const domainName = getRealDomain(request);
    try {
      const subPath = await this.flowService.saveFile({
        str: file.buffer,
        filename: `${uuid()}-${new Date().getTime()}${path.extname(file.originalname)}`,
        folderPath: body.folderPath,
      });
      return {
        data: {
          url: `${domainName}/${env.FILE_LOCAL_STORAGE_PREFIX}${subPath}`,
        },
        code: 1,
      };
    } catch (err) {
      return {
        code: -1,
        msg: `上传失败: ${err}`,
      };
    }
  }

  @Post('/uploadFiles')
  @UseInterceptors(FilesInterceptor('files'))
  async saveFiles(@UploadedFiles() uploadedFiles) {
    const ossConfig = await this.ossService.getOssConfig();
    const { openOss, cdnDomain, ...configItem } = ossConfig || {}

    if (openOss) {
      const domainReg = /^(https?:\/\/)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/; 
      try {
        const res = await Promise.all(uploadedFiles.map(async (file) => {
          let { url } = await this.ossService.saveFile({
            buffer: file.buffer,
            name: `${uuid()}-${new Date().getTime()}${path.extname(file.originalname)}`,
          }, configItem)
          if (cdnDomain) { // 替换正则
            url = url.replace(domainReg, cdnDomain)
          }
          return {
            url,
            fileName: file.originalname
          }
        }))
        return {
          code: 1,
          data: res
        }
      } catch (err) {
        return { code: -1, msg: `上传失败: ${err}`, message: `上传失败: ${err}` };
      }
    }

    return {
      code: -1,
      msg: '未开启OSS上传，请联系平台管理员'
    }
  }
}
