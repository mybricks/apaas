import { Response } from 'express';
import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
const path = require('path');
import {Logger} from '@mybricks/rocker-commons'


import FileDao from "../../dao/FileDao";
import FilePubDao from '../../dao/filePub.dao';
import UserDao from '../../dao/UserDao';
import FileCooperationDao from "../../dao/FileCooperationDao";
import UserGroupDao from "../../dao/UserGroupDao";
import UserGroupRelationDao from '../../dao/UserGroupRelationDao'
import FileContentDao from "../../dao/FileContentDao";
import UserFileRelationDao from "../../dao/UserFileRelationDao";

import FileService from "./file.service";
import UserService from '../user/user.service';

import { isNumber } from './../../utils'


@Controller("/paas/api/file")
export default class FileController {
  fileDao: FileDao;
  fileContentDao: FileContentDao;
  filePubDao: FilePubDao;
  fileCooperationDao: FileCooperationDao;
  userDao: UserDao;
  userGroupDao: UserGroupDao;
  userGroupRelationDao: UserGroupRelationDao;

  fileService: FileService
  userService: UserService
  userFileRelationDao: UserFileRelationDao



  constructor() {
    this.fileDao = new FileDao();
    this.filePubDao = new FilePubDao();
    this.fileContentDao = new FileContentDao();
    this.fileCooperationDao = new FileCooperationDao();
    this.userDao = new UserDao();
    this.userGroupDao = new UserGroupDao();
    this.userGroupRelationDao = new UserGroupRelationDao();
    this.fileService = new FileService()
    this.userService = new UserService()
    this.userFileRelationDao = new UserFileRelationDao()
  }

  @Get("/get")
  async getAll(@Query() query) {
    const {
      id,
      extName,
      page,
      pageSize = 10,
      parentId,
      creatorId,
    } = query ?? {};
    const files = await this.fileDao.query({
      id,
      extName,
      page,
      pageSize,
      parentId,
      creatorId,
    });
    return {
      code: 1,
      data: files,
    };
  }


  @Post('/delete')
  async deleteFile(@Body() body) {
    const { fileId, updatorId: originUpdatorId }: { fileId: number, updatorId: number | string } = body;
    const updatorId = await this.userService.getCurrentUserId(originUpdatorId);
    if(!fileId || !updatorId) {
      return {
        code: -1,
        msg: '参数不合法'
      }
    }
  
    try {
      const file = await this.fileDao.queryById(fileId)
      // 别写全不等
      if(!file || file.creatorId != updatorId) {
        return {
          code: -1,
          msg: '删除失败，您没有此文件权限'
        }
      }
      const res = await this.fileDao.deleteFile({ id: fileId, updatorId, updatorName: originUpdatorId as any })
      return {
        code: 1,
        data: res
      }
    } catch(e) {
      return {
        code: -1,
        msg: e.message || '创建出错'
      }
    }
  }

  @Post("/create")
  async create(@Body() body) {
    const { name, creatorId: originCreatorId, creatorName, extName, groupId, description, parentId, icon } = body;
    const creatorId = await this.userService.getCurrentUserId(originCreatorId);

    if(!name || !creatorId || !extName) {
      return { code: -1, msg: '参数不合法' };
    }
    const param = { parentId, groupId, name, extName, icon, creatorId, creatorName, description };

    try {
      const result = await this.fileDao.createFile(param)
      return {
        code: 1,
        data: result
      }
    } catch(e) {
      return {
        code: -1,
        msg: e.message || '创建出错'
      }
    }
  }

  @Post("/copy")
  async copy(@Body() body) {
    const { name, id, userId } = body;

    if(!name || !id || !userId) {
      return { code: -1, msg: '参数不合法' };
    }

    

    try {

      const [[fileInfo], fileContent] = await Promise.all([
        this.fileDao.pureQuery({ id }),
        this.fileContentDao.queryLatestSave({ fileId: id })
      ])
      const createFileParam = {
        parentId: fileInfo.parentId, 
        groupId: fileInfo.groupId,
        name, 
        extName: fileInfo.extName, 
        icon: fileInfo.icon, 
        creatorId: userId,
      }
      const res1 = await this.fileDao.createFile(createFileParam)
      let result = null
      if(fileContent?.content) {
        const createFileContentParams = {
          fileId: res1.id,
          creatorId: userId,
          version: '1.0.0',
          content: fileContent.content
        }
        result = await this.fileContentDao.create(createFileContentParams)
      }
      return {
        code: 1,
        data: result
      }
    } catch(e) {
      return {
        code: -1,
        msg: e.message || '创建出错'
      }
    }
  }

