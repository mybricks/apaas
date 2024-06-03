import { Body, Controller, Get, Post, Query, Req, Res, Request, UseFilters } from "@nestjs/common";
import { Request as RequestType, Response } from "express";
import FileDao from "./dao/FileDao";
import FileContentDao, { FileContentDO } from "./dao/FileContentDao";
import UserGroupDao from "./dao/UserGroupDao"
import { EffectStatus, ExtName } from "./constants";
import FilePubDao from "./dao/filePub.dao";
import { getNextVersion } from "./utils";
import ConfigDao from "./dao/config.dao";
import UserDao from "./dao/UserDao";
import * as axios from "axios";
// import FileService from '../module/file/file.controller'
// import { getRealDomain } from "../utils";
// import UploadService from '../module/upload/upload.service';
import UserService from './module/user/user.service';
// import { getAdminInfoByProjectId } from '../utils/index'
import { Logger } from '@mybricks/rocker-commons';
import LogService from "./module/log/log.service";

import env from './utils/env'

const fs = require('fs');
const path = require('path');


@Controller("/paas/api")
export default class WorkspaceService {
  fileDao: FileDao;
  configDao: ConfigDao;
  fileContentDao: FileContentDao;
  filePubDao: FilePubDao;
  // fileService: FileService;
  userService: UserService;
  logService: LogService
  userDao: UserDao;
  userGroupDao: UserGroupDao;
  // uploadService: UploadService;

  constructor() {
    this.fileDao = new FileDao();
    this.fileContentDao = new FileContentDao();
    this.filePubDao = new FilePubDao();
    this.configDao = new ConfigDao();
    // this.fileService = new FileService();
    this.userService = new UserService();
    this.logService = new LogService()
    this.userDao = new UserDao();
    this.userGroupDao = new UserGroupDao();
    // this.uploadService = new UploadService()
  }

  @Get("/workspace/getAll")
  async getAll(@Query() query) {
    const { userId: originUserId, parentId, groupId } = query;
    const userId = await this.userService.getCurrentUserId(originUserId);

    if (!userId) {
      return { code: -1, message: "error" };
    }

    try {
      const params: Record<string, unknown> = { parentId, groupId };
      if (!groupId) {
        params.creatorId = userId
      }
      const rtn = await this.fileDao.query(params);

      return {
        code: 1,
        // TODO
        data: rtn.filter((item) => {
          // 不需要hasIcon字段了，全部是文件了，不是base64
          // const { hasIcon } = item
          // if (hasIcon === "1") {
          //   item.icon = `/paas/api/workspace/getFileIcon?fileId=${item.id}`;
          // } else if (hasIcon.startsWith('http')) {
          //   item.icon = hasIcon
          // }

          return item.extName !== "component";
        }),
      };
    } catch (ex) {
      return { code: -1, message: ex.message };
    }
  }

