import {FC} from 'react'

import axios from 'axios'

import {getApiUrl, getUrlQuery} from '../utils'
import {FolderModule, FolderProject} from './../components'

/** 用户信息 */
export interface User {
  isAdmin?: boolean;
  /** id */
  id: number;
  /** 名称 */
  name?: string;
  /** 邮箱账号 */
  email: string;
  /** licenseCode */
  licenseCode: string;
}

interface IAppExport {
  name: string;
  path: string;
  type: string;
}

/** APP */
export interface T_App {
  /** 图标 */
  icon: string | ((...args: any) => JSX.Element);
  /** 应用类型类型: 系统、用户 */
  type: string;
  /** 搭建应用类型 */
  extName?: string;
  /** 标题 */
  title: string;
  /** 跳转链接 */
  homepage?: string;
  /** 唯一命名空间 */
  namespace: string;
  /** 描述 */
  description?: string;
  /** 应用版本 */
  version?: string;
  /** 应用设置 */
  setting?: string | any;
  /** 协作组设置 */
  groupSetting?: string | any;
  /** 应用导出设置 */
  exports?: IAppExport[];
 
  isInlineApp?: boolean;
  /** 前端使用，inlineApp 渲染 */
  Element?: FC;

  // 往前指定版本数量的版本信息
  previousList?: T_App[]

  // 文件打快照接口
  snapshot?: any
}

/** 只有管理员才能看见的模块namespaces */
const adminNameSpaces = []

const MYBRICKS_TEAM_USERS = [
  'charleszpq1995@gmail.com',
  'chemingjun@126.com',
  'chemingjun@kuaishou.com',
  'huangqiuyun03@kuaishou.com',
  'lianglihao@kuaishou.com',
  'liubiao03@kuaishou.com',
  'liulei11@kuaishou.com',
  'liuzhigang06@kuaishou.com',
  'tangxiaoxin@kuaishou.com',
  'yangxian05@kuaishou.com',
  'yankewen@kuaishou.com',
  'zhaoxing03@kuaishou.com',
  'zhulin08@kuaishou.com',
  'zhupengqiang@kuaishou.com',
  'zouyongsheng@kuaishou.com',
  'cocolbell@163.com',
  'stuzhaoxing@gmail.com',
  'admin@alialumni.com'
]

export default class AppCtx {

  urlQuery: any = {}
  locationSearch: string | null = null

  /** 用户信息 */
  user: null | User = null;
  /** 设置当前用户信息 */
  setUser(user: User | any) {
    this.user = user;
  }
  /** 系统配置 */
  systemConfig: any = null;
  setSystemConfig(config: any) {
    this.systemConfig = config;
  }

  // 已经安装了物料中心
  hasInstalledMaterialCenter: boolean = false

  // 安装的应用是否包含导入能力
  hasImportAbility: boolean = false

  getCurrentUserSystemConfig() {
    let config = {}
    try {
      let sysConfigObj = JSON.parse(this.systemConfig?.authConfig || '{}')
      // @ts-ignore
      const roleConfig = sysConfigObj[this.user?.role];
      if (roleConfig) {
        config = roleConfig
      }
    } catch(e) {
      console.log(e)
    }
    return config
  }

  /** 是否平台超级管理员 */
  isAdministrator: boolean = false
  /** 设置是否平台超级管理员 */
  setIsAdministrator = (bool: boolean) => {
    this.isAdministrator = bool
  }

