export interface Material {
	id: number;
	material_id: number;
	namespace: string;
	name: string;
	title: string;
	description?: string;
	icon?: string;
	preview_img?: string;
	version: string;
	type: string;
	creator_id: string;
	creator_name: string;
	create_time: number;
	updator_id: string;
	updator_name: string;
	update_time: number;
	commit_info: string;
	meta?: string;
	scope_status?: number;
}

export interface MaterialVersion {
	id: number;
	title: string;
	version: string;
	create_time: number;
	creator_name: string;
	creator_id: string;
}
export interface MaterialVersions {
	list: Array<MaterialVersion>;
	total: number;
}

/** 物料类型，组件库/组件 */
export enum MaterialType {
  /** 组件库 */
  COM_LIB = 'com_lib',
  /** 组件 */
  COMPONENT = 'component',
  /** 主题 */
  THEME = 'theme',

  PICTURE = 'picture',
}