  @Post("/createFileBaseTemplate")
  async createFile(@Body() body) {
    const { userId: originUserId, name, extName, namespace, type, parentId, groupId, templateId, dumpJSON } = body;
    const userId = await this.userService.getCurrentUserId(originUserId);

    if (!userId) {
      return { code: -1, msg: "缺少userId参数" };
    }
    try {
      const rtn = await this.fileDao.createFile({
        type,
        name,
        namespace,
        creatorId: userId,
        creatorName: originUserId,
        extName: extName,
        groupId,
        parentId,
      });
			
			if (rtn.id) {
        // const latestSave = await this.fileContentDao.queryLatestSave({ fileId: templateId})
        const latestSave = dumpJSON ? { content: JSON.stringify(dumpJSON) } : await this.fileContentDao.queryLatestSave({ fileId: templateId})
        
        await this.fileContentDao.create({
          fileId: rtn.id,
          content: latestSave?.content,
          version: '1.0.0',
          creatorId: userId,
        });
			} else {
        return { code: -1, msg: '新建失败，请重试' };
      }

      return {
        code: 1,
        data: { id: rtn.id },
      };
    } catch (ex) {
      return { code: -1, msg: ex.message };
    }
  }

  @Post("/rename")
  async rename(
    @Body() body,
  ) {
    const { id, name, userId }: { id: number, name: string, userId: string | number } = body;
    const user = await this.userDao.queryById({ id: userId })
    const result = await this.fileDao.update({ id, name, updatorId: user.id, updatorName: user.name })

    return {
      code: 1,
      data: result
    }
  }

  @Get("/getSysTemFiles")
  async getSysTemFiles(@Query() query) {
    const { extName, name, creatorId } = query ?? {};
    const files = await this.fileDao.getFiles({
      type: "system",
      extName,
      name,
      creatorId,
    });
    return {
      code: 1,
      data: files,
    };
  }

  @Post("/getFileContentByFileIdAndPubVersion")
  async getFileContentByFileIdAndPubVersion(
    @Body("fileId") fileId: string,
    @Body("pubVersion") pubVersion: string
  ) {
    if (!fileId || !pubVersion) {
      return {
        code: -1,
        msg: "参数不合法",
      };
    }
    const pubInfo = await this.filePubDao.getPublishByFileIdAndVersion({
      fileId: fileId,
      version: pubVersion,
    });
    if (!pubInfo?.fileContentId) {
      return {
        code: -1,
        msg: `filePub中fileContentId为空`,
      };
    }
    const rtn = await this.fileContentDao.queryById({
      id: pubInfo?.fileContentId,
    });
    return {
      code: 1,
      data: rtn ? rtn[0] : null,
    };
  }

