import { FC } from 'react';

export interface T_AppState {
  user: T_User
  systemConfig: any
  hasInstalledMaterialCenter: boolean

  isAdministrator: boolean
}

/** 用户信息 */
export interface T_User {
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

interface T_AppExport {
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
  exports?: T_AppExport[];
 
  isInlineApp?: boolean;
  /** 前端使用，inlineApp 渲染 */
  Element?: FC;

  // 往前指定版本数量的版本信息
  previousList?: T_App[]

  // 文件打快照接口
  snapshot?: any
}