  FolderAPPS: Array<any> = [
    {
      title: '文件夹',
      description: '文件夹',
      type: 'user',
      extName: 'folder',
      namespace: 'mybricks-folder',
      icon: './image/icon_folder.png',
    },
  ];
  /** 侧边栏应用列表 */
  DockerAPPS: Array<T_App> = [];
  /** 搭建应用列表：只有UI界面的才会展示 */
  DesignAPPS: Array<T_App> = [];
  /** 原始应用安装列表(接口请求获取) */
  InstalledAPPS: Array<T_App> = [];
  /** 快速检索App信息 */
  APPSMap: { [key: string]: T_App } = {};
  /** 设置各类应用 */
  setApps(apps: Array<T_App>) {
    /** 平台默认,搭建应用 */
    const DesignAPPS: Array<T_App> = [
      // 平台特殊应用特殊处理
    ];

    /** 平台默认,侧边栏应用 */
    const DockerAPPS: Array<any> = [
      {
        title: '大家的分享',
        description: '大家的分享',
        type: 'user',
        extName: 'share',
        namespace: 'share',
        icon: './image/icon_share.png'
      },
    ];

    const APPSMap: { [key: string]: T_App } = {};

    [
      {
        title: '项目文件夹',
        description: '通过项目的方式管理文件',
        type: 'user',
        extName: 'folder-project',
        namespace: 'mybricks-folder-project',
        icon: FolderProject
      },
      {
        title: '模块文件夹',
        description: '通过模块的方式管理文件',
        type: 'user',
        extName: 'folder-module',
        namespace: 'mybricks-folder-module',
        icon: FolderModule
      },
    ].forEach(app => {
      APPSMap[app.namespace] = app;
      APPSMap[app.extName] = app;
    })
    DesignAPPS.concat(this.FolderAPPS).forEach((app: T_App) => {
      APPSMap[app.namespace] = app;
      APPSMap[app.extName] = app;
    });

    apps.forEach((app: T_App) => {
      if(app.snapshot?.import) {
        this.hasImportAbility = true
      }
      /** 根据某个字段去做判断 */
      if (app.namespace === 'mybricks-material') {
        DockerAPPS.push(app);
        this.hasInstalledMaterialCenter = true
      } else {
        // 有UI界面的才会展示
        // @ts-ignore
        if(app._hasPage) {
          DesignAPPS.push(app);
        }
      }

      APPSMap[app.namespace] = app;
      APPSMap[app.extName] = app;
      if (!['system', 'user'].includes(app.type)) {
        APPSMap[app.type] = app;
      }
    });
    // 侧边栏应用
    this.DockerAPPS = DockerAPPS.filter(app => {
      const {extName, namespace} = app;
      APPSMap[app.namespace] = app;
      APPSMap[extName] = app;
      return this.isAdministrator ? true : !adminNameSpaces.includes(namespace)
    });
    // 原始安装应用列表
    this.InstalledAPPS = apps;
    this.APPSMap = APPSMap;

    if (!this.isAdministrator) {
      const BLACK_APPS_MAP  = {};
      const SHOW_FOLDERS_MAP = {
        'folder': true,
        // 'folder-project': true,// 这里比较恶心，私有化版本不能展示，但是现在展示逻辑由白名单改为了黑名单，所以这里直接写死指定用户才能看到，后续有需求再改
        // 'folder-module': true,
      }
      this.systemConfig?.appBlackList?.split(',')?.forEach(extName => {
        BLACK_APPS_MAP[extName] = true
        SHOW_FOLDERS_MAP[extName] = false
      })
      // 搭建应用
      this.DesignAPPS = DesignAPPS.filter(app => {
        return !BLACK_APPS_MAP[app.extName]
      });
      this.FolderAPPS = this.FolderAPPS.filter((app) => {
        return SHOW_FOLDERS_MAP[app.extName]
      })
      // console.log('111', this.user)
      if(this.user?.role >= 3) {
        // @ts-ignore
        this.FolderAPPS.push({
          title: '项目文件夹',
          description: '通过项目的方式管理文件',
          type: 'user',
          extName: 'folder-project',
          namespace: 'mybricks-folder-project',
          icon: FolderProject
        })
      }
    } else {
      // 搭建应用
      this.DesignAPPS = DesignAPPS;
    }
  }

  /** TODO:侧边栏相关操作 */
  sidebarInfo: {[key: string]: any} = {}

  refreshSidebar(namespace?: string) {
    return new Promise(async (resolve) => {
      const sideMenu = this.sidebarInfo[namespace || this.locationSearch]
      if (sideMenu?.open) {
        const items = await sideMenu.getFiles(sideMenu.id)
        sideMenu.items = items
      }
      resolve(true)
    })
  }

  /** 拖拽移动 */

  dragItem = null

  setDragItem(dragItem) {
    this.dragItem = dragItem
  }

  dropItem = null

  setDropItem(dropItem) {
    if (!this.dropItem || this.dropItem.id !== dropItem.id) {
      this.dropItem = dropItem
    }
  }

  fileMove(to, move, cbAry = []) {
    return new Promise(async (resolve, reject) => {
      if (!to) {
        reject('请选择要移入的协作组或文件夹')
        return
      }

      const { id, groupId } = to

      if (move.id === id) {
        reject(`目标文件夹${move.name}已被选中，无法移动`)
        return
      }

      const isGroup = typeof groupId === 'undefined'

      const data: any = {
        fileId: move.id,
      }

      if (isGroup) {
        data.toGroupId = id
      } else {
        data.toFileId = id
      }

      axios({
        method: 'post',
        url: getApiUrl('/api/file/moveFile'),
        data
      }).then(async ({data: {data: message}}) => {
        if (typeof message === 'string') {
          reject(message)
        } else {
          const refreshSiderAry = []
          if (['folder', 'folder-project', 'folder-module'].includes(move.extName)) {
            // 如果是文件夹
            // 移动位置
            if (data.toGroupId) {
              const sideMenu = this.sidebarInfo[`?appId=files&groupId=${id}`]
              if (sideMenu?.open) {
                refreshSiderAry.push(sideMenu)
              }
            } else {
              const sideMenu = this.sidebarInfo[`?appId=files&groupId=${groupId}&parentId=${id}`]
              if (sideMenu?.open) {
                refreshSiderAry.push(sideMenu)
              }
            }
            // 移出位置
            const sideMenu = this.sidebarInfo[`?appId=files${move.groupId ? `&groupId=${move.groupId}` : ''}${move.parentId ? `&parentId=${move.parentId}` : ''}`]
            if (sideMenu?.open) {
              refreshSiderAry.push(sideMenu)
            }
          }

          await Promise.all([
            ...cbAry.map((cb) => cb()),
            // await ctx.getAll(getUrlQuery()),
            ...refreshSiderAry.map((sideMenu) => {
              return new Promise(async (resolve) => {
                const items = await sideMenu.getFiles(sideMenu.id)
                sideMenu.items = items
                resolve(true)
              })
            })
          ])

          resolve('移动成功')
        }
      })
    })
  }
}