  @Get("/getCooperationUsers")
  async getCooperationUsers(@Query() query) {
    const { email, userId: originUserId, timeInterval } = query;
    const userId = await this.userService.getCurrentUserId(originUserId || email);
    const fileId = Number(query.fileId);

    if (!isNumber(fileId) || !userId) {
      return {
        code: -1,
        data: null,
        message: '参数fileId或userId不合法'
      }
    }

    const [file, versions] = await Promise.all([
      await this.fileDao.queryById(fileId),
      await this.fileContentDao.getContentVersions({
        fileId,
        limit: 1,
        offset: 0,
      }),
      /** 删除超时用户，status设置为-1 */
      await this.fileCooperationDao.delete({ fileId, timeInterval })
    ])

    /** 查userId是否在当前fileId协作过 */
    let [curUser, numberOfOnlineUsers, roleDescription] = await Promise.all([
      await this.fileCooperationDao.query({ userId, fileId }),
      await this.fileCooperationDao.numberOfOnlineUsers({ fileId }),
      new Promise(async (resolve) => {
        // 创建人、最高权限
        if (file?.creatorId == userId) {
          resolve(1)
        } else {
          const [fileDescription, groupDescription] = await Promise.all([
            new Promise(async (resolve) => {
              const userFileFelation = await this.userFileRelationDao.query({userId, fileId})
              resolve(userFileFelation?.roleDescription)
            }),
            new Promise(async (resolve) => {
              if (!file?.groupId) {
                resolve(undefined)
              } else {
                const userGroupRelation = await this.userGroupRelationDao.queryByUserIdAndUserGroupId({ userId, userGroupId: file?.groupId, status: 1 })
                resolve(userGroupRelation?.roleDescription)
              }
            })
          ])

          resolve(fileDescription || groupDescription || 3)
        }
      })
    ])
    const hasUser = !!numberOfOnlineUsers
    let finalStatus: -1 | 0 | 1 = 0

    /** 没有用户在线，并且有编辑权限，自动上锁, 设置status为1 */
    if (!hasUser && [1, 2, '1', '2'].includes(roleDescription as number)) {
      finalStatus = 1
    }

    if (curUser) {
      /**
       * 是，更新状态
       *  已在线，状态不变
       *  未在线，状态使用finalStatus
       */
      const curStatus = curUser.status;
      await this.fileCooperationDao.update({ userId, fileId, status: curStatus === -1 ? finalStatus : curStatus })
    } else {
      /** 否，插入一条status为finalStatus的记录 */
      await this.fileCooperationDao.create({ userId, fileId, status: finalStatus })
    }

    const cooperationUsers = await this.fileCooperationDao.queryOnlineUsers({ fileId })
    const curUserIndex = cooperationUsers.findIndex((cooperationUser) => cooperationUser.userId == userId)
    /** 把当前用户提前 */
    cooperationUsers[0] = cooperationUsers.splice(curUserIndex, 1, cooperationUsers[0])[0]

    const userIds: any = cooperationUsers.map((cooperationUser) => cooperationUser.userId)
    /** 查询用户信息 */
    const users = await this.userDao.queryByIds({ ids: userIds })

    Reflect.deleteProperty(file, 'icon');
    if (versions?.[0]?.version) {
      const lastVersion = versions[0]
      file.version = lastVersion.version
      file.updatorName = lastVersion.creatorName || lastVersion.creatorEmail || lastVersion.creatorId || file.updatorName
    }

    return {
      code: 1,
      data: {
        users: cooperationUsers.filter((_, index) => {
          return users[index]
        }).map((cooperationUser, index) => {
          const user = users[index]
          return {
            id: user.id,
            name: user.name,
            userId: user.email,
            email: user.email,
            avatar: user.avatar,
            status: cooperationUser.status,
            updateTime: cooperationUser.updateTime
          }
        }),
        roleDescription,
        file
      }
    }
  }

  @Get("/getAuthorizedUsers")
  async getAuthorizedUsers(@Query() query){
    const { fileId, groupId } = query
    const [groupAdminUsers, fileCreator, groupOwner]: any = await Promise.all([
      new Promise(async (resolve) => {
        if (groupId) {
          const groupAdminUsers = await this.userGroupRelationDao.queryUsersByGroupId({
            userGroupId: groupId,
            roleDescription: "1",
          });
          resolve(groupAdminUsers.map((user) =>{
            return {
              ...user,
              userGroupId: user.user_group_id,
              userId: user.email,
              originUserId: user.user_id,
              creatorId: user.creator_id,
              creatorName: user.creator_name,
              createTime: user.create_time,
              updateTime: user.update_time,
              roleDescription: user.role_description
            }
          }));
        } else {
          resolve([]);
        }
      }),
      new Promise(async (resolve) => {
        if (fileId) {
          const file = await this.fileDao.queryById(fileId);
          if (file) {
            const user = await this.userDao.queryById({
              id: file.creatorId,
            });
            resolve({ originUserId: user.id, userId: user.email, name: user.name, email: user.email, avatar: user.avatar});
          }
        } else {
          resolve(null);
        }
      }),
      new Promise(async (resolve) => {
        if (groupId) {
          const groupOwner = await this.userDao.getGroupOwnerInfo({ groupId });
          resolve(groupOwner);
        } else {
          resolve(null);
        }
      }),
    ]);

    if (
      fileCreator &&
      !groupAdminUsers.find((user) => user.email === fileCreator?.email)
    ) {
      groupAdminUsers.push(fileCreator);
    }

    if (groupOwner) {
      const index = groupAdminUsers.findIndex((user) => user.email === groupOwner.email);

      if (index !== -1) {
        const owner = groupAdminUsers[index];
        groupAdminUsers[index] = groupAdminUsers[0];
        groupAdminUsers[0] = owner;
      }
    }

    return {
      code: 1,
      data: groupAdminUsers
    }
  }