  @Get("/workspace/trashes")
  async getTrashes(@Query() query) {
    const { userId } = query;
    if (!userId) {
      return { code: -1, message: "用户 ID 不能为空" };
    }

    try {
      /** 15 天 */
      const rtn = await this.fileDao.getRecycleBinFiles({
        userId,
        timeInterval: 15 * (24 * 60 * 60) * 1000,
      });

      return {
        code: 1,
        data: rtn.filter((item) => {
          // const { hasIcon } = item
          // if (hasIcon === "1") {
          //   item.icon = `/paas/api/workspace/getFileIcon?fileId=${item.id}`;
          // } else if (hasIcon.startsWith('http')) {
          //   item.icon = hasIcon
          // }

          return item.extName !== "component";
        }),
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Get("/workspace/getFile")
  async getFile(@Query() query) {
    const { userId, fileId } = query;
    if (!userId) {
      return {
        code: -1,
        message: "error",
      };
    }

    try {
      const rtn = await this.fileDao.queryById(fileId);

      return {
        code: 1,
        data: rtn,
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Get("/workspace/getFullFile")
  async getFullFile(@Query() query) {
    const { fileId, version } = query;
    try {
      const rtn = await this.fileDao.queryById(fileId);
      let res;
      if(version) {
        res = await this.fileContentDao.getContentByVersionAndFileId({ fileId: fileId, version: version });
      } else {
        res = await this.fileContentDao.getLatestContentId({ fileId: fileId });
      }
      /** fileDao.queryById 引用处比较多，就不修改其连表当时，使用单独查一次 user 的方式 */
      const user = await this.userDao.queryById({ id: rtn.updatorId });
      let content = null
      if(res?.id) {
        const temp = await this.fileContentDao.queryById({ id: res?.id })
        content = temp ? temp[0] : null
      }

      return {
        code: 1,
        data: Object.assign({}, rtn, { 
          updatorName: user?.name || user?.email || rtn.updatorName, 
          content: content?.content, 
          version: content?.version || null 
        }),
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/workspace/createFile")
  async createFile(@Body() body) {
    const { userId, userName, name, extName, namespace, type, parentId, groupId, componentType } = body;
    if (!userId) {
      return {
        code: -1,
        message: "error",
      };
    }

    try {
      const rtn = await this.fileDao.createFile({
        type,
        name,
        namespace,
        creatorId: userId,
        creatorName: userName,
        extName: extName,
        groupId,
        parentId,
      });
			
			if (rtn.id) {
        if(['cloud-com', 'mp-cloudcom', 'theme'].includes(extName)) {
          await this.fileContentDao.create({
            fileId: rtn.id,
            content: JSON.stringify({ fileType: type, componentType }),
            version: '1.0.0',
            creatorId: userId
          });
        }
        // else if(['folder-project'].includes(extName)) {
        //   // 初始化系统超级管理员
        //   await this.uploadService.saveFile({
        //     str: JSON.stringify(getAdminInfoByProjectId({ projectId: rtn.id })),
        //     filename: 'SYS_ADMIN_CONFIG.json',
        //     folderPath: `/project/${rtn.id}`,
        //   })
        //   // 发送超管登录页面
        //   await this.uploadService.saveFile({
        //     str: fs.readFileSync(path.join(__dirname, './SYS_ADMIN_LOGIN.html'), "utf-8"),
        //     filename: 'admin_login.html',
        //     folderPath: `/project/${rtn.id}`,
        //   })
        //   await this.uploadService.saveFile({
        //     str: fs.readFileSync(path.join(__dirname, './SYS_ADMIN_LOGIN.html'), "utf-8"),
        //     filename: 'admin_login.html',
        //     folderPath: `/staging/project/${rtn.id}`,
        //   })
        // }
			}

      return {
        code: 1,
        data: { id: rtn.id },
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/workspace/saveFile")
  async updateFile(@Body() body) {
    try {
      let { userId: originUserId, fileId, shareType, name, content, operationList, icon, namespace, type, isEncode } = body;
      const userId = await this.userService.getCurrentUserId(originUserId);

      if (!userId) {
        return {
          code: -1,
          message: "error",
        };
      }

      if (
        namespace &&
        typeof namespace === "string" &&
        namespace.trim() &&
        namespace !== "_self"
      ) {
        const [fileByFileId, fileByNamespace] = await Promise.all([
          await this.fileDao.queryById(fileId),
          await this.fileDao.queryByNamespace(namespace),
        ]);

        if (!fileByNamespace && fileByFileId.namespace === "_self") {
          await this.fileDao.update({
            id: fileId,
            namespace,
            updatorId: userId,
            updatorName: originUserId,
          });
        }
      }

      if (type) {
        await this.fileDao.update({
          id: fileId,
          type,
          updatorId: userId,
          updatorName: originUserId,
        });
      }

      if (name) {
        await this.fileDao.update({
          id: fileId,
          name,
          updatorId: userId,
          updatorName: userId,
        });
      }

      if (icon) {
        await this.fileDao.update({
          id: fileId,
          icon,
          updatorId: userId,
          updatorName: originUserId,
        });
      }

      if (shareType !== undefined) {
        await this.fileDao.update({
          id: fileId,
          shareType,
          updatorId: userId,
          updatorName: originUserId,
        });
      }

      const data: any = {}

      if (content) {
        const contentItem = (await this.fileContentDao.queryLatestByFileId<FileContentDO>(fileId)) as any;
        const nextVersion = contentItem?.version ? getNextVersion(contentItem?.version) : "1.0.0"
        const createRes = await this.fileContentDao.create({
          fileId,
          // 兼容某些场景下保存内容被防火墙拦截
          content: isEncode ? decodeURIComponent(Buffer.from(content, 'base64').toString()) : content,
          // content: isEncode ? decodeURI(content.replace(/#D#/g, '.').replace(/#DH#/g, ',').replace(/#FH#/g, ';').replace(/#ZKH#/g, '(').replace(/#YKH#/g, ')').replace(/#MH#/g, ':').replace(/#DYH#/g, "'")) : content,
          version: nextVersion,
          creatorId: userId
        });

        data.version = nextVersion
        if(operationList) {
          try {
           await this.logService.savePageOperateLog({ userId, content: operationList, relationToken: createRes.id })
          } catch (e) {
            Logger.info(`[savePageOperateLog]: 保存页面日志失败: ${e.message}`)
          }
        }
      }

      return {
        code: 1,
        data,
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Get("/workspace/getFileContents")
  async getFileContents(@Query() query) {
    try {
      const { ids } = query;

      if (!Array.isArray(ids)) {
        return {
          code: -1,
          message: 'invalid params ids',
        };
      }

      const data = await this.fileContentDao.queryBy({ ids: ids })
      return {
        code: 1,
        data,
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/workspace/saveScenesToMutiFiles")
  async saveScenes2MutiFiles(@Body() body) {
    try {
      let { userId: originUserId, updatePages } = body;
      const userId = await this.userService.getCurrentUserId(originUserId);

      if (!userId) {
        return {
          code: -1,
          message: "invalid params userId",
        };
      }

      if (!Array.isArray(updatePages) || updatePages.length === 0) {
        return {
          code: -1,
          message: "invalid params updatePages",
        }
      }

      const shouldCreateFilePages = updatePages.filter(page => {
        return !page || !page.fileId
      })

      const createMap = {};
      const updateMap = {};

      if (shouldCreateFilePages.length > 0) {
        await Promise.all(shouldCreateFilePages.map(page => {
          return this.fileDao.createFile({
            name: `分页数据${page.id}`,
            creatorId: userId,
            creatorName: userId,
            extName: page.extName,
            parentId: page.parentId,
          }).then(({ id: fileId }) => { createMap[page.id] = fileId })
        }))
      }

      await Promise.all(updatePages.map(async page => {
        let fileContentVersion = '1.0.0'

        const fileContent = (await this.fileContentDao.queryLatestByFileId<FileContentDO>(page.fileId)) as any;
        fileContentVersion = fileContent?.version as any as string

        return this.fileContentDao.create({
          fileId: page?.fileId ?? createMap[page.id],
          content: JSON.stringify(page),
          version: getNextVersion(fileContentVersion || "1.0.0"),
          creatorId: userId
        }).then(({ id: fileContentId }) => {
          updateMap[page.id] = {
            fileId: page?.fileId ?? createMap[page.id],
            fileContentId
          }
        })
      }))

      return {
        code: 1,
        data: {
          updatePagesResult: updatePages.map(t => {
            return {
              id: t.id,
              ...(updateMap?.[t.id] ?? {})
            }
          })
        }
      }
      
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }



  @Post("/workspace/publish")
  async publish(@Body() body) {
    try {
      let {
        extName,
        userId: originUserId,
        fileId,
        content,
        commitInfo,
        type,
        uri,
        fileContentId
      } = body;

      const userId = await this.userService.getCurrentUserId(originUserId);
      /** 不存在 fileContentId 则取最新一条记录 */
      if (!fileContentId) {
        const fileContent = (await this.fileContentDao.queryLatestByFileId<FileContentDO>(fileId)) as any;

        fileContentId = fileContent?.id || null;
      }

      if(uri) {
        await this.fileDao.update({
          id: fileId,
          uri: uri,
          updatorId: userId,
          updatorName: originUserId,
        })
      }

      let data: Record<string, unknown> = {};
      const [pub] = await this.filePubDao.getLatestPubByFileId(fileId, type);
      const version = pub?.version ? getNextVersion(pub?.version) : "1.0.0";
      let modifyContent = content;
      if (extName === ExtName.WORK_FLOW) {
        modifyContent = `
          const axios = require('axios');
          const FormData = require('form-data');
          const fileParser = require('@mybricks/file-parser');
          const renderCom = require('@mybricks/render-com-node');
          ${content}
        `;
      }
      const { id } = await this.filePubDao.create({
        fileId,
        version,
        content: modifyContent,
        type,
        commitInfo,
        creatorId: userId,
        creatorName: originUserId,
        fileContentId
      });
      data.pib_id = id;

      return { code: 1, data: data };
    } catch (ex) {
      return { code: -1, message: ex.message };
    }
  }


  @Get("/workspace/save/versions")
  async getSaveVersions(@Query() query) {
    const { fileId, pageIndex, pageSize } = query;
    const data = await this.fileContentDao.getContentVersions({
      fileId,
      limit: Number(pageSize),
      offset: (Number(pageIndex) - 1) * Number(pageSize),
    });
    const total = await this.fileContentDao.getContentVersionsCount({fileId})

    return { code: 1, data: data.map(item => ({ ...item, creatorName: item.creatorName || item.creatorEmail })), total };
  }

  // 和之前的接口参数一样
  @Get('/workspace/save/versionsAndLogs')
  async getSaveVersionsAndLogs(
    @Query() query
  ) {
    const { fileId, pageIndex, pageSize } = query;

    try {
      const data = await this.fileContentDao.getContentVersions({
        fileId,
        limit: Number(pageSize),
        offset: (Number(pageIndex) - 1) * Number(pageSize),
      });
      const saveFileIds = data.map(item => item.id)
      let mapFileIdToLog = {};
      if(saveFileIds.length > 0) {
        const operateLogs = await this.logService.getPageSaveOperateListsByFileIds({ fileIds: saveFileIds})
         operateLogs.list.forEach(element => {
          mapFileIdToLog[String(element.relation_token) || ''] = element.log_content
        });
      }

      const total = await this.fileContentDao.getContentVersionsCount({ fileId })

      return { code: 1, data: data.map(item => ({ ...item, creatorName: item.creatorName || item.creatorEmail, logContent: mapFileIdToLog[String(item.id)] || undefined })), total };

    } catch (e) {
      Logger.info(`[getSaveVersionsAndLogs]: 获取保存版本列表失败: ${e.message}`)
      return {
        code: -1,
        msg: e.message || '获取失败'
      }
    }
  }


  @Get("/workspace/save/version/operations")
  async getSaveVersionOperations(@Query() query) {
    const { id, } = query;
    const data = await this.fileContentDao.queryById({
      id,
    });

    let content = null;
    if (Array.isArray(data)) {
      content = data[0].content;
    }

    let operationList = [];
    try {
      operationList = JSON.parse(content).operationList
    } catch {
      return { code: -1, msg: '未查询到保存版本的信息' };
    }

    return { code: 1, data: operationList };
  }

  @Get("/workspace/publish/versions")
  async getPublishVersions(@Query() query) {
    const { fileId, pageIndex, pageSize, type } = query;
    const filePubs = await this.filePubDao.getContentVersions({
      fileId,
      limit: Number(pageSize),
      offset: (Number(pageIndex) - 1) * Number(pageSize),
      type,
    });
    const total = await this.filePubDao.getContentVersionsCount({fileId, type})

    // const fileContentIds = filePubs
    //   .filter((t) => t.fileContentId)
    //   .map((t) => t.fileContentId);

    // if (Array.isArray(fileContentIds) && fileContentIds.length) {
    //   let fileContents = await this.fileContentDao.queryBy({
    //     ids: fileContentIds,
    //   });

    //   // 兼容单个查询不为数组的情况
    //   // @ts-ignore
    //   if (fileContents?.id) {
    //     fileContents = [fileContents];
    //   }

    //   if (Array.isArray(fileContents) && fileContents.length) {
    //     const fileContentMap = new Map();
    //     fileContents.forEach((content) => {
    //       fileContentMap.set(content.id, content);
    //     });

    //     filePubs.forEach((filePub) => {
    //       if (
    //         filePub?.fileContentId &&
    //         fileContentMap.has(filePub.fileContentId)
    //       ) {
    //         // @ts-ignore
    //         filePub.fileContentInfo = fileContentMap.get(filePub.fileContentId);
    //       }
    //     });
    //   }
    // }

    return { code: 1, data: filePubs.map(item => ({ ...item, creatorName: item.creatorName || item.creatorEmail })), total};
  }

  @Get("/workspace/publish/content")
  async getPublishByFileId(@Query() query) {
    const { id } = query;
    const [data] = await this.filePubDao.getPublishByFileId(id);

    return { code: 1, data: data ?? null };
  }

  @Post("/workspace/publish/getPubAsset")
  async getPublishAssets(@Body() body) {
    const { fileId, envType, version } = body;
    const assetPath = path.join(env.FILE_APP_PRODUCTS_FOLDER, `./${fileId}/${envType}/${version}/${fileId}.zip`)
    if(fs.existsSync(assetPath)) {
      return {
        code: 1,
        data: {
          assetPath
        }
      }
    } else {
      return {
        code: -1,
        msg: '资源不存在'
      }
    }
  }

  @Post("/workspace/file/revert")
  async revertFile(@Body() body) {
    const { fileContentId, filePubId, userId: originUserId } = body;
    if (!filePubId && !fileContentId) {
      return { code: 0, message: "filePubId 或 fileContentId 不能为空" };
    }

    const userId = await this.userService.getCurrentUserId(originUserId);
    const user = await this.userService.queryById({ id: userId });

    if (fileContentId) {
      const [fileContent] = await this.fileContentDao.queryById({
        id: fileContentId,
      });

      if (!fileContent) {
        return { code: 0, message: "保存记录不存在" };
      }

      const latestFileContent = await this.fileContentDao.queryLatestByFileId<{ version: string }>(fileContent.fileId);
      await this.fileContentDao.create({
        fileId: fileContent.fileId,
        content: fileContent.content,
        version: getNextVersion(latestFileContent?.version || fileContent?.version || "1.0.0"),
        creatorId: userId
      });
    } else if (filePubId) {
      const [filePub] = await this.filePubDao.getPublishByFileId(filePubId);

      if (!filePub) {
        return { code: 0, message: "发布记录不存在" };
      }
      const [latestPub] = await this.filePubDao.getLatestPubByFileId(filePub.fileId, filePub.type);
      const nextVersion = getNextVersion(latestPub?.version || "1.0.0")
      const { id } = await this.filePubDao.create({
        fileId: filePub.fileId,
        content: filePub.content,
        version: nextVersion,
        creatorId: userId,
        creatorName: user?.name || user?.email || userId,
        type: filePub.type,
        fileContentId: filePub.fileContentId,
        commitInfo: `由 ${filePub.version} 版本回滚`,
      });
      let pubAssetSubUrl = '', pubAssetFilePath = '';
      const rawPath = path.join(env.FILE_APP_PRODUCTS_FOLDER, `./${filePub.fileId}/${filePub.type}/${filePub.version}/${filePub.fileId}.zip`)
      Logger.info('[/workspace/file/revert]: 原始路径是: ', rawPath)
      if(fs.existsSync(rawPath)) {
        pubAssetSubUrl = path.join(`./${env.FILE_LOCAL_STORAGE_PREFIX}/${env.FILE_APP_PRODUCTS_FOLDER_PREFIX}`, `./${filePub.fileId}/${filePub.type}/${filePub.version}/${filePub.fileId}.zip`)
        pubAssetFilePath = rawPath;
      }

      return { 
        code: 1, 
        message: "回滚成功",
        data: {
          filePubId: id,
          type: filePub.type,
          pubAssetFilePath,
          rawVersion: filePub.version,
          nowVersion: nextVersion,
          fileId: filePub.fileId,
          pubAssetSubUrl: pubAssetSubUrl
        }
      };
    }

    return { code: 1, message: "回滚成功" };
  }

  @Post("/workspace/deleteFile")
  async deleteFile(@Body() body, @Request() request) {
    const { id, userId } = body;
    if (!id || !userId) {
      return {
        code: -1,
        message: "error",
      };
    }

    try {
      const rtn = await this.fileDao.deleteFile({
        id,
        updatorId: userId
      });

      return {
        code: 1,
        data: { id: rtn.id },
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/workspace/recoverFile")
  async recoverFile(@Body() body) {
    const { id, userId } = body;
    if (!id || !userId) {
      return { code: -1, message: "userId、id 不能为空" };
    }

    try {
      await this.fileDao.recoverFile({
        id,
        updatorId: userId
      });

      return { code: 1, data: null };
    } catch (ex) {
      return { code: -1, message: ex.message };
    }
  }

  // @Get("/workspace/checkNamespaceUsedByCdm")
  // async checkNamespaceUsedByCdm(@Query() query) {
  //   const { namespace } = query;
  //   if (!namespace) {
  //     return {
  //       code: -1,
  //       message: "error",
  //     };
  //   }

  //   try {
  //     const rtn = await this.fileDao.queryByNamespace(namespace);

  //     return {
  //       code: rtn ? -1 : 1,
  //       data: null,
  //     };
  //   } catch (ex) {
  //     return {
  //       code: -1,
  //       message: ex.message,
  //     };
  //   }
  // }

  @Get("/workspace/getPubVersionByFileId")
  async getPubVersionByFileId(@Query() query) {
    const [pub] = await this.filePubDao.getLatestPubByFileId(query.fileId);
    const version = pub?.version || "1.0.0";
    return {
      code: 1,
      data: version,
    };
  }

  /**
   * 获取图标，直接使用在image标签的src
   * ```js
   * <img src="api/workspace/getFileIcon?fileId=xxx"/>
   * ```
   */
  @Get("/workspace/getFileIcon")
  async getFileIcon(@Query() query, @Res() res: Response) {
    try {
      const file = await this.fileDao.queryIconById(query.fileId, [
        EffectStatus.EFFECT,
        EffectStatus.DELETE,
      ]);
      const base64 = file.icon.replace(/^data:image\/\w+;base64,/, "");
      const dataBuffer = new Buffer(base64, "base64");

      res.end(dataBuffer);
    } catch (ex) {
      res.end(ex.message);
    }
  }

  @Get("/workspace/getFilePath")
  async getFilePath(@Query() query) {
    const { fileId, userId } = query;
    const path = [];

    const folderExtnames = ['folder', 'folder-project', 'folder-module']

    // let file = await this.fileDao.queryById(fileId);
    // let [file] = await this.fileDao.getFiles({ id: fileId, creatorId: userId });
    let [file] = await this.fileDao.getFiles({ id: fileId });

    if (file) {
      let { extName, parentId } = file;

      if (folderExtnames.includes(extName)) {
        path.unshift(file);

        while (parentId) {
          file = await this.fileDao.queryById(parentId);
          parentId = file?.parentId;

          path.unshift(file);
        }
      }
    }

    return {
      code: 1,
      data: path,
    };
  }

  @Get("/workspace/globalSearch")
  async globalSearch(@Query() query) {
    const {
      name,
      userId,
      limit,
      offset
    } = query;
    const list: any = await this.fileDao.globalSearch({
      name,
      userId,
      limit: Number(limit),
      offset: Number(offset)
    });

    const path = await Promise.all(
      list.map((item) => {
        const { shareType, groupId, creatorId } = item;
        return new Promise((resolve) => {
          if (shareType === 1 && !groupId && creatorId !== userId) {
            resolve([{id: 0, name: '大家的分享', extName: 'share'}]);
          } else {
            this.getPath(item).then((path) => {
              resolve(path);
            });
          }
        });
      })
    );

    return {
      code: 1,
      data: {
        list,
        path
      }
    }
  }

  async getPath(file) {
    return new Promise(async (resolve) => {
      const path = [];
      let { parentId, extName, groupId } = file;
      if (extName === "group") {
        path.push(file);
      } else {
        while (parentId) {
          const parent = await this.fileDao.queryById(parentId);
          if (parent) {
            path.unshift(parent);
            parentId = parent.parentId;
          } else {
            parentId = null;
          }
        }
        if (groupId) {
          const group = await this.userGroupDao.queryById({id: groupId});
          path.unshift(group);
        } else {
          path.unshift(null);
        }
      }

      resolve(path);
    });
  }
}