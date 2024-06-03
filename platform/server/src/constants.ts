export const COOKIE_LOGIN_USER = `mybricks-login-user`;

/** 获取物料时，返回的代码类型 */
export enum CodeType {
  /** editor 会同时返回 editor、runtime */
  EDITOR = "editor",
  /** es module runtime */
  ES_RUNTIME = "es_runtime",
  /** runtime 只会返回运行函数 */
  RUNTIME = "runtime",
}

/** 文件类型标识 */
export enum ExtName {
  COM_LIB = "com_lib",
  COMPONENT = "component",
  PC_PAGE = "pc-page",
  CLOUD_COM = "cloud-com",
  WORK_FLOW = "workflow",
}

/** 物料露出状态，-1-私有，0-workspace公开，1-全局公开 */
export enum MaterialScopeStatus {
  /** 私有 */
  PRIVATE = -1,
  /** workspace 局域公开 */
  WORKSPACE = 0,
  /** 全局公开 */
  PUBLIC = 1,
}

/** 生效状态 */
export enum EffectStatus {
  /** 删除 */
  DELETE = -1,
  /** 禁用 */
  DISABLED = 0,
  /** 生效中 */
  EFFECT = 1,
}

export const TaskTypeMap = {
  IMMEDIATE: 1,
  NORMAL: 2,
};

export const RunningStatusMap = {
  RUNNING: 1,
  RUNNING_WITH_ERROR: 11,
  STOPPED: -1,
};

export const STATUS_CODE = {
  SUCCESS: 1,
  LOGIN_OUT_OF_DATE: 100001, 
}

export const USER_ROLE = {
  GUEST: 1, // 游客
  NORMAL: 2, // 普通用户
  NORMAL_PROJECT: 3, // 普通-能查看项目
  ADMIN: 10 // 超管
}

export const USER_LOG_TYPE = {
  APPS_INSTALL_LOG: 9, // 应用安装日志
  APPS_UNINSTALL_LOG: 30, // 应用卸载日志
  PLATOFRM_INSTALL_LOG: 10, // 平台安装日志
  AI_CHATTOPAGE_LOG: 20, // AI生成页面日志
  PAGE_CHANGE_LOG: 40, // 页面保存日志
}

export const TIMEOUT_TIME = 60 * 1000;


/** 最大日志内容 ，24kb */
export const maxLogRowContent = 1024 * 24

/** 最大近似中文数 */
export const maxAboutWord = 10000 // 使用  maxLogRowContent / 2