  @Post("/toggleFileCooperationStatus")
  async toggleFileCooperationStatus(@Body() body) {
    const { userId: originUserId, status } = body
    const userId = await this.userService.getCurrentUserId(originUserId);
    const fileId = Number(body.fileId)

    if (!isNumber(fileId) || !userId) {
      return {
        code: -1,
        data: null,
        message: '参数fileId或userId不合法'
      }
    }

    if (status === 1) {
      // 上锁
      const [file, editUser] = await Promise.all([
        await this.fileDao.queryById(fileId),
        await this.fileCooperationDao.queryEditUser({ fileId })
      ])

      if (editUser) {
        return {
          code: 1,
          data: null,
          message: '当前文件已被上锁，无权操作'
        }
      }

      let roleDescription: any = 3
      const { groupId, creatorId } = file

      if (creatorId == userId) {
        roleDescription = 1
      } else {
        const [fileDescription, groupDescription] = await Promise.all([
          new Promise(async (resolve) => {
            const userFileRelation = await this.userFileRelationDao.query({userId, fileId})
            resolve(userFileRelation?.roleDescription)
          }),
          new Promise(async (resolve) => {
            if (!groupId) {
              resolve(undefined)
            } else {
              const userGroupRelation = await this.userGroupRelationDao.queryByUserIdAndUserGroupId({ userId, userGroupId: groupId, status: 1 })
              resolve(userGroupRelation?.roleDescription)
            }
          })
        ])
        roleDescription = fileDescription || groupDescription || 3
      }

      if ([1, 2, '1', '2'].includes(roleDescription)) {
        await this.fileCooperationDao.update({ fileId, userId, status: 1 })
        return {
          code: 1,
          data: {}
        }
      } else {
        return {
          code: 1,
          data: null,
          message: '没有当前文件的操作权限'
        }
      }
    } else {
      // 解锁
      await this.fileCooperationDao.update({ fileId, userId, status: 0 })
      return {
        code: 1,
        data: {}
      }
    }



  }

  @Post("/createCooperationUser")
  async createCooperationUser(@Body() body) {
    const { userId: originUserId, email, creatorId: originCreatorId, groupId, fileId, roleDescription } = body;
    const userId = await this.userService.getCurrentUserId(originUserId || email);
    const creatorId = await this.userService.getCurrentUserId(originCreatorId);
    const user = await this.userDao.queryById({id: creatorId});

    if (groupId) {
      const data = await this.userGroupRelationDao.create({
        creatorId,
        creatorName: user.name,
        roleDescription,
        userGroupId: groupId,
        userId
      })

      return {
        code: 1,
        data
      }
    } else {
      const data = await this.userFileRelationDao.create({
        userId,
        fileId,
        creatorId,
        roleDescription
      })

      return {
        code: 1,
        data
      }
    }
  }

  @Post("/updateCooperationUser")
  async updateCooperationUser(@Body() body) {
    const { userId: originUserId, email, updatorId: originUpdatorId, groupId, fileId, roleDescription, status } = body
    const userId = await this.userService.getCurrentUserId(originUserId || email);
    const updatorId = await this.userService.getCurrentUserId(originUpdatorId);
    const user = await this.userDao.queryById({id: updatorId});

    if (groupId) {
      const data = this.userGroupRelationDao.update({
        updatorId,
        updatorName: user.name,
        roleDescription: roleDescription,
        userGroupId: groupId,
        userId,
        status
      })

      return {
        code: 1,
        data
      }
    } else {
      const data = await this.userFileRelationDao.create({
        userId,
        fileId,
        creatorId: updatorId,
        roleDescription
      })

      return {
        code: 1,
        data
      }
    }
  }


