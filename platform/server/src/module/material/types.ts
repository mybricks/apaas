/** 创建组件时，组件项类型 */
import { EffectStatus, ExtName, MaterialScopeStatus } from './const';

export type AnyType = any;

/** 创建标签参数 */
export interface CreateTagParams {
  order: number;
  title: string;
  scene_id: number;
  creator_id: string;
  parent_id?: number;
}

export interface CreateMaterialComponent {
  /** 组件名 */
  title: string;
  /** 命名空间，workspace 下全局唯一 */
  namespace: string;
  /** 版本 */
  version: string;
  /** 描述信息 */
  description: string;
  /** 缩略图 */
  icon?: string;
  /** 预览图 */
  previewImg?: string;
  /** 运行代码 */
  runtime: string;
  /** 编辑项代码 */
  editors: string;
	upgrade: string;
  /** 输入 */
  inputs: string;
  /** 输出 */
  outputs: string;
  /** 初始数据 */
  data: string;
  /** 云组件依赖项 */
  deps: Array<Record<string, unknown>>;
  /** 发布信息 */
  commitInfo?: string;
  /** 编辑项代码 sourcemap，保留字段 */
  editorsSourceMap?: string;
  /** 运行代码 sourcemap，保留字段 */
  runtimeSourceMap?: string;
  /** 开发者id */
  author?: string;
  /** 开发者名称 */
  author_name?: string;
  /** 插槽 */
  slots?: string;
  /** 接入ai能力 */
  ai?: string;
  /** 出码 */
  target?: {
    toReact?: string;
  };
  /** 预览图 */
  preview?: string;
  /** TODO */
  /** 小程序代码片段，例如使用到js计算等 */
  codeArray?: Array<{id: string, code: string}>
  /** 小程序组件运行时代码 */
  mpruntime?: string;
  tags?: string[];
  /** 中后台组件使用 */
  schema?: AnyType;
  /** 云组件 toJson */
  toJson?: string | AnyType;
  /** 云组件特有，发布测试版本 */
  isBeta?: boolean;
  /** 组件的类型 */
  rtType?: boolean;
  /** 元数据 */
  meta?: string;
}

/** 发布组件库时参数 */
export interface CreateComLibParams {
  /** 组件库名称 */
  title: string
  /** 组件库文件 ID */
  fileId: number;
	namespace: string;
  /** 用户邮箱 */
  userId: string;
  /** 组件库版本 */
  version?: string;
  /** 发布日志 */
  commitInfo: string;
  /** 组件库编辑器时运行代码 */
  comLibEditor: string;
  /** 组件库运行时代码 */
  comLibRuntime: string;
  /** 组件库编辑器时运行代码 sourcemap，保留 */
  comLibEditorMap?: string;
  /** 组件库运行时代码 sourcemap，保留 */
  comLibRuntimeMap?: string;
  tags?: string[];
}

/** 发布组件时参数 */
export interface CreateComponentParams {
  /** 组件列表 */
  components: CreateMaterialComponent[];
  /** 用户邮箱 */
  userId: string;
  /** 组件场景，PC、H5 */
  sceneType: string;
  /** 是否是云组件 */
  isCloudComponent?: boolean;
	config: Record<string, unknown>;
}

export type WillCreateTemplate = Omit<
  WillConvertMaterial,
  'ext_name' | 'icon' | 'docs' | 'description'
> & {
  tag_ids: number[];
  is_template_guide: boolean;
  type: string;
  sort: number;
};

export interface WillUpdateMaterialRelation {
  material_id: number;
  updator_name: string;
  updator_id: string;
  scene_id?: number;
  tag_ids?: number[];
  key_info?: string;
  power_type?: MaterialPowerType;
  status?: EffectStatus;
  meta?: string;
  title?: string;
  preview_img?: string;
}

/** sql 查询出来将转换为物料中心物料的元数据 */
export interface WillConvertMaterial {
  /** 文件 id */
  id: number;
  namespace: string;
  /** 场景 id: comlib / component */
  ext_name: string;
  /** 物料发布记录 id */
  file_pub_id: number;
  /** 物料版本 */
  version: string;
  title: string;
  icon?: string;
  docs?: string;
  preview_img?: string;
  description?: string;
  creator_id: string;
  creator_name: string;
  create_time: number;
  scene_id?: number;
  key_info?: string;
  power_type?: MaterialPowerType | string;
  meta?: string;
}

/** 物料权限 */
export enum MaterialPowerType {
  /** 私有 */
  PRIVATE = 0,
  /** 公开 */
  PUBLIC = 1,
}

export interface Material {
  id: number;
  title: string;
  material_id: number;
  material_pub_id: number;
  scope_status: MaterialScopeStatus;
  type: ExtName;
  namespace: string;
  version: string;
  content: string;
  meta?: string;
  preview_img?: string;
  icon?: string;
  creator_id: string;
  creator_name: string;
  scene_id: number;
  tags: string[]
}

/** sql 响应值 */
export interface TagSQLRes {
  type: string;
  id: number;
  title: string;
  /** 场景 id */
  sceneId: number;
  scene_id: number;
  parent_id: number | null;
  /** 排序 */
  order: number;
  create_time: number;
  creator_id: string;
  update_time: number;
  updator_id: string;
}

export interface TagRelation {
  id: number;
  material_id: number;
  tag_id: number;
  title: string;
}

export interface MaterialPub {
  id: number;
  material_id: number;
  version: string;
  content: string;
  namespace: string;
  type: ExtName;
}

export interface ComponentForCreateComLib {
	namespace: string;
	version: string;
}

/** 创建场景参数 */
export interface CreateSceneParams {
  order: number;
  title: string;
  creator_id: string;
  type: string;
}