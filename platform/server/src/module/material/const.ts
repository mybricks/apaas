/** 获取物料时，返回的代码类型 */
export enum CodeType {
  /** editor 会同时返回 editor、runtime */
  EDITOR = 'editor',
  /** runtime 只会返回运行函数 */
  RUNTIME = 'runtime',
  /** es module runtime */
  ES_RUNTIME = 'es_runtime',
  /** 小程序编译 */
  MP_RUNTIME = 'mp_runtime',
  /** vue runtime */
  VUE_RUNTIME = 'vue_runtime',
  /** 组件库 */
  COM_LIB = 'com_lib',
  /** 纯内容，无需处理 */
  PURE = 'pure'
}

export enum ComboType {
	/** 编辑态 */
	EDIT = 'edit',
	/** 运行时 */
	RT = 'rt',
}

/** 文件类型标识 */
export enum ExtName {
  COM_LIB = 'com_lib',
  COMPONENT = 'component',
  THEME = 'theme',
  /** 埋点 */
  SPM = 'spm'
}

/** 物料权限 */
export enum MaterialPowerType {
  /** 私有 */
  PRIVATE = 0,
  /** 公开 */
  PUBLIC = 1,
}


/** 物料类型，组件库/组件 */
export enum MaterialType {
  /** 组件库 */
  COM_LIB = 'comlib',
  /** 组件 */
  COMPONENT = 'component',
  PICTURE = 'picture',
  TEMPLATE = 'template',
  THEME = 'theme',
  /** 埋点 */
  SPM = 'spm'
}

export enum SceneType {
  /** 组件、组件库 */
  COMMON = '',
  /** 素材图片 */
  PICTURE = 'picture',
  /** 模板市场 */
  TEMPLATE = 'template',
}

/** 物料露出状态，-1-私有，0-workspace公开，1-全局公开 */
export enum MaterialScopeStatus {
  /** 私有 */
  PRIVATE = -1,
  /** workspace 局域公开 */
  WORKSPACE = 0,
  /** 全局公开 */
  PUBLIC = 1,
  /** 分享至中心化服务 */
  TOFAREND = 2,
  /** 来自中心化服务 */
  FROMFAREND = 3
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