  @Get("/getFileTreeMapByFile")
  async getFileTreeMapByFile(@Query() query) {
    const { id, extName, folderExtName } = query
    let file = await this.fileDao.queryById(id)

    if (!file) {
      return {
        code: 1,
        data: {
          ['000']: {
            data: [],
            type: '_files_',
            _origin: {}
          }
        }
      }
    }

    let { parentId } = file;

    const map = {}
    const path = []


    while (parentId) {
      file = await this.fileDao.queryById(parentId);
      const files = await this.fileDao.query({ parentId: file.id, groupId: file.groupId, extNames: [extName, 'folder', 'folder-project', 'folder-module'] })
      if (file.extName === folderExtName) {
        // 停止
        parentId = null
      } else {
        // 继续找
        parentId = file?.parentId
      }
      if (!parentId) {
        map['000'] = {
          data: files,
          type: '_files_',
          _origin: {}
        }
      } else {
        map[`folder_${file.id}`] = {
          data: files,
          type: '_files_',
          _origin: file
        }
        path.unshift({
          fileId: `folder_${file.id}`,
          loading: false,
          type: '_files_'
        })
      }
    }

    if (file.groupId) {
      const files = await this.fileDao.query({ groupId: file.groupId, extNames: [extName, 'folder', 'folder-project', 'folder-module'] })

      map['000'] = {
        data: files,
        type: '_files_',
        _origin: {}
      }
    } else {
      const files = await this.fileDao.query({ extNames: [extName, 'folder', 'folder-project', 'folder-module'], creatorId: file.creatorId })

      map['000'] = {
        data: files,
        type: '_files_',
        _origin: {}
      }
    }

    return {
      code: 1,
      data: { map, path }
    }
  }

  @Get("/getFiles")
  async getFiles(@Query() query) {
    let { parentId, extNames, groupId, creatorId } = query

    if (typeof extNames === 'string') {
      extNames = extNames.split(',')
    }

    const files = await this.fileDao.query({ parentId, extNames, groupId, creatorId })

    return {
      code: 1,
      data: files
    }
  }

  @Get("getFile")
  async getFile(@Query() query) {
    const { id } = query

    const file = await this.fileDao.queryById(id)

    return {
      code: 1,
      data: file
    }
  }

  @Get('/getFileRoot')
  async getFileList(@Query() query) {
    const { parentId, creatorId: originCreatorId, fileId, checkModule } = query;
    const creatorId = await this.userService.getCurrentUserId(originCreatorId);

    if (!parentId) {
      const file = await this.fileDao.queryById(fileId);

      let current = file ? JSON.parse(JSON.stringify(file)) : null;
      while (current && current.extName !== 'folder-project' && (checkModule ? current.extName !== 'folder-module' : true)) {
        if (current.parentId) {
          current = await this.fileDao.queryById(current.parentId);
        } else if (!current.groupId) {
          current = null;
          break;
        } else {
          break;
        }
      }

      // 我的
      if (!current) {
        return {
          code: 1,
          data: {
            id: 0,
            name: "我的",
            extName: "my-file",
            isMyFile: true,
            dataSource: (await this.fileDao.getMyFiles({ userId: creatorId })).map(item => {
              delete item.icon;
              item.isMyFile = true;
              item.parentIdPath = '0';
              return { ...item, isMyFile: true };
            }),
          },
        };
      } else if (current.extName === 'folder-project' || (checkModule ? current.extName === 'folder-module' : false)) {
        delete current.icon;
        return {
          code: 1,
          data: current
        };
      } else if (current.groupId) {
        const [group] = await this.userGroupDao.queryByIds({ ids: [current.groupId] });

        return { code: 1, data: { ...group, extName: 'group' } };
      } else {
        return { code: 1, data: null };
      }
    } else {
      const file = await this.fileDao.queryById(parentId);
      file && delete file.icon;

      return { code: 1, data: file };
    }
  }

  private async _getParentModuleAndProjectInfo(id: number) {
    let res = {
      groupId: null, // 协作组
      groupName: '',
      absoluteNamePath: '', // 理论上只是展示，没有别的意义
      absoluteIdPath: '' // 理论上只是展示，没有别的意义
    }
    const hierarchy = {}
    let pPointer: any = hierarchy;
    let qPointer: any = hierarchy;
    try {
      let count = 0;
      let tempItem = await this.fileDao.queryById(id)
      res.absoluteIdPath = `/${tempItem.id}`
      res.absoluteNamePath = `/${tempItem.name}.${tempItem.extName}`
      // 最多遍历七层
      while (tempItem?.parentId && count < 7) {
        count++;
        // 恶心兼容，等待完全删除
        tempItem = await this.fileDao.queryById(tempItem.parentId, [1, -1]);
        switch(tempItem.extName) {
          case 'folder': {
            qPointer.parent = {
              fileId: tempItem.id,
              isProject: true,
              parent: {}
            }
            pPointer = pPointer.parent;
            qPointer = pPointer;
            res.absoluteNamePath = `/${tempItem.name}${res.absoluteNamePath}`
            res.absoluteIdPath = `/${tempItem.id}${res.absoluteIdPath}`
            break;
          }
        }
      }
      if(!tempItem?.parentId && tempItem?.groupId) {
        // 补充协作组信息，作为文件的绝对路径
        const [coopGroupInfo] = await this.userGroupDao.queryByIds({ids: [tempItem?.groupId]})
        res.absoluteNamePath = `/${coopGroupInfo.name}${res.absoluteNamePath}`
        res.absoluteIdPath = `/${coopGroupInfo.id}${res.absoluteIdPath}`;
        res.groupId = coopGroupInfo.id;
        res.groupName = coopGroupInfo.name;
      }
      return res
    } catch (e) {
      throw e
    }
  }

  @Get("/getParentModuleAndProjectInfo")
  async getParentModuleAndProjectInfo(@Query() query) {

    const { id } = query;
    if (!id) {
      return {
        code: -1,
        msg: '缺少ID'
      }
    }
    try {
      let res = await this._getParentModuleAndProjectInfo(id)
      return {
        code: 1,
        data: res
      }
    } catch (e) {
      return {
        code: -1,
        msg: e.message
      }
    }
  }

  @Get("/getMyFiles")
  async getMyFiles(@Query() query) {
    const { userId: originUserId, parentId, extNames, status } = query
    const userId = await this.userService.getCurrentUserId(originUserId);
    const params: any = {
      userId,
      parentId,
      status
    }
    if (typeof extNames === 'string') {
      params.extNames = extNames.split(',')
    }

    const files = await this.fileDao.getMyFiles(params)
    // const userInfo = await this.userDao.queryById({ id: userId })

    return {
      code: 1,
      data: files.filter((item) => {
        // 不需要hasIcon字段了，全部是文件了，不是base64
        // const { hasIcon } = item
        // console.log(hasIcon)
        // if (hasIcon === "1") {
        //   item.icon = `/paas/api/workspace/getFileIcon?fileId=${item.id}`;
        // } else if (hasIcon.startsWith('http')) {
        //   // item.icon = hasIcon
        // }
        // 我的文件可以直接重写creatorName
        // item.creatorName = userInfo.name || userInfo.email

        return item.extName !== "component";
      }),
    }
  }

  @Get("/getGroupFiles")
  async getGroupFiles(@Query() query) {
    const { parentId, extNames, status, groupId } = query
    const params: any = {
      parentId,
      status,
      groupId
    }
    if (typeof extNames === 'string') {
      params.extNames = extNames.split(',')
    }

    const files = await this.fileDao.getGroupFiles(params)

    return {
      code: 1,
      data: files.filter((item) => {
        // 不需要hasIcon字段了，全部是文件了，不是base64
        // const { hasIcon } = item
        // if (hasIcon === "1") {
        //   item.icon = `/api/workspace/getFileIcon?fileId=${item.id}`;
        // } else if (hasIcon.startsWith('http')) {
        //   item.icon = hasIcon
        // }

        return item.extName !== "component";
      }),
    }
  }

  @Get("/getFolderProjectRoot")
  async getFolderProjectRoot(@Query() query) {
    let { fileId } = query
    let rootFile

    while (fileId) {
      rootFile = await this.fileDao.queryById(fileId)

      if (rootFile.extName === 'folder-project') {
        fileId = null
      } else {
        fileId = rootFile.parentId
      }
    }

    return {
      code: 1,
      data: rootFile
    }
  }

  @Get("/getFolderFiles")
  async getFolderFiles(@Query() query) {
    const { fileId, extNames } = query
    Logger.info(`[API][/paas/api/file/getFolderFiles]: extNames: ${extNames}`)

    const result = await this.fileDao.getFolderFiles({
      id: fileId,
      extNames
    })

    return {
      code: 1,
      data: result
    }
  }

  @Get("/getFilePath")
  async getFilePath(@Query() query) {
    const { fileId, groupId } = query;
    const path = [];

    if (fileId) {
      let [file] = await this.fileDao.getFiles({ id: fileId });

      const folderExtnames = ['folder', 'folder-project', 'folder-module']

      if (file) {
        let { extName, parentId, groupId } = file;

        if (folderExtnames.includes(extName)) {
          path.unshift(file);

          while (parentId) {
            file = await this.fileDao.queryById(parentId);
            parentId = file?.parentId;

            path.unshift(file);
          }

          if (groupId) {
            Logger.info(`[API][/paas/api/file/getFilePath]: 查一下协作组: ${groupId}`)
            const group = await this.userGroupDao.queryById({ id: groupId })

            path.unshift(group)
          }
        }
      }
    } else if (groupId) {
      const group = await this.userGroupDao.queryById({ id: groupId })
      path.unshift(group)
    }

    return {
      code: 1,
      data: path,
    };
  }


  @Post('/getLatestSave')
  async getLatestSave(@Body() body) {
    const { fileId }: { fileId: number } = body;
    if (!fileId) {
      return {
        code: -1,
        msg: '缺少fileId'
      }
    }
    const res = await this.fileContentDao.queryLatestSave({
      fileId: +fileId
    })
    return {
      code: 1,
      data: res
    }
  }

  @Post('/getLatestPub')
  async getLatestPub(@Body() body) {
    const { fileId, type }: { fileId: number, type: string } = body;
    if (!fileId) {
      return {
        code: -1,
        msg: '缺少fileId'
      }
    }
    const res = await this.filePubDao.getLatestPubByFileId(+fileId, type)
    return {
      code: 1,
      data: res
    }
  }

  @Post('/moveFile')
  async moveFile(
    @Body() body
  ) {
    const { fileId, toGroupId, toFileId }: { fileId: number, toGroupId: string, toFileId: number} = body;
    const res = await this.fileService.moveFile({
      fileId,
      toFileId,
      toGroupId,
    });
    return {
      code: 1,
      ...res,
    };
  }

  @Get('/publish/getVersionsByFileId')
  async publishGetVersionsByFileId(@Query() query) {
    const { id, pageIndex, pageSize } = query
    const versions = await this.filePubDao.queryByFileId({ fileId: id, limit: pageSize, offset: pageSize * pageIndex })

    return {
      code: 1,
      data: versions
    }
  }


  @Post('/share/mark')
  async shareMark(@Body() body) {
    const { id, userId, type }: { id: number, userId: string, type: string } = body;
    if (!id || !userId) {
      return {
        code: -1,
        msg: '缺少必要参数 id 或 userId'
      }
    }
    const file = await this.fileDao.queryById(id);
    let shareType = file?.shareType || 0;
    if (type === 'touristVisit') {
      shareType += 10;
    } else {
      shareType += 1;
    }
    const rtn = await this.fileDao.updateShare({
      id: id,
      shareType,
      updatorId: userId
    })
    return {
      code: rtn.affectedRows > 0 ? 1 : -1,
      msg: rtn.affectedRows <= 0 ? '分享失败' : ''
    }
  }


  @Post('/share/unmark')
  async shareUnmark(@Body() body) {
    const { id, userId, type }: { id: number, userId: string, type: string } = body;
    if (!id || !userId) {
      return {
        code: -1,
        msg: '缺少必要参数 id 或 userId'
      }
    }
    const file = await this.fileDao.queryById(id);
    let shareType = file?.shareType || 0;
    if (type === 'touristVisit') {
      shareType -= 10;
    } else {
      shareType -= 1;
    }
    const rtn = await this.fileDao.updateShare({
      id: id,
      shareType,
      updatorId: userId,
      updatorName: userId
    })
    return {
      code: rtn.affectedRows > 0 ? 1 : -1,
      msg: rtn.affectedRows <= 0 ? '取消分享失败' : ''
    }
  }

}
