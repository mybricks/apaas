import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@mybricks/rocker-commons';
import { isEmpty, isNil, isNumber, omit, pick, uniq, uniqBy } from 'lodash';
import * as axios from 'axios';
import * as FormData from 'form-data';
const AdmZip = require('adm-zip')
// @ts-ignore
import API from '@mybricks/sdk-for-app/api';
import { generateExecutableCode } from 'generate-mybricks-component-library-code';
import MaterialDao from './material.dao';
import {
	AnyType,
	ComponentForCreateComLib,
	CreateComLibParams,
	CreateComponentParams,
	Material,
	WillConvertMaterial,
	WillCreateTemplate,
	WillUpdateMaterialRelation,
} from './types';
import {
	CodeType,
	ComboType,
	EffectStatus,
	ExtName,
	MaterialPowerType,
	MaterialScopeStatus,
	MaterialType,
	SceneType,
} from './const';
import {
	checkIsAllowSelect
} from './utils';
import {
	getNextVersion,
	getRealDomain,
	safeDecodeURIComponent,
	safeEncodeURIComponent,
	safeParse,
} from './../../utils';
import { getEditJsFile } from './genenate-com-lib-soucecode';
import { randomInt } from 'crypto';

const centralAPIBaseURL = 'https://my.mybricks.world';

const _axios = axios as AnyType;
@Injectable()
export default class MaterialService {
  @Inject(MaterialDao)
	private readonly materialDao: MaterialDao;

  async createComLib(params: CreateComLibParams) {
  	const {
  		userId,
  		fileId,
  		title,
  		comLibEditor,
  		comLibRuntime,
  		namespace: originNamespace,
  		tags = [],
  	} = params;

  	const namespace = originNamespace || `_com_lib__${fileId}`;

  	const [existMaterial] =
      await this.materialDao.getLatestMaterialsByNamespace({
      	namespaces: [namespace],
      });
  	let curMaterialId = existMaterial?.material_id;

  	if (!existMaterial) {
  		const { id: materialId } = await this.materialDao.batchCreate([
  			{
  				title: title,
  				namespace,
  				version: '1.0.0',
  				creatorId: userId,
  				creatorName: userId,
  				type: ExtName.COM_LIB,
  				scopeStatus: MaterialScopeStatus.PUBLIC,
  				icon: '',
  				previewImg: '',
  				description: '',
  			},
  		]);
  		curMaterialId = materialId;

  		await this.materialDao.createPub({
  			version: '1.0.0',
  			materialId,
  			creatorId: userId,
  			creatorName: userId,
  			content: JSON.stringify({
  				editJs: safeEncodeURIComponent(comLibEditor ?? ''),
  				rtJs: safeEncodeURIComponent(comLibRuntime ?? ''),
  			}),
  		});
  	} else {
  		/** pub 记录 */
  		await this.materialDao.createPub({
  			version: getNextVersion(existMaterial.version),
  			materialId: existMaterial.material_id,
  			creatorId: userId,
  			creatorName: userId,
  			content: JSON.stringify({
  				editJs: safeEncodeURIComponent(comLibEditor ?? ''),
  				rtJs: safeEncodeURIComponent(comLibRuntime ?? ''),
  			}),
  		});

  		/** 更新物料记录 */
  		await this.materialDao.update(
  			{ id: existMaterial.material_id },
  			{
  				updatorId: userId,
  				updatorName: userId,
  				title: title,
  				version: getNextVersion(existMaterial.version),
  			},
  		);
  	}
  	await this.handleMaterialTags(curMaterialId, tags);

  	return {
  		code: 1,
  		data: {},
  		message: '发布成功',
  	};
  }

  async createComponents(params: CreateComponentParams) {
  	const { components, userId, isCloudComponent, config, sceneType } = params;
  	Logger.info(
  		`[物料中心组件发布] ${isCloudComponent ? '是' : '非'}云组件发布`,
  	);
  	const scenes = await this.materialDao.getScene(EffectStatus.EFFECT);
  	const curScene = scenes.find((s) => s.type === sceneType);
  	Logger.info(`[物料中心组件发布] 当前场景: ${curScene}`);

  	const needSelectMaterial = components.filter((com) => !!com.version);
  	const existMaterialVersions = needSelectMaterial.length
  		? await this.materialDao.getMaterialsByNamespace_Version(
  			needSelectMaterial,
  		)
  		: [];

  	Logger.info('[物料中心组件发布] 查询已存在物料版本');

  	const existMaterials = await this.materialDao.getLatestMaterialsByNamespace(
  		{ namespaces: components.map((com) => com.namespace) },
  	);

  	Logger.info('[物料中心组件发布] 查询已存在物料');

  	/** 将要插入新纪录的组件 */
  	const willInsertComponents = components.filter((com) => {
  		return !existMaterials.find((m) => m.namespace === com.namespace);
  	});
  	/** 将要修改纪录的组件 */
  	const willUpdateComponents = components.filter((com) => {
  		return !!existMaterials.find((m) => m.namespace === com.namespace);
  	});
  	const success = [];

  	/** 插入新纪录 */
  	for (const willInsertComponent of willInsertComponents) {
  		let curVersion =
        willInsertComponent.version ??
        (willInsertComponent.isBeta ? '1.0.0-beta.1' : '1.0.0');
  		/** 物料插入 */
  		const { id: materialId } = await this.materialDao.batchCreate([
  			{
  				title: willInsertComponent.title,
  				namespace: willInsertComponent.namespace,
  				version: curVersion,
  				creatorId: userId,
  				creatorName: userId,
  				type: ExtName.COMPONENT,
  				icon: willInsertComponent.icon ?? '',
  				previewImg: willInsertComponent.previewImg ?? '',
  				description: willInsertComponent.description ?? '',
  				scopeStatus: MaterialScopeStatus.PUBLIC,
  				sceneId: curScene?.id,
  			},
  		]);

  		Logger.info(
  			`[物料中心组件发布] 插入物料: ${willInsertComponent.namespace} ${curVersion}`,
  		);

  		/** pub 记录 */
  		await this.materialDao.createPub({
  			version: curVersion,
  			materialId,
  			creatorId: userId,
  			creatorName: userId,
  			content: JSON.stringify({
  				title: willInsertComponent.title,
  				namespace: willInsertComponent.namespace,
  				rtType:willInsertComponent.rtType,
  				version: willInsertComponent.version,
  				description: willInsertComponent.description,
  				author: willInsertComponent.author,
  				author_name: willInsertComponent.author_name,
  				data: willInsertComponent.data,
  				runtime: safeEncodeURIComponent(willInsertComponent.runtime ?? ''),
  				editors: safeEncodeURIComponent(willInsertComponent.editors ?? ''),
  				outputs: willInsertComponent.outputs,
  				inputs: willInsertComponent.inputs,
  				slots: willInsertComponent.slots,
  				ai: safeEncodeURIComponent(willInsertComponent.ai ?? ''),
  				upgrade: safeEncodeURIComponent(willInsertComponent.upgrade ?? ''),
  				'runtime.edit': safeEncodeURIComponent(
  					willInsertComponent['runtime.edit'] ?? '',
  				),
  				'runtime.vue': safeEncodeURIComponent(
  					willInsertComponent['runtime.vue'] ?? '',
  				),
  				target: {
  					toReact: safeEncodeURIComponent(
  						willInsertComponent.target?.toReact ?? '',
  					),
  				},
  				preview: willInsertComponent.preview,
  				codeArray: willInsertComponent.codeArray,
  				mpruntime: safeEncodeURIComponent(
  					willInsertComponent.mpruntime ?? '',
  				),
  				deps: willInsertComponent.deps,
  				schema: willInsertComponent.schema,
  				toJson: willInsertComponent.toJson,
  				isCloudComponent,
  			}),
  		});

  		Logger.info(
  			`[物料中心组件发布] 插入发布记录: ${materialId} ${curVersion}`,
  		);

  		await this.handleMaterialTags(materialId, willInsertComponent.tags || []);
  		success.push({
  			namespace: willInsertComponent.namespace,
  			version: curVersion,
  		});

  		Logger.info('[物料中心组件发布] 处理标签');
  	}

  	const fails = [];
  	/** 已有对应版本的组件，只需更新 */
  	for (let willUpdateComponent of willUpdateComponents) {
  		// if (existMaterialVersions.find(m => m.namespace === willUpdateComponent.namespace && m.version === willUpdateComponent.version)) {
  		// 	fails.push({
  		// 		namespace: willUpdateComponent.namespace,
  		// 		version: willUpdateComponent.version,
  		// 		error: `该组件 ${willUpdateComponent.version} 已存在`
  		// 	});
  		// 	continue;
  		// }
  		const material = existMaterials.find(
  			(m) => m.namespace === willUpdateComponent.namespace,
  		);

  		/** 对应版本物料已存在时 */
  		const existMaterialVersion = existMaterialVersions.find(
  			(m) =>
  				m.namespace === willUpdateComponent.namespace &&
          willUpdateComponent.version &&
          m.version === willUpdateComponent.version,
  		);

  		if (existMaterialVersion) {
  			/** pub 记录 */
  			await this.materialDao.updatePub(
  				{
  					materialId: existMaterialVersion.material_id,
  					version: existMaterialVersion.version,
  				},
  				{
  					content: JSON.stringify({
  						title: willUpdateComponent.title,
  						rtType:willUpdateComponent.rtType,
  						namespace: willUpdateComponent.namespace,
  						version: willUpdateComponent.version,
  						description: willUpdateComponent.description,
  						author: willUpdateComponent.author,
  						author_name: willUpdateComponent.author_name,
  						data: willUpdateComponent.data,
  						runtime: safeEncodeURIComponent(
  							willUpdateComponent.runtime ?? '',
  						),
  						editors: safeEncodeURIComponent(
  							willUpdateComponent.editors ?? '',
  						),
  						outputs: willUpdateComponent.outputs,
  						inputs: willUpdateComponent.inputs,
  						slots: willUpdateComponent.slots,
  						ai: safeEncodeURIComponent(willUpdateComponent.ai ?? ''),
  						upgrade: safeEncodeURIComponent(
  							willUpdateComponent.upgrade ?? '',
  						),
  						'runtime.edit': safeEncodeURIComponent(
  							willUpdateComponent['runtime.edit'] ?? '',
  						),
  						'runtime.vue': safeEncodeURIComponent(
  							willUpdateComponent['runtime.vue'] ?? '',
  						),
  						target: {
  							toReact: safeEncodeURIComponent(
  								willUpdateComponent.target?.toReact ?? '',
  							),
  						},
  						preview: willUpdateComponent.preview,
  						codeArray: willUpdateComponent.codeArray,
  						mpruntime: safeEncodeURIComponent(
  							willUpdateComponent.mpruntime ?? '',
  						),
  						deps: willUpdateComponent.deps,
  						schema: willUpdateComponent.schema,
  						toJson: willUpdateComponent.toJson,
  						isCloudComponent,
  					}),
  					updatorId: userId,
  					updatorName: userId,
  				},
  			);
  		} else {
  			if (willUpdateComponent.isBeta) {
  				const [[mainVersion], [branchVersion]] = await Promise.all([
  					this.materialDao.getMaterialVersions({
  						namespace: willUpdateComponent.namespace,
  					}),
  					this.materialDao.getMaterialVersions({
  						namespace: willUpdateComponent.namespace,
  						isBranch: true,
  					}),
  				]);

  				if (!branchVersion) {
  					// 分支版本不存在
  					willUpdateComponent.version = mainVersion.version + '-beta.1';
  				} else if (!mainVersion) {
  					// 主版本不存在
  					const [mainVersion, versionNum = 0] =
              branchVersion.version.split('-beta.');
  					willUpdateComponent.version =
              mainVersion + '-beta.' + (+versionNum + 1);
  				} else if (
  					branchVersion.version.startsWith(mainVersion.version + '-beta.')
  				) {
  					// 主版本相同
  					const [mainVersion, versionNum = 0] =
              branchVersion.version.split('-beta.');
  					willUpdateComponent.version =
              mainVersion + '-beta.' + (+versionNum + 1);
  				} else if (checkIsAllowSelect(mainVersion, branchVersion)) {
  					// 比较是否主版本更大
  					willUpdateComponent.version = mainVersion.version + '-beta.1';
  				} else {
  					// 主版本小，分支版本更大
  					const [mainVersion, versionNum = 0] =
              branchVersion.version.split('-beta.');
  					willUpdateComponent.version =
              mainVersion + '-beta.' + (+versionNum + 1);
  				}
  			} else {
  				if (!/^(\d+)\.(\d+)\.(\d+)$/.test(material.version)) {
  					const [mainVersion] = await this.materialDao.getMaterialVersions({
  						namespace: willUpdateComponent.namespace,
  					});

  					if (mainVersion) {
  						material.version = mainVersion.version;
  					} else {
  						material.version = '0.99.99';
  					}
  				}
  				willUpdateComponent.version = getNextVersion(material.version);
  			}
  			const content = JSON.stringify({
  				title: willUpdateComponent.title,
  				namespace: willUpdateComponent.namespace,
  				version: willUpdateComponent.version,
  				description: willUpdateComponent.description,
  				author: willUpdateComponent.author,
  				author_name: willUpdateComponent.author_name,
  				data: willUpdateComponent.data,
  				runtime: safeEncodeURIComponent(willUpdateComponent.runtime ?? ''),
  				editors: safeEncodeURIComponent(willUpdateComponent.editors ?? ''),
  				outputs: willUpdateComponent.outputs,
  				inputs: willUpdateComponent.inputs,
  				slots: willUpdateComponent.slots,
  				ai: safeEncodeURIComponent(willUpdateComponent.ai ?? ''),
  				upgrade: safeEncodeURIComponent(willUpdateComponent.upgrade ?? ''),
  				'runtime.edit': safeEncodeURIComponent(
  					willUpdateComponent['runtime.edit'] ?? '',
  				),
  				'runtime.vue': safeEncodeURIComponent(
  					willUpdateComponent['runtime.vue'] ?? '',
  				),
  				target: {
  					toReact: safeEncodeURIComponent(
  						willUpdateComponent.target?.toReact ?? '',
  					),
  				},
  				preview: willUpdateComponent.preview,
  				codeArray: willUpdateComponent.codeArray,
  				mpruntime: safeEncodeURIComponent(
  					willUpdateComponent.mpruntime ?? '',
  				),
  				rtType: willUpdateComponent.rtType,
  				deps: willUpdateComponent.deps,
  				schema: willUpdateComponent.schema,
  				toJson: willUpdateComponent.toJson,
  				isCloudComponent,
  			});
  			/** pub 记录 */
  			await this.materialDao.createPub({
  				version: willUpdateComponent.version,
  				materialId: material.id,
  				creatorId: userId,
  				creatorName: userId,
  				content,
  			});

  			if (material.scope_status === MaterialScopeStatus.TOFAREND) {
  				const domainName = centralAPIBaseURL;

  				try {
  					await _axios.post(`${domainName}/central/api/channel/gateway`, {
  						action: 'material_publishVersion',
  						payload: {
  							scene_type: 'PC',
  							name: material.title,
  							...material,
  							creator_id: userId,
  							creator_name: userId,
  							version: willUpdateComponent.version,
  							content,
  							tags: willUpdateComponent.tags || [],
  						},
  					});
  				} catch {}
  			}
  		}

  		/** 发布的是主版本 */
  		if (/^(\d+)\.(\d+)\.(\d+)$/.test(willUpdateComponent.version)) {
  			/** 更新物料记录 */
  			await this.materialDao.update(
  				{ id: material.id },
  				{
  					updatorId: userId,
  					updatorName: userId,
  					title: willUpdateComponent.title,
  					icon: willUpdateComponent.icon,
  					version: willUpdateComponent.version,
  					description: willUpdateComponent.description,
  					previewImg: willUpdateComponent.previewImg,
  					sceneId: curScene?.id,
  				},
  			);
  		} else {
  			const [mainVersion] = await this.materialDao.getMaterialVersions({
  				namespace: willUpdateComponent.namespace,
  			});

  			/** 没发布过主版本 */
  			if (!mainVersion) {
  				/** 更新物料记录 */
  				await this.materialDao.update(
  					{ id: material.id },
  					{
  						updatorId: userId,
  						updatorName: userId,
  						title: willUpdateComponent.title,
  						icon: willUpdateComponent.icon,
  						version: willUpdateComponent.version,
  						description: willUpdateComponent.description,
  						previewImg: willUpdateComponent.previewImg,
  						sceneId: curScene?.id,
  					},
  				);
  			}
  		}

  		await this.handleMaterialTags(
  			material.id,
  			willUpdateComponent.tags || [],
  		);

  		success.push({
  			namespace: willUpdateComponent.namespace,
  			version: willUpdateComponent.version,
  		});
  	}

  	if (config.comlib) {
  		const configMap = await API.Setting.getSetting(['mybricks-material']);
  		const curConfig = configMap?.['mybricks-material']?.config ?? {};
  		const cdnUploadUrl = curConfig.cdnUploadUrl;
  		if (!cdnUploadUrl) {
  			return {
  				code: 0,
  				message: '请联系平台管理员配置物料中心的CDN上传接口',
  			};
  		} else {
  			const { tree, title, namespace } = config.comlib as {
          title: string;
          namespace: string;
          tree: [];
        };

  			// @ts-ignore
  			const { editCode, runtimeCode } = generateExecutableCode(
  				components as AnyType,
  				tree,
  				{ title, namespace },
  			);

  			const [edit, runtime] = (await Promise.all(
  				[
  					{ code: editCode, fileName: 'edit.js' },
  					{ code: runtimeCode, fileName: 'runtime.js' },
  				].map(({ code, fileName }) => {
  					// @ts-ignore
  					const form = new FormData();
  					form.append('file', Buffer.from(code), fileName);

  					return new Promise((resolve) => {
  						_axios
  							.post(cdnUploadUrl, form, {
  								headers: form.getHeaders(),
  								maxContentLength: Infinity,
  								maxBodyLength: Infinity,
  							})
  							.then(({ data }) => {
  								resolve(data);
  							});
  					});
  				}),
  			)) as Array<{ code: number; data: { url: string }; message: string }>;

  			if (
  				edit.code === 1 &&
          edit.data?.url &&
          runtime.code === 1 &&
          runtime.data?.url
  			) {
  				await this.createComLib({
  					userId,
  					title,
  					comLibEditor: edit.data.url,
  					comLibRuntime: runtime.data.url,
  					namespace,
  					commitInfo: '',
  					fileId: 0,
  				});

  				return {
  					code: 1,
  					data: {
  						edit,
  						runtime,
  					},
  					message: '发布成功',
  				};
  			} else {
  				return {
  					code: 0,
  					data: {
  						edit,
  						runtime,
  					},
  					message: `上传CDN失败，当前配置上传地址为"${cdnUploadUrl}"，请检查...`,
  				};
  			}
  		}
  	}

  	return {
  		code: 1,
  		data: { fails, success },
  		message: '发布成功',
  	};
  }

  async getContentByNamespace_Version(
  	namespace: string,
  	version: string,
  	codeType: CodeType,
  ) {
  	// 没有version或者version值为latest，查询最新版本
  	const [data] = (version && version !== 'latest')
  		? await this.materialDao.getContentByNamespace_Version(namespace, version)
  		: ((await this.materialDao.getLatestMaterialByNamespaceOfMainBranch({
  			namespace,
  			needContent: true,
  		})) as AnyType[]);
  	const materialInfo = await this.materialDao.getMaterialByNamespace(namespace);
  	const tag = this.materialDao.getTags({
  		status: 1,
  		sceneId: materialInfo.sceneId
  	});
  	data.tag = tag;
  	if (codeType !== CodeType.PURE) {
  		const content = safeParse(data.content);
  		delete data.content;

  		if (codeType === CodeType.RUNTIME) {
  			data.runtime = safeDecodeURIComponent(
  				content.runtime ?? content.runtimeCode,
  			);
  		} else if (codeType === CodeType.VUE_RUNTIME) {
  			data.runtime = safeDecodeURIComponent(content['runtime.vue'] ?? '');
  		} else if (codeType === CodeType.ES_RUNTIME) {
  			data.esRuntime = safeDecodeURIComponent(content.esRuntime);
  		} else if (codeType === CodeType.EDITOR) {
  			Object.keys(content).forEach((key) => {
  				if (
  					[
  						'runtime',
  						'editors',
  						'editJs',
  						'rtJs',
  						'coms',
  						'namespace',
  						'version',
  						'title',
  						'description',
  						'author',
  						'author_name',
  						'editors',
  						'ai',
  						'upgrade',
  						'runtime.edit',
  						'runtime.vue',
  						'mpruntime',
  					].includes(key)
  				) {
  					data[key] = safeDecodeURIComponent(content[key]);
  				} else if (key === 'schema') {
  					data[key] = safeParse(safeDecodeURIComponent(content[key]));
  				} else if (key !== 'esRuntime') {
  					data[key] =
              typeof content[key] === 'string'
              	? safeParse(content[key])
              	: content[key];
  				}
  			});
  		} else if (codeType === CodeType.MP_RUNTIME) {
  			data.mpruntime = safeDecodeURIComponent(content.mpruntime);
  			data.codeArray = content.codeArray;
  			data.deps = content.deps;
  		} else if (codeType === CodeType.COM_LIB) {
  			data.content = content;
  		}
  	}

  	return { code: 1, data, message: 'success' };
  }

  async getMaterials(params: {
    pageSize: number;
    page: number;
    keyword?: string;
    userId?: string;
    scene?: string;
    tags?: string[];
    type: ExtName[];
    status?: EffectStatus[];
    scopeStatus?: MaterialScopeStatus[];
		materialIds?: string[];
  }) {
		if (params.materialIds) {
			const list = await this.materialDao.getMaterialListByMaterialId(params.materialIds);
			return {
				list, total: list.length
			}
		}
  	const currentParams = {
  		...params,
  		offset: (params.page - 1) * params.pageSize,
  	};

  	if (params.scene) {
  		const [curScene] = await this.materialDao.getScene(EffectStatus.EFFECT, [
  			params.scene,
  		]);
  		delete currentParams.scene;

  		if (curScene) {
  			currentParams.scene = curScene.id;
  		} else {
  			return { list: [], total: 0 };
  		}
  	}

  	if (currentParams.tags?.length) {
  		const tags = await this.materialDao.getTags({
  			status: EffectStatus.EFFECT,
  		});
  		currentParams.tags = currentParams.tags
  			.map((name) => tags.find((tt) => tt.title === name)?.id)
  			.filter(Boolean) as AnyType;

  		if (!currentParams.tags?.length) {
  			currentParams.tags = undefined;
  		}
  	}

  	const [list, total] = await Promise.all([
  		this.materialDao.getMaterials(currentParams),
  		this.materialDao.getMaterialsTotal(currentParams),
  	]);

  	list.forEach(item => {
  		if (typeof item.tags === 'string') {
  			item.tags = (item.tags as string).split(',');
  		}
  	});

  	const betaMaterials = list.filter(
  		(item) => !/^(\d+)\.(\d+)\.(\d+)$/.test(item.version),
  	);

  	if (betaMaterials.length) {
  		const branchMaterials = (
  			await Promise.all(
  				betaMaterials.map((item) => {
  					return this.materialDao.getLatestMaterialByNamespaceOfMainBranch({
  						namespace: item.namespace,
  						status: EffectStatus.EFFECT,
  					});
  				}),
  			)
  		).reduce((pre, item) => [...pre, ...item], []);

  		branchMaterials.forEach((branchMaterial) => {
  			const index = list.findIndex(
  				(item) => item.namespace === branchMaterial.namespace,
  			);

  			if (index !== -1) {
  				list[index].version = branchMaterial.version;
  			}
  		});
  	}

  	return { list, total: total[0]?.total ?? 0 };
  }

  async getTags(params: {
    status: EffectStatus;
    sceneId?: number;
    isCategory?: boolean;
  }) {
  	return await this.materialDao.getTags({
  		...params,
  		checkCategory: isNil(params.isCategory) ? undefined : true,
  	});
  }

  async createTag(params: any[], isCategory: boolean) {
  	await this.materialDao.createTag(
  		params.map((item) => ({
  			...item,
  			create_time: Date.now(),
  			parent_id: isCategory ? null : item.parent_id ?? 0,
  		})),
  	);
  }

  async deleteTag(tagId: number) {
  	return await this.materialDao.deleteTag(tagId);
  }

  async updateTag(params: {
    title: string;
    id: number;
    updator_id: string;
    status: EffectStatus;
    order: number;
    scene_id: number;
    parent_id: number | null;
  }) {
  	return await this.materialDao.updateTag(params);
  }

  /** 组件资源 combo start --------------- */

  /** 生成组件代码，用于组成组件库 */
  async getComponentsCode(materials: Material[], comboType: ComboType) {
  	const temp = {};
  	const isRT = comboType === ComboType.RT;
  	materials.forEach((item) => {
  		try {
  			const { material_id, material_pub_id } = item;
  			const component = {
  				...item,
  				id: material_id,
  				content: JSON.parse(item.content),
  			};

  			// component?.content?.editors && component?.content?.runtime

  			if (component?.content?.runtime) {
  				const {
  					content: {
  						runtime,
  						editors,
  						ai,
  						upgrade,
  						'runtime.edit': runtimeEdit,
  						target,
  						deps = [],
  					},
  				} = component;
  				temp[material_pub_id] = {
  					...component,
  					materialId: material_id,
  					content: {
  						deps,
  						editCode: encodeURIComponent(`
              window.fangzhouComDef = {default: {
                title: '${component.title}',
                namespace: '${component.namespace}',
                ${
	isRT
		? ''
		: `
	                previewImg: '${component.preview_img}',
	                icon: '${component.icon}',
                `
}
                version: '${component.version}',
                ...${JSON.stringify(omit(component?.content || {}, ['editors', 'runtime', 'ai', 'upgrade', 'runtime.edit', 'target']))},
                runtime: ${decodeURIComponent(runtime)},
								${editors ? `editors: ${decodeURIComponent(editors)}(),` : ''}
								${ai ? `ai: ${decodeURIComponent(ai)},` : ''}
								${upgrade ? `upgrade: ${decodeURIComponent(upgrade)},` : ''}
								${runtimeEdit ? `'runtime.edit': ${decodeURIComponent(runtimeEdit)},` : ''}
								${
	target && target.toReact
		? `target:{toReact: ${target.toReact?.startsWith('(function()') ? decodeURIComponent(target.toReact) : `"${decodeURIComponent(target.toReact)}"`}},`
		: ''
}
              }};
              `),
  					},
  				};
  			}

  			/** 处理 CDN 情况 */
  			if (component?.content?.editCode && component?.content?.runtimeCode) {
  				temp[material_pub_id] = { ...component, materialId: material_id };
  			}
  		} catch (e) {}
  	});

  	return temp;
  }

  /** 获取物料信息，并解析云组件依赖的原子组件 */
  async getMaterialContentWithDeps(components: ComponentForCreateComLib[], namespaceToLatestVersion: Map<string, string>) {
  	await Promise.all(components.map(async ({ namespace, version }) => {
  		if (version === 'latest' && !namespaceToLatestVersion.has(namespace)) {
  			// 版本号为latest并且没有记录过
  			const [latestMaterial] = await this.materialDao.getLatestMaterialByNamespaceOfMainBranch({
  				namespace
  			});
  			namespaceToLatestVersion.set(namespace, latestMaterial.version);
  			return latestMaterial;
  		}
  		return;
  	}));

  	const materials = components.length
  		? await this.materialDao.getMaterialContentByNamespaces({ components: components.map((component) => {
  			return {
  				...component,
  				version: component.version === 'latest' ? namespaceToLatestVersion.get(component.namespace) : component.version,
  			};
  		}) })
  		: [];

  	const deps = materials.reduce((pre, material) => {
  		const content = safeParse(material.content);

  		return [
  			...pre,
  			/** 云组件 deps 声明依赖的原子组件，类型是 { namespace: string; version: string; } */
  			...(content.deps ?? []),
  		];
  	}, []);

  	return [
  		...materials.map((material) => {
  			return {
  				...material,
  				isLatest: material.version === namespaceToLatestVersion.get(material.namespace)
  			};
  		}),
  		...(deps.length ? await this.getMaterialContentWithDeps(deps, namespaceToLatestVersion) : []),
  	];
  }

  /** 递归获取组件，且计算云组件的依赖项 */
  getComTree(
  	components: ComponentForCreateComLib[],
  	allComponentValue: AnyType,
  	namespaceToLatestVersion: Map<string, string>
  ) {
  	return components
  		.map((component) => {
  			const material: AnyType = allComponentValue.find(
  				(m: AnyType) =>
  					{
  					return m.namespace === component.namespace &&
							m.version === (component.version === 'latest' ? namespaceToLatestVersion.get(component.namespace) : component.version);
  				}
  			);

  			return material
  				? {
  					pub_id: material.material_pub_id,
  					id: material.id,
  					title: material.title,
  					cloudComponentDependentComponents: [
  						...this.getComTree(
  							/** 云组件 deps 声明依赖的原子组件，类型是 { namespace: string; version: string; } */
  							material.content?.deps ?? [],
  							allComponentValue,
  							namespaceToLatestVersion
  						),
  					],
  				}
  				: undefined;
  		})
  		.filter(Boolean);
  }

  async componentsCombo(
  	components: ComponentForCreateComLib[],
  	comboType: ComboType,
  ) {
  	try {
  		/** 记录latest对应版本号 */
  		const namespaceToLatestVersion = new Map();
  		const materials = await this.getMaterialContentWithDeps(components, namespaceToLatestVersion);
  		const fileId = '_myself_';
  		const allComponent = await this.getComponentsCode(materials, comboType);
  		const allComponentValue = Object.values(allComponent);

  		const editFile = getEditJsFile({
  			comTree: this.getComTree(components, allComponentValue, namespaceToLatestVersion),
  			allComponent,
  			version: '1.0.0',
  			comlibInfo: {
  				id: fileId,
  				title: '我的组件',
  			},
  			useComPubIds: allComponentValue.map((m: AnyType) => m.id),
  			comboType,
  		});

  		return { code: 1, resource: editFile };
  	} catch (e) {
  		return {
  			code: 0,
  			message: `组件库代码生成失败，错误原因：${e.message || e.msg || e}`,
  		};
  	}
  }

  /** 组件资源 combo end --------------- */

  async checkNamespaceUsedByCdm(
  	namespace: string,
  	config: Record<string, unknown>,
  ) {
  	const [material] = await this.materialDao.getLatestMaterialsByNamespace({
  		namespaces: [namespace],
  	});

  	if (material) {
  		return { code: 0, message: '该 namespace 组件已存在' };
  	}

  	try {
  		const npmRes = await _axios.post(
  			'https://hk.mybricks.world/api/npm/checkName',
  			{ name: namespace, ...config },
  		);

  		if (npmRes.data.code !== 1) {
  			return { code: 0, message: '当前npm包名已被注册或未遵循npm包名规范' };
  		}
  	} catch (e) {
  		return { code: 0, message: e.message };
  	}

  	return { code: 1, data: null, message: '校验成功' };
  }

  async getMaterialVersions(query: {
    materialId?: number;
    namespace?: string;
    isBranch?: string;
  }) {
  	const list = await this.materialDao.getMaterialVersions({
  		...query,
  		isBranch: query.isBranch === 'true',
  	});
  	return { list, total: list.length };
  }

  async getTemplateBySceneId(sceneId: number) {
  	if (!sceneId) {
  		return [];
  	}
  	const materials = await this.materialDao.getTemplateBySceneId(sceneId);
  	/** 获取所有组件对应的 tag */
  	const tagRelations = materials.length
  		? await this.materialDao.getTagRelations({
  			materialIds: [...new Set(materials.map((m) => m.id))],
  			needTitle: 1,
  			needOnline: 1,
  		})
  		: [];

  	const tagIds = uniq(tagRelations.map((t) => t.tag_id));
  	const tags = isEmpty(tagIds)
  		? []
  		: await this.materialDao.getTags({ status: EffectStatus.EFFECT, tagIds });
  	tags.sort((a, b) => a.order - b.order);
  	const currentMaterialIds = [];

  	return tags
  		.map((tag) => {
  			const materialIds = tagRelations
  				.filter((relation) => relation.tag_id === tag.id)
  				.map((relation) => Number(relation.material_id));
  			currentMaterialIds.push(...materialIds);
  			const currentMaterials = materials
  				.filter((m) => materialIds.includes(m.id))
  				.map((m) => ({ ...m, meta: safeParse(m.meta) }))
  				.sort((a, b) => a.meta.sort - b.meta.sort);

  			return {
  				id: tag.id,
  				order: tag.order,
  				title: tag.title,
  				templates: currentMaterials,
  			};
  		})
  		.concat({
  			id: null,
  			order: null,
  			title: '其他',
  			templates: materials
  				.filter((m) => !currentMaterialIds.includes(m.id))
  				.map((m) => ({ ...m, meta: safeParse(m.meta) }))
  				.sort((a, b) => a.meta.sort - b.meta.sort),
  		});
  }

  async createMaterial(materials: WillConvertMaterial[]) {
  	/** 补充缺省值 */
  	materials = materials.map((m) => ({
  		...m,
  		icon: m.icon || '',
  		docs: m.docs || '',
  		preview_img: m.preview_img || '',
  		title: m.title || '',
  		description: m.description || '',
  	}));

  	/** 线上生效的物料 */
  	const originMaterials =
      await this.materialDao.getLatestMaterialsByNamespace(
      	// @ts-ignore
      	materials.map((m) => m.namespace),
      );
  	/** 线上生效的物料及标签关系 */
  	const tagRelations = originMaterials.length
  		? await this.materialDao.getTagRelations({
  			materialIds: originMaterials.map((m) => m.id),
  			needOnline: 1,
  		})
  		: [];

  	/** 批量插入物料 */
  	await this.materialDao.bulkInsertMaterial(
  		materials.map((m) => {
  			const item = originMaterials.find((o) => o.namespace === m.namespace);
  			let willInsert = m;

  			if (item) {
  				willInsert = {
  					// @ts-ignore
  					key_info: item.key_info,
  					// @ts-ignore
  					scene_id: item.scene_id,
  					// @ts-ignore
  					power_type: String(item.power_type),
  					meta: item.meta,
  					...m,
  				};
  			}
  			return willInsert;
  		}),
  	);
  	/** 已经插入的物料数据 */
  	const insertedMaterials =
      await this.materialDao.getLatestMaterialsByNamespace(
      	// @ts-ignore
      	materials.map((m) => m.namespace),
      );

  	/** 继承上一个版本的物料标签关系 */
  	const relationParams = [];
  	materials.forEach((m) => {
  		/** 物料的上一个版本 */
  		const item = originMaterials.find((o) => o.namespace === m.namespace);

  		if (item) {
  			/** 获取所有物料标签关系记录 */
  			const originRelations = tagRelations.filter(
  				(tag) => tag.material_id === item.id,
  			);
  			/** 获取新物料 id */
  			const insertedMaterialId = insertedMaterials.find(
  				(insertedMaterial) => insertedMaterial.namespace === m.namespace,
  			);

  			originRelations.forEach((relation) => {
  				relationParams.push({
  					material_id: insertedMaterialId?.id,
  					tag_id: relation.tag_id,
  					create_time: Date.now(),
  					creator_id: m.creator_id,
  					creator_name: m.creator_name,
  				});
  			});
  		}
  	});

  	relationParams.length &&
      (await this.materialDao.bulkInsertMaterialTagRelation(relationParams));
  }

  async getMaterialContentByPubIds(pubIds: number[]) {
  	const data = await this.materialDao.getMaterialContentByPubIds(
  		uniq(pubIds),
  	);

  	return uniqBy(data, 'file_pub_id');
  }

  async createTemplate(templates: WillCreateTemplate[]) {
  	await this.createMaterial(
  		templates.map((template) => {
  			return {
  				id: template.id,
  				namespace: '_template__' + template.id,
  				ext_name: MaterialType.TEMPLATE,
  				file_pub_id: template.file_pub_id,
  				version: template.version,
  				title: template.title,
  				preview_img: template.preview_img,
  				creator_id: template.creator_id,
  				creator_name: template.creator_name,
  				create_time: Date.now(),
  				scene_id: template.scene_id,
  				power_type: MaterialPowerType.PUBLIC,
  				meta: JSON.stringify({
  					type: template.type,
  					fileId: template.id,
  					sort: template.sort,
  					isTemplateGuide: template.is_template_guide,
  				}),
  			};
  		}),
  	);
  	const materials = await this.getMaterialContentByPubIds(
  		templates.map((p) => p.file_pub_id),
  	);

  	const relationParams = [];
  	materials.forEach((m) => {
  		const curTemplate = templates.find(
  			(p) => p.file_pub_id === m.file_pub_id,
  		);

  		if (Array.isArray(curTemplate?.tag_ids)) {
  			curTemplate.tag_ids.map((tag) => {
  				relationParams.push({
  					material_id: m.material_id,
  					tag_id: tag,
  					create_time: Date.now(),
  					creator_id: curTemplate.creator_id,
  					creator_name: curTemplate.creator_name,
  				});
  			});
  		}
  	});

  	relationParams.length &&
      (await this.materialDao.bulkInsertMaterialTagRelation(relationParams));
  }

  async createTheme({ userId, namespace, themeConfig, title, req }: any) {
  	const theme = await this.materialDao.getMaterialByNamespace(namespace);

  	Logger.info(
  		`1-[创建主题包] 根据namespace查询主题包成功: ${theme ? '有' : '无'}`,
  	);

  	if (theme) {
  		const version = getNextVersion(theme.version);
  		Logger.info(`2-[创建主题包] 下一个版本号: ${version}`);
  		// 更新
  		await this.materialDao.update(
  			{ id: theme.id },
  			{
  				updatorId: userId,
  				updatorName: userId,
  				title: title,
  				version,
  			},
  		);
  		Logger.info('3-[创建主题包] 更新主题包物料成功');
  		const content = JSON.stringify(themeConfig);
  		await this.materialDao.createPub({
  			version,
  			materialId: theme.id,
  			creatorId: userId,
  			creatorName: userId,
  			content,
  		});
  		Logger.info('4-[创建主题包] 创建主题包发布记录成功');
  		if (theme.scope_status === MaterialScopeStatus.TOFAREND) {
  			Logger.info('5-[创建主题包] 分享至中心化服务');
  			const domainName = centralAPIBaseURL;
  			Logger.info(`6-[创建主题包] domainName: ${domainName}`);

  			try {
  				await _axios.post(`${domainName}/central/api/channel/gateway`, {
  					action: 'material_publishVersion',
  					payload: {
  						scene_type: 'PC',
  						name: theme.title,
  						...theme,
  						creator_id: userId,
  						creator_name: userId,
  						version,
  						content,
  					},
  				});
  				Logger.info('7-[创建主题包] 分享至中心化服务成功');
  			} catch {}
  		}
  	} else {
  		const { id: materialId } = await this.materialDao.batchCreate([
  			{
  				title,
  				namespace,
  				version: '1.0.0',
  				creatorId: userId,
  				creatorName: userId,
  				type: ExtName.THEME,
  				icon: '',
  				previewImg: '',
  				description: '',
  				scopeStatus: MaterialScopeStatus.PUBLIC,
  			},
  		]);
  		Logger.info(`2-[创建主题包] 创建主题包物料成功: ${materialId}`);
  		await this.materialDao.createPub({
  			version: '1.0.0',
  			materialId,
  			creatorId: userId,
  			creatorName: userId,
  			content: JSON.stringify(themeConfig),
  		});
  		Logger.info('3-[创建主题包] 创建主题包发布记录成功');
  	}

  	return {
  		code: 1,
  	};
  }

  async batchCreateIcon(params: {
    icons: Record<string, string>;
    userId: string;
  }) {
  	const { icons, userId } = params;
  	return Promise.all(
  		Object.entries(icons).map(([title, svg]) => {
  			return this.createCommon({
  				userId,
  				namespace: `${title}_${randomInt(10000000)}_${Date.now()}`,
  				type: SceneType.PICTURE,
  				title,
  				icon: '',
  				previewImg: svg,
  				scene: '',
  				description: '',
  				meta: '',
  				content: JSON.stringify({
  					url: svg,
  				}),
  				tags: ['icon'],
  			});
  		}),
  	);
  }

  async createImageMaterial(params: {
		name: string,
		url: string,
		userId: string
	}) {
  	const { name, url, userId } = params;
  	// 去掉后缀和路径的文件名
  	return this.createCommon({
  		userId,
  		namespace: url.split('/').pop()!,
  		type: SceneType.PICTURE,
  		title: name,
  		icon: '',
  		previewImg: url,
  		scene: '',
  		description: '',
  		meta: '',
  		content: JSON.stringify({
  			url,
  		}),
  		tags: ['image'],
  	});
  }

  async createCommon({
  	userId,
  	namespace,
  	type,
  	icon,
  	previewImg,
  	title,
  	description,
  	meta,
  	content,
  	scene,
  	tags,
  }) {
  	const material = await this.materialDao.getMaterialByNamespace(namespace);
  	const sceneId = await this.getMaterialSceneId(scene, userId);
  	let curMaterialId = material?.id;

  	if (material) {
  		const version = getNextVersion(material.version);
  		/** 传入 undefined 不重置场景 */
  		const curSceneId = scene === undefined ? material.scene_id : sceneId;
  		// 更新
  		await this.materialDao.update(
  			{ id: material.id },
  			{
  				icon,
  				previewImg,
  				description,
  				updatorId: userId,
  				updatorName: userId,
  				title: title,
  				version,
  				meta,
  				sceneId: curSceneId,
  			},
  		);
  		await this.materialDao.createPub({
  			version,
  			materialId: material.id,
  			creatorId: userId,
  			creatorName: userId,
  			content,
  		});
  		if (material.scope_status === MaterialScopeStatus.TOFAREND) {
  			const domainName = centralAPIBaseURL;

  			try {
  				await _axios.post(`${domainName}/central/api/channel/gateway`, {
  					action: 'material_publishVersion',
  					payload: {
  						scene_type: scene?.type,
  						name: material.title,
  						...material,
  						icon,
  						previewImg,
  						title,
  						description,
  						meta,
  						creator_id: userId,
  						creator_name: userId,
  						version,
  						content,
  					},
  				});
  			} catch {}
  		}
  	} else {
  		const { id: materialId } = await this.materialDao.batchCreate([
  			{
  				title,
  				namespace,
  				version: '1.0.0',
  				creatorId: userId,
  				creatorName: userId,
  				type,
  				icon,
  				previewImg: previewImg,
  				description,
  				meta,
  				sceneId,
  				scopeStatus: MaterialScopeStatus.PUBLIC,
  			},
  		]);
  		await this.materialDao.createPub({
  			version: '1.0.0',
  			materialId,
  			creatorId: userId,
  			creatorName: userId,
  			content,
  		});
  		curMaterialId = materialId;
  	}

  	await this.handleMaterialTags(curMaterialId, tags);

  	return {
  		code: 1,
  	};
  }

  async getThemeList({ themes }) {
  	return await this.materialDao.getMaterialContentByNamespaces({
  		components: themes,
  		type: ExtName.THEME,
  	});
  }

  async deleteMaterial(params: { id: number; userId: string }) {
  	await this.materialDao.updateMaterialById(params.id, {
  		status: EffectStatus.DELETE,
  		update_time: Date.now(),
  		updator_name: params.userId,
  		updator_id: params.userId,
  	});
  }

  async updateMaterial(
  	materials: WillUpdateMaterialRelation[],
  	resetTagRelation = true,
  ) {
  	if (!materials.length) {
  		return;
  	}
  	const materialIds = materials.map((r) => r.material_id);
  	const originMaterials =
      await this.materialDao.getMaterialListByMaterialId(materialIds);
  	const tagRelations = [];

  	for (const material of materials) {
  		const originMaterial = originMaterials.find(
  			(m) => m.material_id === material.material_id,
  		);

  		if (!originMaterial) {
  			continue;
  		}

  		if (
  			originMaterial.scene_id !== material.scene_id ||
        originMaterial.status !== material.status ||
        originMaterial.key_info !== material.key_info ||
        originMaterial.meta !== material.meta ||
        originMaterial.title !== material.title ||
        originMaterial.power_type !== material.power_type
  		) {
  			await this.materialDao.updateMaterialById(material.material_id, {
  				scene_id: material.scene_id ?? originMaterial.scene_id,
  				status: String(
  					isNumber(material.status) ? material.status : EffectStatus.EFFECT,
  				),
  				key_info: material.key_info,
  				power_type: String(
  					isNumber(material.power_type)
  						? material.power_type
  						: MaterialPowerType.PUBLIC,
  				),
  				meta: material.meta || originMaterial.meta,
  				preview_img: material.preview_img || originMaterial.preview_img,
  				title: material.title || originMaterial.title,
  				updator_name: material.updator_name,
  				updator_id: material.updator_id,
  				update_time: Date.now(),
  			});
  		}

  		material.tag_ids?.forEach((id) => {
  			tagRelations.push({
  				material_id: material.material_id,
  				tag_id: id,
  				creator_id: material.updator_id,
  				creator_name: material.updator_name,
  				create_time: Date.now(),
  			});
  		});
  	}

  	resetTagRelation &&
      (await this.materialDao.deleteRelationByMaterialId(materialIds));
  	tagRelations.length &&
      (await this.materialDao.bulkInsertMaterialTagRelation(tagRelations));
  }

  async getSceneAndTagList(types: string[]) {
  	const currentTypes = types.length
  		? types
  		: [SceneType.PICTURE, SceneType.COMMON, SceneType.TEMPLATE];
  	const [scenes, tags] = await Promise.all([
  		this.materialDao.getScene(EffectStatus.EFFECT, currentTypes),
  		this.materialDao.getTags({ status: EffectStatus.EFFECT }),
  	]);
  	const sceneIds = scenes.map((s) => s.id);

  	return [{ id: null, title: '全部' }, ...scenes].map((scene) => {
  		return {
  			sceneId: scene.id,
  			sceneTitle: scene.title,
  			type: scene.id ? scene.type || SceneType.COMMON : null,
  			categories: [
  				{ id: null, title: '全部' },
  				...tags
  					.filter(
  						(tag) =>
  							(scene.id
  								? tag.scene_id === scene.id
  								: sceneIds.includes(tag.scene_id)) && isNil(tag.parent_id),
  					)
  					.sort((a, b) => a.order - b.order)
  					.map((tag) => pick(tag, ['id', 'title'])),
  			].map((cate) => {
  				return {
  					categoryId: cate.id,
  					categoryTitle: cate.title,
  					tags: [
  						{ id: null, title: '全部' },
  						...tags
  							.filter(
  								(tag) =>
  									(cate.id ? tag.parent_id === cate.id : true) &&
                    (scene.id
                    	? tag.scene_id === scene.id
                    	: sceneIds.includes(tag.scene_id)) &&
                    !isNil(tag.parent_id),
  							)
  							.sort((a, b) => a.order - b.order)
  							.map((tag) => pick(tag, ['id', 'title'])),
  					].map((tag) => ({ tagId: tag.id, tagTitle: tag.title })),
  				};
  			}),
  		};
  	});
  }

  async shareMaterial(namespace, req) {
  	let result = {
  		code: 0,
  		data: null,
  		message: 'success',
  	};
  	const material = (await this.materialDao.getMaterialByNamespace(
  		namespace,
  	)) as Material;
  	if (material.scope_status === MaterialScopeStatus.TOFAREND) {
  		// 已经分享过了
  		result.code = 1;
  	} else {
  		const [[latest], tags, scene] = await Promise.all([
  			await this.materialDao.getLatestMaterialsByNamespace({
  				namespaces: [namespace],
  				needContent: true,
  			}),
  			await this.materialDao.getTagRelations({
  				materialIds: [material.id],
  				needTitle: 1,
  				needOnline: 1,
  			}),
  			await this.materialDao.getSceneById(material.scene_id),
  		]);

  		/** 本地测试 根目录 npm run start:nodejs，调平台接口需要起平台（apaas-platform）服务 */
  		const domainName = centralAPIBaseURL;
  		// const domainName = getRealDomain(req)

  		const share = await _axios.post(
  			`${domainName}/central/api/channel/gateway`,
  			{
  				action: 'material_publishVersion',
  				payload: {
  					scene_type: scene?.type,
  					name: material.title,
  					...material,
  					content: latest.content,
  					tags: tags.map((tag) => tag.title),
  				},
  			},
  		);

  		if (share.data?.code === 1) {
  			result.code = 1;
  			await this.materialDao.update(
  				{
  					id: material.id,
  				},
  				{
  					updatorId: material.creator_id,
  					updatorName: material.creator_name,
  					scopeStatus: MaterialScopeStatus.TOFAREND,
  				},
  			);
  		} else {
  			result.message = share.data?.message || '分享失败';
  		}
  	}

  	return result;
  }

  async pullMaterial(namespaces, userId) {
  	const materials = await this.materialDao.getLatestMaterialsByNamespace({
  		namespaces,
  		status: EffectStatus.EFFECT,
  	});
  	Logger.info('1-[从中心化拉物料] 根据namesapces获取最新物料记录成功');
  	const remoteMaterialNamespaces: Array<{
      namespace: string;
      version: string | null;
      type: 'create' | 'update';
      id: number | null;
    }> = [];

  	namespaces.forEach((namespace) => {
  		const material = materials.find(
  			(material) => material.namespace === namespace,
  		);

  		if (!material) {
  			// 没有的，就从远端拉
  			remoteMaterialNamespaces.push({
  				namespace,
  				version: null,
  				type: 'create',
  				id: null,
  			});
  		} else if (material.scope_status === MaterialScopeStatus.FROMFAREND) {
  			// 有，并且来自远端，也要去远端拉
  			remoteMaterialNamespaces.push({
  				namespace,
  				version: material.version,
  				type: 'update',
  				id: material.id,
  			});
  		}
  	});
  	Logger.info(
  		`2-[从中心化拉物料] 需要从中心化服务拉的物料: ${JSON.stringify(remoteMaterialNamespaces)}`,
  	);

  	const domainName = centralAPIBaseURL;
  	const remoteMaterialContents: Array<{
      namespace: string;
      version: string | null;
      type: 'create' | 'update';
      id: number | null;
    }> = [];

  	if (remoteMaterialNamespaces.length) {
  		const {
  			data: { data },
  		} = await _axios.post(`${domainName}/central/api/channel/gateway`, {
  			action: 'material_getLatestVersionByNamespaces',
  			payload: {
  				namespaces: remoteMaterialNamespaces.map((item) => item.namespace),
  			},
  		});
  		Logger.info(
  			'3-[从中心化拉物料] 调中心化接口“material_getLatestVersionByNamespaces”成功',
  		);
  		data?.forEach(({ namespace, version }) => {
  			const remoteMaterialNamespace = remoteMaterialNamespaces.find(
  				(item) => item.namespace === namespace,
  			);
  			if (remoteMaterialNamespace?.version !== version) {
  				remoteMaterialContents.push({
  					namespace,
  					version,
  					type: remoteMaterialNamespace!.type,
  					id: remoteMaterialNamespace!.id,
  				});
  			}
  		});
  	}

  	const createMaterials: any = [];
  	const updateMaterials: any = [];
  	const allDeps = [];
  	const depsMap = {};
  	let scenes = [];

  	if (remoteMaterialContents.length) {
  		scenes = await this.materialDao.getScene(EffectStatus.EFFECT);
  		Logger.info('4-[从中心化拉物料] 获取场景成功');
  		await Promise.all(
  			remoteMaterialContents.map(({ namespace, version, type, id }) => {
  				return new Promise((resolve) => {
  					_axios
  						.post(`${domainName}/central/api/channel/gateway`, {
  							action: 'material_getMaterialInfo',
  							payload: {
  								namespace,
  								version,
  							},
  						})
  						.then(async ({ data }) => {
  							const remoteMaterial = data.data;
  							let curMaterialId = id;
  							const curScene = scenes.find(
  								(s) => s.type === remoteMaterial.scene_info?.type,
  							);
  							let curSceneId = curScene?.id;

  							if (!curScene && !!remoteMaterial.scene_info?.type) {
  								await this.materialDao.createScene([
  									{
  										create_time: Date.now(),
  										creator_id: userId,
  										type: remoteMaterial.scene_info?.type,
  										title: remoteMaterial.scene_info?.title,
  										order: 0,
  									},
  								]);
  								Logger.info(
  									`5-[从中心化拉物料] 创建新的场景: ${JSON.stringify(remoteMaterial.scene_info)}`,
  								);
  								scenes = await this.materialDao.getScene(EffectStatus.EFFECT);
  								Logger.info('6-[从中心化拉物料] 更新新的场景');
  								curSceneId = scenes.find(
  									(s) => s.type === remoteMaterial.scene_info?.type,
  								)?.id;
  							}

  							if (type === 'create') {
  								createMaterials.push({
  									title: remoteMaterial.name,
  									namespace,
  									version: remoteMaterial.version,
  									creator_id: userId,
  									creator_name: '',
  									type: remoteMaterial.type,
  									scope_status: MaterialScopeStatus.FROMFAREND,
  									icon: remoteMaterial.icon || '',
  									preview_img: remoteMaterial.preview_img || '',
  									description: remoteMaterial.description || '',
  								});

  								const { id: materialId } = await this.materialDao.batchCreate(
  									[
  										{
  											title: remoteMaterial.name,
  											namespace,
  											version: remoteMaterial.version,
  											creatorId: userId,
  											creatorName: '',
  											type: remoteMaterial.type,
  											scopeStatus: MaterialScopeStatus.FROMFAREND,
  											icon: remoteMaterial.icon || '',
  											previewImg: remoteMaterial.preview_img || '',
  											description: remoteMaterial.description || '',
  											sceneId: curSceneId,
  										},
  									],
  								);
  								Logger.info(`7-[从中心化拉物料] 创建物料: ${materialId}`);

  								await this.materialDao.createPub({
  									version: remoteMaterial.version,
  									materialId,
  									creatorId: userId,
  									creatorName: '',
  									content: remoteMaterial.content,
  								});
  								Logger.info(
  									`8-[从中心化拉物料] 创建物料发布记录: ${materialId}`,
  								);
  								curMaterialId = materialId;
  							} else {
  								updateMaterials.push({
  									namespace,
  									version: remoteMaterial.version,
  									id: id!,
  									creator_id: userId,
  									creator_name: '',
  								});
  								/** pub 记录 */
  								await this.materialDao.createPub({
  									version: remoteMaterial.version,
  									materialId: id!,
  									creatorId: userId,
  									creatorName: '',
  									content: remoteMaterial.content,
  								});
  								Logger.info(`9-[从中心化拉物料] 更新物料: ${id}`);

  								/** 更新物料记录 */
  								await this.materialDao.update(
  									{ id: id! },
  									{
  										updatorId: userId,
  										updatorName: '',
  										title: remoteMaterial.name,
  										version: remoteMaterial.version,
  										sceneId: curSceneId,
  									},
  								);
  								Logger.info(`10-[从中心化拉物料] 创建物料发布记录: ${id}`);
  							}

  							try {
  								await this.handleMaterialTags(
  									curMaterialId,
  									remoteMaterial.tags || [],
  								);
  								Logger.info(
  									`11-[从中心化拉物料] 更新tags成功: ${curMaterialId}`,
  								);
  							} catch (e) {
  								Logger.info(
  									`12-[从中心化拉物料] 更新tags失败: ${curMaterialId}`,
  								);
  								console.log('handleMaterialTags error', e);
  							}

  							try {
  								const parsedContent = safeParse(remoteMaterial.content);
  								let deps;
  								if(parsedContent?.react || parsedContent?.vue) {
  									// 协议升级后，区分框架
  									deps = parsedContent?.react?.deps || parsedContent?.vue?.deps || [];
  								} else {
  									// 升级前，不区分框架
  									deps = parsedContent.deps || [];
  								}
  								Logger.info(
  									`13-[从中心化拉物料] 物料的依赖: ${JSON.stringify(deps)}`,
  								);
  								if (Array.isArray(deps)) {
  									deps.forEach(({ namespace, version }) => {
  										const key = `${namespace}@${version}`;
  										if (!depsMap[key]) {
  											depsMap[key] = true;
  											allDeps.push({ namespace, version });
  										}
  									});
  								}
  							} catch {}

  							resolve(true);
  						});
  				});
  			}),
  		);
  	}

  	if (allDeps.length) {
  		Logger.info('14-[从中心化拉物料] 开始拉依赖的物料');
  		await this.pullRemoteMaterials({ deps: allDeps, userId, scenes });
  	}

  	return {
  		code: 1,
  		data: {
  			createMaterials,
  			updateMaterials,
  		},
  		message: 'success',
  	};
  }

  async pullRemoteMaterials({ deps, userId, scenes }) {
  	const materials =
      await this.materialDao.getMaterialsByNamespace_Version(deps);
  	const needPullMaterials = deps.filter(
  		(dep) =>
  			!materials.some((material) => material.namespace === dep.namespace),
  	);
  	const domainName = centralAPIBaseURL;
  	const chunkSize = 5;
  	const chunks = [];
  	const that = this;
  	const allDeps = [];
  	const depsMap = {};
  	console.log(deps, 'deps');
  	console.log(needPullMaterials, 'needPullMaterials');

  	Logger.info(
  		`15-[从中心化拉物料] 需要拉的物料: ${JSON.stringify(needPullMaterials)}`,
  	);

  	for (let i = 0; i < needPullMaterials.length; i += chunkSize) {
  		chunks.push(needPullMaterials.slice(i, i + chunkSize));
  	}

  	async function uploadChunks(chunks) {
  		const chunk = chunks.pop();
  		if (chunk) {
  			await Promise.all(
  				chunk.map(async (content) => {
  					_axios
  						.post(`${domainName}/central/api/channel/gateway`, {
  							action: 'material_getMaterialInfo',
  							payload: {
  								namespace: content.namespace,
  								version: content.version,
  							},
  						})
  						.then(async ({ data }) => {
  							const remoteMaterial = data.data;
  							const curScene = scenes.find(
  								(s) => s.type === remoteMaterial.scene_info?.type,
  							);
  							let curSceneId = curScene?.id;

  							Logger.info(
  								`16-[从中心化拉物料] 调中心化接口“material_getMaterialInfo”成功: ${remoteMaterial.namespace}`,
  							);

  							if (!curScene && !!remoteMaterial.scene_info?.type) {
  								await that.materialDao.createScene([
  									{
  										create_time: Date.now(),
  										creator_id: userId,
  										type: remoteMaterial.scene_info?.type,
  										title: remoteMaterial.scene_info?.title,
  										order: 0,
  									},
  								]);
  								Logger.info(
  									`17-[从中心化拉物料] 创建新的场景: ${JSON.stringify(remoteMaterial.scene_info)}`,
  								);
  								scenes = await that.materialDao.getScene(EffectStatus.EFFECT);
  								Logger.info('18-[从中心化拉物料] 更新新的场景');
  								curSceneId = scenes.find(
  									(s) => s.type === remoteMaterial.scene_info?.type,
  								)?.id;
  							}

  							const material = await that.materialDao.getMaterialByNamespace(
  								remoteMaterial.namespace,
  							);
  							Logger.info(
  								`19-[从中心化拉物料] ${material ? '' : '不'}存在物料: ${remoteMaterial.namespace}`,
  							);
  							let materialId = material?.id;

  							if (material) {
  								Logger.info(
  									`20-[从中心化拉物料] 版本对比: ${material.version} vs ${remoteMaterial.version}`,
  								);
  								if (
  									compareVersion(material.version, remoteMaterial.version) < 0
  								) {
  									/** 更新物料记录 */
  									await that.materialDao.update(
  										{ id: materialId },
  										{
  											updatorId: userId,
  											updatorName: '',
  											title: remoteMaterial.name,
  											version: remoteMaterial.version,
  											sceneId: curSceneId,
  										},
  									);
  									Logger.info(
  										`21-[从中心化拉物料] 更新物料记录成功: ${materialId}`,
  									);
  								}
  							} else {
  								// 插入物料记录
  								const { id } = await that.materialDao.batchCreate([
  									{
  										title: remoteMaterial.name,
  										namespace: remoteMaterial.namespace,
  										version: remoteMaterial.version,
  										creatorId: userId,
  										creatorName: '',
  										type: remoteMaterial.type,
  										scopeStatus: MaterialScopeStatus.FROMFAREND,
  										icon: remoteMaterial.icon || '',
  										previewImg: remoteMaterial.preview_img || '',
  										description: remoteMaterial.description || '',
  										sceneId: curSceneId,
  									},
  								]);
  								Logger.info(`22-[从中心化拉物料] 创建物料记录成功: ${id}`);

  								materialId = id;
  							}

  							await that.materialDao.createPub({
  								version: remoteMaterial.version,
  								materialId,
  								creatorId: userId,
  								creatorName: '',
  								content: remoteMaterial.content,
  							});

  							Logger.info(
  								`23-[从中心化拉物料] 创建物料发布记录成功: ${materialId}`,
  							);

  							try {
  								await that.handleMaterialTags(
  									materialId,
  									remoteMaterial.tags || [],
  								);
  							} catch (e) {
  								console.log('handleMaterialTags error', e);
  							}

  							try {
  								const parsedContent = safeParse(remoteMaterial.content);
  								let deps;
  								if(parsedContent?.react || parsedContent?.vue) {
  									// 协议升级后，区分框架
  									deps = parsedContent?.react?.deps || parsedContent?.vue?.deps || [];
  								} else {
  									// 升级前，不区分框架
  									deps = parsedContent.deps || [];
  								}
  								if (Array.isArray(deps)) {
  									deps.forEach(({ namespace, version }) => {
  										const key = `${namespace}@${version}`;
  										if (!depsMap[key]) {
  											depsMap[key] = true;
  											allDeps.push({ namespace, version });
  										}
  									});
  								}
  							} catch {}
  						});
  				}),
  			);
  			await uploadChunks(chunks);
  		}
  	}

  	await uploadChunks(chunks);

  	if (allDeps.length) {
  		this.pullRemoteMaterials({ deps: allDeps, userId, scenes });
  	}
  }

  async getRemoteList(params, req) {
  	const domainName = centralAPIBaseURL;
  	const remoteList = await _axios.post(
  		`${domainName}/central/api/channel/gateway`,
  		{
  			action: 'material_getMaterialList',
  			payload: params,
  		},
  	);

  	return remoteList.data;
  }

  async getRemoteLatestComponentLibrarys(req) {
  	const domainName = centralAPIBaseURL;

  	const {
  		data: {
  			data: { list },
  		},
  	} = await _axios.post(`${domainName}/central/api/channel/gateway`, {
  		action: 'material_getMaterialList',
  		payload: {
  			page: 1,
  			pageSize: 200,
  			type: 'com_lib',
  		},
  	});

  	const {
  		data: { data },
  	} = await _axios.post(`${domainName}/central/api/channel/gateway`, {
  		action: 'material_getLatestVersionByNamespaces',
  		payload: {
  			namespaces: list.map((item) => item.namespace),
  		},
  	});

  	const comlibs = await Promise.all(
  		data.map(async ({ namespace, version }) => {
  			return await _axios.post(`${domainName}/central/api/channel/gateway`, {
  				action: 'material_getMaterialInfo',
  				payload: {
  					namespace,
  					version,
  				},
  			});
  		}),
  	);

  	return {
  		code: 1,
  		data: comlibs.map((comlib) => {
  			return comlib.data.data;
  		}),
  		message: 'success',
  	};
  }

  async getLatestMaterialsByNamespaces(namespaces) {
  	if (!namespaces.length) {
  		return { code: 1, data: [] };
  	}
  	const materials = await this.materialDao.getLatestMaterialsByNamespace({
  		namespaces,
  		needContent: true,
  	});

  	return {
  		code: 1,
  		data: materials,
  		message: 'success',
  	};
  }

  async getRemoteLatestVersionByNamespaces(namespaces, req) {
  	const domainName = centralAPIBaseURL;

  	const { data } = await _axios.post(
  		`${domainName}/central/api/channel/gateway`,
  		{
  			action: 'material_getLatestVersionByNamespaces',
  			payload: {
  				namespaces,
  			},
  		},
  	);

  	return data;
  }

  async importMaterials(file, userId, req) {
  	let zip;

		try {
			// 创建 AdmZip 实例，直接传入 buffer
			zip = new AdmZip(file.buffer);
		} catch (e) {
			Logger.error('[导入物料] 创建zip实例失败', e);
			throw e;
		}
	
		Logger.info('[导入物料] 开始解压zip包');
		const COMLIB_KEY_TO_PATH_MAP = {
			rtJs: 'rt.js',
			editJs: 'edit.js',
			coms: 'rtCom.js',
			comsDef: 'comsDef.js'
		};
		
		const files = zip.getEntries();
		const namespaces = [];
		const namespaceToMap = {};

  	Logger.info('[导入物料] zip包解压完成');

  	try {
			files.forEach((zipFileEntry) => {
				Logger.info(`[导入物料] 文件名: ${zipFileEntry.entryName}`);
				if (zipFileEntry.entryName.endsWith('.material@mybricks.json')) {
					const content = zipFileEntry.getData().toString("utf8");
					const jsonContent = JSON.parse(content)
					const { material } = jsonContent;
					const { namespace } = material;
					Logger.info(`[导入物料] 组件namespace: ${namespace}`);
					namespaces.push(namespace);
					namespaceToMap[namespace] = jsonContent;
				}
			})
  	} catch (err) {
  		const message = `[导入物料] 物料压缩包解析失败: ${err?.message | err?.msg | err}`;
  		Logger.info(message);
  		return {
  			code: 0,
  			data: null,
  			message,
  		};
  	}
  	Logger.info(`[导入物料] 最终的namespaces: ${JSON.stringify(namespaces)}`);
  	const materials = await this.materialDao.getMaterialByNamespaces({
  		namespaces,
  	});
  	Logger.info('[导入物料] 根据namespace获取物料成功');
  	const remoteMaterialNamespaces: Array<{
      namespace: string;
      version: string | null;
      type: 'create' | 'update';
      id: number | null;
    }> = [];

  	namespaces.forEach((namespace) => {
  		const material = materials.find(
  			(material) => material.namespace === namespace,
  		);

  		if (!material) {
  			// 没有的，就从远端拉
  			remoteMaterialNamespaces.push({
  				namespace,
  				version: null,
  				type: 'create',
  				id: null,
  			});
  		} else {
  			// 有，并且来自远端，也要去远端拉
  			remoteMaterialNamespaces.push({
  				namespace,
  				version: material.version,
  				type: 'update',
  				id: material.id,
  			});
  		}
  	});

  	const remoteMaterialContents: Array<{
      namespace: string;
      version: string | null;
      type: 'create' | 'update';
      id: number | null;
    }> = [];

  	if (remoteMaterialNamespaces.length) {
  		remoteMaterialNamespaces.forEach(({ namespace, version, type, id }) => {
  			const jsonContent = namespaceToMap[namespace];
  			const { materialPub } = jsonContent;
  			if (!version || compareVersion(version, materialPub.version) < 0) {
  				remoteMaterialContents.push({
  					namespace,
  					version: materialPub.version,
  					type,
  					id,
  				});
  			}
  		});
  	}

  	const createMaterials: any = [];
  	const updateMaterials: any = [];

  	if (remoteMaterialContents.length) {
  		await Promise.all(
  			remoteMaterialContents.map(async ({ namespace, version, type, id }) => {
  				const { material, materialPub } = namespaceToMap[namespace];
  				const sceneId = await this.getMaterialSceneId(material.sceneInfo);
  				Logger.info(`[导入物料] sceneId: ${sceneId}`);
  				let curMaterialId;

  				if (type === 'create') {
  					Logger.info(`[导入物料] 创建物料: ${namespace}`);
  					const createMaterial = {
  						title: material.name,
  						namespace,
  						version: materialPub.version,
  						creator_id: userId,
  						creator_name: '',
  						type: material.type,
  						scope_status: MaterialScopeStatus.PUBLIC,
  						icon: material.icon || '',
  						preview_img: material.previewImg || '',
  						description: material.description || '',
  						sceneId,
  						state: 'success',
  					};
  					createMaterials.push(createMaterial);
  					const { id: materialId } = await this.materialDao.batchCreate([
  						{
  							title: material.name,
  							namespace,
  							version: '0',
  							creatorId: userId,
  							creatorName: '',
  							type: material.type,
  							scopeStatus: MaterialScopeStatus.PUBLIC,
  							icon: material.icon || '',
  							previewImg: material.previewImg || '',
  							description: material.description || '',
  							sceneId,
  						},
  					]);
  					Logger.info(`[导入物料] 创建成功: ${materialId} - ${namespace}`);

  					curMaterialId = materialId;

  					let content = materialPub.content;
  					let state = 'success';

  					if (material.type === 'com_lib') {
  						content = JSON.parse(materialPub.content);

  						Logger.info(`[导入物料] 组件库content: ${materialPub.content}`);

  						try {
  							if (content.rtJs) {
  								// 兼容
  								await Promise.all(
  									['rtJs', 'editJs', 'coms'].map((key) => {
  										const value = content[key];
  										return new Promise((resolve, reject) => {
  											if (!value) {
  												const errMessage = `[导入物料] 缺少 ${key} 资源`;
  												Logger.info(errMessage);
  												reject(errMessage);
  											} else {
													const target = files.find(zipFileEntry => {
														return zipFileEntry.entryName.replace(/^\.\//, '') === value.replace(/^\.\//, '')
													})
													const fileContent = target.getData().toString("utf8");
													const { version } = materialPub;
													Logger.info(
														`[导入物料] 读文件: ${COMLIB_KEY_TO_PATH_MAP[key]}`,
													);
													try {
														Logger.info('[导入物料] 开始写文件');
														API.Upload.staticServer({
															content: fileContent.toString('utf-8'),
															folderPath: `/material/${materialId}/${version}`,
															fileName: `${COMLIB_KEY_TO_PATH_MAP[key]}`,
															noHash: true,
															domainName: getRealDomain(req),
														})
															.then((res: { url: string }) => {
																let url = res.url;
																const index = url.indexOf('/mfs');
																url = url.slice(index);
																content[key] = url;
																Logger.info(
																	`[导入物料] 上传文件成功: ${url}`,
																);
																resolve(true);
															})
													} catch (err) {
														const errMessage = `[导入物料] 上传文件失败(catch): ${err?.message | err?.msg | err}`;
														Logger.info(errMessage);
														reject(errMessage);
													}
  											}
  										});
  									}),
  								);
  							} else {
  								const that = this;
  								await Promise.all(
  									Object.entries(content).map(
  										([framework, frameworkContentInfo]) => {
  											return Promise.all(
  												['rtJs', 'editJs', 'coms', 'comsDef'].map((key) => {
  													const value = frameworkContentInfo[key];
  													return new Promise((resolve, reject) => {
  														if (!value) {
  															if (key === 'comsDef') {
  																resolve(true);
  															} else {
  																const errMessage = `[导入物料] 缺少 ${key} 资源`;
  																Logger.info(errMessage);
  																reject(errMessage);
  															}
  														} else {
																const target = files.find(zipFileEntry => {
																	return zipFileEntry.entryName.replace(/^\.\//, '') === value.replace(/^\.\//, '')
																})
																const fileContent = target.getData().toString("utf8");
																(async() => {
																	const res = JSON.parse(fileContent.toString('utf-8'));
																	if (key === 'comsDef') {
																		try {
																			let scenes = await this.materialDao.getScene(EffectStatus.EFFECT);
																			
																			Promise.all(res.map(async (remoteMaterial) => {
																				Logger.info(`fileContent map: ${JSON.stringify(remoteMaterial)}`);
																				const curScene = scenes.find(
																					(s) => s.type === remoteMaterial.scene_info?.type,
																				);
																				let curSceneId = curScene?.id;

																				if (!curScene && !!remoteMaterial.scene_info?.type) {
																					await that.materialDao.createScene([
																						{
																							create_time: Date.now(),
																							creator_id: userId,
																							type: remoteMaterial.scene_info?.type,
																							title: remoteMaterial.scene_info?.title,
																							order: 0,
																						},
																					]);
																					Logger.info(
																						`[导入物料] 创建新的场景: ${JSON.stringify(remoteMaterial.scene_info)}`,
																					);
																					scenes = await that.materialDao.getScene(EffectStatus.EFFECT);
																					Logger.info('[导入物料] 更新新的场景');
																					curSceneId = scenes.find(
																						(s) => s.type === remoteMaterial.scene_info?.type,
																					)?.id;
																				}

																				const material = await that.materialDao.getMaterialByNamespace(
																					remoteMaterial.namespace,
																				);
																				Logger.info(
																					`[导入物料] ${material ? '' : '不'}存在物料: ${remoteMaterial.namespace}`,
																				);
																				let materialId = material?.id;

																				if (material) {
																					Logger.info(
																						`[导入物料] 版本对比: ${material.version} vs ${remoteMaterial.version}`,
																					);
																					if (
																						compareVersion(material.version, remoteMaterial.version) < 0
																					) {
																						/** 更新物料记录 */
																						await that.materialDao.update(
																							{ id: materialId },
																							{
																								updatorId: userId,
																								updatorName: '',
																								title: remoteMaterial.name,
																								version: remoteMaterial.version,
																								sceneId: curSceneId,
																							},
																						);
																						Logger.info(
																							`[导入物料] 更新物料记录成功: ${materialId}`,
																						);
																					}
																				} else {
																					// 插入物料记录
																					const { id } = await that.materialDao.batchCreate([
																						{
																							title: remoteMaterial.name,
																							namespace: remoteMaterial.namespace,
																							version: remoteMaterial.version,
																							creatorId: userId,
																							creatorName: '',
																							type: remoteMaterial.type,
																							scopeStatus: MaterialScopeStatus.PUBLIC,
																							icon: remoteMaterial.icon || '',
																							previewImg: remoteMaterial.preview_img || '',
																							description: remoteMaterial.description || '',
																							sceneId: curSceneId,
																						},
																					]);
																					Logger.info(`[导入物料] 创建物料记录成功: ${id}`);

																					materialId = id;
																				}

																				await that.materialDao.createPub({
																					version: remoteMaterial.version,
																					materialId,
																					creatorId: userId,
																					creatorName: '',
																					content: remoteMaterial.content,
																				});

																				Logger.info(
																					`[导入物料] 创建物料发布记录成功: ${materialId}`,
																				);

																				try {
																					await that.handleMaterialTags(
																						materialId,
																						remoteMaterial.tags || [],
																					);
																				} catch (e) {
																					console.log('handleMaterialTags error', e);
																				}
																			}));
																			resolve(true);
																		} catch (err) {
																			const errMessage = `[导入物料] 导入单组件失败(catch): ${err?.message | err?.msg | err}`;
																			Logger.info(errMessage);
																			reject(errMessage);
																		}
																	} else {
																		const { version } = materialPub;
																		Logger.info(
																			`[导入物料] 读文件: ${COMLIB_KEY_TO_PATH_MAP[key]}`,
																		);
																		try {
																			Logger.info('[导入物料] 开始写文件');
																			API.Upload.staticServer({
																				content: fileContent.toString('utf-8'),
																				folderPath: `/material/${materialId}/${version}/${framework}`,
																				fileName: `${COMLIB_KEY_TO_PATH_MAP[key]}`,
																				noHash: true,
																				domainName: getRealDomain(req),
																			})
																				.then((res: { url: string }) => {
																					let url = res.url;
																					const index = url.indexOf('/mfs');
																					url = url.slice(index);
																					frameworkContentInfo[key] = url;
																					Logger.info(
																						`[导入物料] 上传文件成功: ${url}`,
																					);
																					resolve(true);
																				})
																				.catch((err) => {
																					const errMessage = `[导入物料] 上传文件失败(promise catch): ${err?.message | err?.msg | err}`;
																					Logger.info(errMessage);
																					reject(errMessage);
																				});
																		} catch (err) {
																			const errMessage = `[导入物料] 上传文件失败(catch): ${err?.message | err?.msg | err}`;
																			Logger.info(errMessage);
																			reject(errMessage);
																		}
																	}
																})()

  														}
  													});
  												}),
  											);
  										},
  									),
  								);
  							}
  						} catch (err) {
								Logger.error('[导入物料] 读取文件失败', err);
  							state = 'error';
  						}

  						content = JSON.stringify(content);
  						Logger.info(`[导入物料] 创建物料content: ${content}`);
  					}

  					if (state === 'success') {
  						/** 更新物料记录 */
  						await this.materialDao.update(
  							{ id: materialId },
  							{
  								updatorId: userId,
  								updatorName: '',
  								version: materialPub.version,
  							},
  						);
  						await this.materialDao.createPub({
  							version: materialPub.version,
  							materialId,
  							creatorId: userId,
  							creatorName: '',
  							content,
  						});

  						Logger.info(`[导入物料] 创建发布记录成功: ${materialId}`);
  					}
  					createMaterial.state = state;
  				} else {
  					Logger.info(`[导入物料] 更新物料: ${namespace}`);
  					const updateMaterial = {
  						namespace,
  						version: materialPub.version,
  						id: id!,
  						creator_id: userId,
  						creator_name: '',
  						sceneId,
  						state: 'success',
  					};
  					updateMaterials.push(updateMaterial);
  					let content = materialPub.content;
  					let state = 'success';

  					if (material.type === 'com_lib') {
  						content = JSON.parse(materialPub.content);

  						Logger.info(`[导入物料] 组件库content: ${materialPub.content}`);

  						try {
  							if (content.rtJs) {
  								await Promise.all(
  									['rtJs', 'editJs', 'coms'].map((key) => {
  										const value = content[key];
  										return new Promise((resolve, reject) => {
  											if (!value) {
  												const errMessage = `[导入物料] 缺少 ${key} 资源`;
  												Logger.info(errMessage);
  												reject(errMessage);
  											} else {
													const target = files.find(zipFileEntry => {
														return zipFileEntry.entryName.replace(/^\.\//, '') === value.replace(/^\.\//, '')
													})
													const fileContent = target.getData().toString("utf8");

													const { version } = materialPub;
													Logger.info(
														`[导入物料] 读文件: ${COMLIB_KEY_TO_PATH_MAP[key]}`,
													);

													try {
														Logger.info('[导入物料] 开始写文件');
														API.Upload.staticServer({
															content: fileContent.toString('utf-8'),
															folderPath: `/material/${id}/${version}`,
															fileName: `${COMLIB_KEY_TO_PATH_MAP[key]}`,
															noHash: true,
															domainName: getRealDomain(req),
														})
															.then((res: { url: string }) => {
																let url = res.url;
																const index = url.indexOf('/mfs');
																url = url.slice(index);
																content[key] = url;
																Logger.info(
																	`[导入物料] 上传文件成功: ${url}`,
																);
																resolve(true);
															})
													} catch (err) {
														const errMessage = `[导入物料] 上传文件失败(catch): ${err?.message | err?.msg | err}`;
														Logger.info(errMessage);
														reject(errMessage);
													}
  											}
  										});
  									}),
  								);
  							} else {
  								const that = this;
  								await Promise.all(
  									Object.entries(content).map(
  										([framework, frameworkContentInfo]) => {
  											return Promise.all(
  												['rtJs', 'editJs', 'coms', 'comsDef'].map((key) => {
  													const value = frameworkContentInfo[key];
  													return new Promise((resolve, reject) => {
  														if (!value) {
  															if (key === 'comsDef') {
  																resolve(true);
  															} else {
  																const errMessage = `[导入物料] 缺少 ${key} 资源`;
  																Logger.info(errMessage);
  																reject(errMessage);
  															}
  														} else {
  															Logger.info(`[导入物料] file: ${value.replace(/^\.\//, '')}`);
																const target = files.find(zipFileEntry => {
																	return zipFileEntry.entryName.replace(/^\.\//, '') === value.replace(/^\.\//, '')
																})
																const fileContent = target.getData().toString("utf8");

																if (key === 'comsDef') {
																	const res = JSON.parse(fileContent.toString('utf-8'));

																	try {
																		(async () => {
																			let scenes = await this.materialDao.getScene(EffectStatus.EFFECT);
																			Promise.all(res.map(async (remoteMaterial) => {
																				Logger.info(`fileContent map: ${JSON.stringify(remoteMaterial)}`);
																				const curScene = scenes.find(
																					(s) => s.type === remoteMaterial.scene_info?.type,
																				);
																				let curSceneId = curScene?.id;
	
																				if (!curScene && !!remoteMaterial.scene_info?.type) {
																					await that.materialDao.createScene([
																						{
																							create_time: Date.now(),
																							creator_id: userId,
																							type: remoteMaterial.scene_info?.type,
																							title: remoteMaterial.scene_info?.title,
																							order: 0,
																						},
																					]);
																					Logger.info(
																						`[导入物料] 创建新的场景: ${JSON.stringify(remoteMaterial.scene_info)}`,
																					);
																					scenes = await that.materialDao.getScene(EffectStatus.EFFECT);
																					Logger.info('[导入物料] 更新新的场景');
																					curSceneId = scenes.find(
																						(s) => s.type === remoteMaterial.scene_info?.type,
																					)?.id;
																				}
	
																				const material = await that.materialDao.getMaterialByNamespace(
																					remoteMaterial.namespace,
																				);
																				Logger.info(
																					`[导入物料] ${material ? '' : '不'}存在物料: ${remoteMaterial.namespace}`,
																				);
																				let materialId = material?.id;
	
																				if (material) {
																					Logger.info(
																						`[导入物料] 版本对比: ${material.version} vs ${remoteMaterial.version}`,
																					);
																					if (
																						compareVersion(material.version, remoteMaterial.version) < 0
																					) {
																						/** 更新物料记录 */
																						await that.materialDao.update(
																							{ id: materialId },
																							{
																								updatorId: userId,
																								updatorName: '',
																								title: remoteMaterial.name,
																								version: remoteMaterial.version,
																								sceneId: curSceneId,
																							},
																						);
																						Logger.info(
																							`[导入物料] 更新物料记录成功: ${materialId}`,
																						);
																					}
																				} else {
																					// 插入物料记录
																					const { id } = await that.materialDao.batchCreate([
																						{
																							title: remoteMaterial.name,
																							namespace: remoteMaterial.namespace,
																							version: remoteMaterial.version,
																							creatorId: userId,
																							creatorName: '',
																							type: remoteMaterial.type,
																							scopeStatus: MaterialScopeStatus.PUBLIC,
																							icon: remoteMaterial.icon || '',
																							previewImg: remoteMaterial.preview_img || '',
																							description: remoteMaterial.description || '',
																							sceneId: curSceneId,
																						},
																					]);
																					Logger.info(`[导入物料] 创建物料记录成功: ${id}`);
	
																					materialId = id;
																				}
	
																				await that.materialDao.createPub({
																					version: remoteMaterial.version,
																					materialId,
																					creatorId: userId,
																					creatorName: '',
																					content: remoteMaterial.content,
																				});
	
																				Logger.info(
																					`[导入物料] 创建物料发布记录成功: ${materialId}`,
																				);
	
																				try {
																					await that.handleMaterialTags(
																						materialId,
																						remoteMaterial.tags || [],
																					);
																				} catch (e) {
																					console.log('handleMaterialTags error', e);
																				}
																			}));
																		})();
																		resolve(true);
																	} catch (err) {
																		const errMessage = `[导入物料] 导入单组件失败(catch): ${err?.message | err?.msg | err}`;
																		Logger.info(errMessage);
																		reject(errMessage);
																	}
																} else {
																	const { version } = materialPub;
																	Logger.info(
																		`[导入物料] 读文件: ${COMLIB_KEY_TO_PATH_MAP[key]}`,
																	);
																	try {
																		Logger.info('[导入物料] 开始写文件');
																		API.Upload.staticServer({
																			content: fileContent.toString('utf-8'),
																			folderPath: `/material/${id}/${version}/${framework}`,
																			fileName: `${COMLIB_KEY_TO_PATH_MAP[key]}`,
																			noHash: true,
																			domainName: getRealDomain(req),
																		})
																			.then((res: { url: string }) => {
																				let url = res.url;
																				const index = url.indexOf('/mfs');
																				url = url.slice(index);
																				frameworkContentInfo[key] = url;
																				Logger.info(
																					`[导入物料] 上传文件成功: ${url}`,
																				);
																				resolve(true);
																			})
																	} catch (err) {
																		const errMessage = `[导入物料] 上传文件失败(catch): ${err?.message | err?.msg | err}`;
																		Logger.info(errMessage);
																		reject(errMessage);
																	}
																}
  														}
  													});
  												}),
  											);
  										},
  									),
  								);
  							}
  						} catch (err) {
								Logger.error('[导入物料] 读取声明中的文件失败', err);
  							state = 'error';
  						}

  						content = JSON.stringify(content);
  						Logger.info(`[导入物料] 更新物料content: ${content}`);
  					}

  					if (state === 'success') {
  						/** pub 记录 */
  						await this.materialDao.createPub({
  							version: materialPub.version,
  							materialId: id!,
  							creatorId: userId,
  							creatorName: '',
  							content,
  						});
  						Logger.info(`[导入物料] 创建发布记录成功: ${id}`);

  						/** 更新物料记录 */
  						await this.materialDao.update(
  							{ id: id! },
  							{
  								updatorId: userId,
  								updatorName: '',
  								title: material.name,
  								version: materialPub.version,
  								sceneId,
  							},
  						);

  						curMaterialId = id;

  						Logger.info(`[导入物料] 更新物料记录成功: ${id}`);
  					}
  					updateMaterial.state = state;
  				}

  				try {
  					const tags = material.tags;
  					if (curMaterialId && Array.isArray(tags)) {
  						Logger.info(`[导入物料] tags: ${JSON.stringify(tags)}`);
  						await this.handleMaterialTags(curMaterialId, tags);
  						Logger.info('[导入物料] 创建 tags 成功');
  					}
  				} catch (e) {
  					Logger.info(`[导入物料] 创建 tags 失败: ${e?.message}`);
  				}
  			}),
  		);
  	}

  	return {
  		code: 1,
  		data: {
  			createMaterials,
  			updateMaterials,
  		},
  		message: 'success',
  	};
  }

  async handleMaterialTags(materialId: number, tagNames: string[] = []) {
  	await this.materialDao.deleteRelationByMaterialId([materialId]);

  	if (tagNames.length) {
  		let tags = await this.materialDao.getTags({
  			status: EffectStatus.EFFECT,
  		});
  		const willInsetTagNames = tagNames.filter(
  			(name) => !tags.find((t) => t.title === name),
  		);
  		willInsetTagNames.length &&
        (await this.materialDao.createTag(
        	willInsetTagNames.map((name) => {
        		return {
        			order: 0,
        			title: name,
        			scene_id: null,
        			creator_id: '2',
        			parent_id: null,
        			create_time: Date.now(),
        		};
        	}),
        ));

  		tags = await this.materialDao.getTags({ status: EffectStatus.EFFECT });
  		await this.materialDao.bulkInsertMaterialTagRelation(
  			tagNames.map((name) => {
  				const curTag = tags.find((t) => t.title === name);

  				return {
  					material_id: materialId,
  					tag_id: curTag?.id,
  					creator_id: '2',
  					creator_name: '2',
  					create_time: Date.now(),
  				};
  			}),
  		);
  	}
  }

  async getMaterialSceneId(
  	scene?: { type: string; title: string },
  	userId?: string,
  ) {
  	if (scene && scene.type) {
  		let scenes = await this.materialDao.getScene(EffectStatus.EFFECT);
  		const curScene = scenes.find((s) => s.type === scene.type);
  		let curSceneId = curScene?.id;

  		if (!curScene) {
  			await this.materialDao.createScene([
  				{
  					create_time: Date.now(),
  					creator_id: userId || '',
  					type: scene.type,
  					title: scene.title,
  					order: 0,
  				},
  			]);
  			scenes = await this.materialDao.getScene(EffectStatus.EFFECT);

  			curSceneId = scenes.find((s) => s.type === scene.type)?.id;
  		}

  		return curSceneId ?? null;
  	}

  	return null;
  }

  async importBetaVersionForComLib(body) {
  	const { userId, namespace, externals: oldExternals, rtJs, editJs, rtComJs } = body;
  	Logger.info(
  		`[导入组件库 Beta 版本] 物料 namespace: ${namespace}，用户ID: ${userId}`,
  	);

  	const externals = safeParse(oldExternals, oldExternals);
  	const [existMaterial] =
      await this.materialDao.getLatestMaterialsByNamespace({
      	namespaces: [namespace],
      });

  	if (!existMaterial) {
  		return { code: -1, message: '当前组件库物料不存在' };
  	}

  	let version;
  	const [[mainVersion], [branchVersion]] = await Promise.all([
  		this.materialDao.getMaterialVersions({ namespace: namespace }),
  		this.materialDao.getMaterialVersions({
  			namespace: namespace,
  			isBranch: true,
  		}),
  	]);

  	if (!branchVersion) {
  		// 分支版本不存在
  		version = mainVersion.version + '-beta.1';
  	} else if (!mainVersion) {
  		// 主版本不存在
  		const [mainVersion, versionNum = 0] =
        branchVersion.version.split('-beta.');
  		version = mainVersion + '-beta.' + (+versionNum + 1);
  	} else if (
  		branchVersion.version.startsWith(mainVersion.version + '-beta.')
  	) {
  		// 主版本相同
  		const [mainVersion, versionNum = 0] =
        branchVersion.version.split('-beta.');
  		version = mainVersion + '-beta.' + (+versionNum + 1);
  	} else if (checkIsAllowSelect(mainVersion, branchVersion)) {
  		// 比较是否主版本更大
  		version = mainVersion.version + '-beta.1';
  	} else {
  		// 主版本小，分支版本更大
  		const [mainVersion, versionNum = 0] =
        branchVersion.version.split('-beta.');
  		version = mainVersion + '-beta.' + (+versionNum + 1);
  	}

  	const [editUrl, rtUrl, rtComUrl] = await Promise.all(
  		[
  			{ code: editJs.buffer, fileName: 'edit.js' },
  			{ code: rtJs.buffer, fileName: 'rt.js' },
  			rtComJs ? { code: rtComJs.buffer, fileName: 'rtCom.js' } : undefined,
  		]
  			.filter(Boolean)
  			.map(({ code, fileName }) => {
  				return new Promise((resolve, reject) => {
  					API.Upload.staticServer({
  						content: code
  							.toString('utf8')
  							.replace(
  								new RegExp(`version:"[^"]*",namespace:"${namespace}"`),
  								`version:"${version}",namespace:"${namespace}"`,
  							),
  						folderPath: `/material/${existMaterial.material_id}/${version}`,
  						fileName,
  						noHash: true,
  					})
  						.then((res: { url: string }) => {
  							let url = res.url;
  							resolve(url.slice(url.indexOf('/mfs')));
  						})
  						.catch((err) => {
  							reject(err?.message | err?.mgs | err);
  						});
  				});
  			}),
  	);

  	const content = JSON.stringify({ coms: rtComUrl, editJs: editUrl, rtJs: rtUrl, externals });
  	/** pub 记录 */
  	await this.materialDao.createPub({
  		version,
  		materialId: existMaterial.material_id,
  		creatorId: userId,
  		creatorName: userId,
  		content,
  	});
  	Logger.info(
  		`[导入组件库 Beta 版本] 物料 namespace: ${namespace}，版本: ${version}，产物: ${content}`,
  	);

  	return {
  		code: 1,
  		data: {
  			coms: rtComUrl,
  			editJs: editUrl,
  			rtJs: rtUrl,
  		},
  		message: '导入成功',
  	};
  }

  async initExternalForComLib(body) {
  	const { id, userId, externals } = body;
  	const versions = await this.materialDao.getMaterialVersions({ materialId: id, needContent: true });

  	for (const version of versions) {
  		const content = safeParse(version.content);
  		if (content.react) {
  			Object.keys(content).forEach((key) => {
  				externals[key] && !content[key].externals?.length && (content[key].externals = externals[key]);
  			});
  		} else {
  			externals.react && !content.externals?.length && (content.externals = externals.react ?? []);
  		}

  		await this.materialDao.updatePub(
  			{ id: version.material_pub_id },
  			{ content: JSON.stringify(content), updatorName: userId, updatorId: userId }
  		);
  	}
  }

  async updateContentByNamespace_Version(body) {
  	const { userId, namespace, version, content } = body;
  	const [material] = await this.materialDao.getContentByNamespace_Version(namespace, version);

  	if (!material) {
  		return { code: -1, message: '当前物料对应版本不存在' };
  	}

  	await this.materialDao.updatePub({ id: material.material_pub_id }, { content, updatorName: userId, updatorId: userId });
  }

  async vscCreateComlib(
  	{
  		userId,
  		content,
  		editCode,
  		runtimeCode,
  		runtimeComponentsMapCode,
  		version,
  		namespace,
  		tags,
  		title,
  		scene,
  	},
  	req,
  ) {
  	Logger.info(`[vsc插件物料发布] 物料场景信息: ${JSON.stringify(scene)}`);
  	const [existMaterial] = await this.materialDao.getMaterialByNamespaces({
  		namespaces: [namespace],
  	});
  	let curMaterialId = existMaterial?.id;
  	Logger.info(`[vsc插件物料发布] 当前物料ID: ${curMaterialId}`);
  	let data = {};
  	const sceneId = await this.getMaterialSceneId(scene);
  	Logger.info(`[vsc插件物料发布] sceneId: ${sceneId}`);

  	if (!existMaterial) {
  		const materialVersion = '1.0.0';
  		const { id: materialId } = await this.materialDao.batchCreate([
  			{
  				title: title,
  				namespace,
  				version: materialVersion,
  				creatorId: userId,
  				creatorName: userId,
  				type: ExtName.COM_LIB,
  				scopeStatus: MaterialScopeStatus.PUBLIC,
  				icon: '',
  				previewImg: '',
  				description: '',
  				sceneId,
  			},
  		]);
  		Logger.info(
  			`[vsc插件物料发布] 创建物料成功（materialId）: ${materialId}`,
  		);
  		curMaterialId = materialId;
  		if (editCode) {
  			const [editUrl, rtUrl, rtComUrl] = await Promise.all(
  				[
  					{ code: editCode, fileName: 'edit.js' },
  					{ code: runtimeCode, fileName: 'rt.js' },
  					{ code: runtimeComponentsMapCode, fileName: 'rtCom.js' },
  				].map(({ code, fileName }) => {
  					return new Promise((resolve, reject) => {
  						API.Upload.staticServer({
  							content: code.replace(
  								`version:"${version}"`,
  								`version:"${materialVersion}"`,
  							),
  							folderPath: `/material/${materialId}/${materialVersion}`,
  							fileName,
  							noHash: true,
  						})
  							.then((res: { url: string }) => {
  								let url = res.url;
  								resolve(url.slice(url.indexOf('/mfs')));
  							})
  							.catch((err) => {
  								reject(err?.message | err?.mgs | err);
  							});
  					});
  				}),
  			);

  			data = {
  				coms: rtComUrl,
  				editJs: editUrl,
  				rtJs: rtUrl,
  			};

  			await this.materialDao.createPub({
  				version: materialVersion,
  				materialId,
  				creatorId: userId,
  				creatorName: userId,
  				content: JSON.stringify({
  					coms: rtComUrl,
  					editJs: editUrl,
  					rtJs: rtUrl,
  				}),
  			});
  		} else {
  			const frameworks = tags.filter((tag) =>
  				['react', 'vue2', 'vue3'].includes(tag),
  			);
  			await Promise.all(
  				frameworks.map(async (framework) => {
  					const frameworkContentInfo = content[framework];
  					const { editJs, rtJs, coms, hmCode } = frameworkContentInfo;
  					const [editUrl, rtUrl, rtComUrl, hmCodeUrl] = await Promise.all(
  						[
  							{ code: editJs, fileName: 'edit.js' },
  							{ code: rtJs, fileName: 'rt.js' },
  							{ code: coms, fileName: 'rtCom.js' },
								{ code: hmCode, fileName: "hmCode.zip"}
  						].map(({ code, fileName }) => {
  							return new Promise((resolve, reject) => {
  								if (!code) {
										resolve("")
									} else {
										API.Upload.staticServer({
											// TODO: 不能暴力替换，抽空改下
											content: typeof code === "string" ? code.replace(
												`version:"${version}"`,
												`version:"${materialVersion}"`,
											) : code,
											// content: code.replace(
											// 	`version:"${version}"`,
											// 	`version:"${materialVersion}"`,
											// ),
											folderPath: `/material/${materialId}/${materialVersion}/${framework}`,
											fileName,
											noHash: true,
										})
											.then((res: { url: string }) => {
												let url = res.url;
												resolve(url.slice(url.indexOf('/mfs')));
											})
											.catch((err) => {
												reject(err?.message | err?.mgs | err);
											});
									}
  							});
  						}),
  					);
  					data[framework] = {
  						coms: rtComUrl,
  						editJs: editUrl,
  						rtJs: rtUrl,
							hmCode: hmCodeUrl
  					};
  					frameworkContentInfo.editJs = editUrl;
  					frameworkContentInfo.rtJs = rtUrl;
  					frameworkContentInfo.coms = rtComUrl;
						frameworkContentInfo.hmCode = hmCodeUrl;
  				}),
  			);
  			/** pub 记录 */
  			await this.materialDao.createPub({
  				version: materialVersion,
  				materialId,
  				creatorId: userId,
  				creatorName: userId,
  				content: JSON.stringify(content),
  			});
  		}
  		Logger.info('[vsc插件物料发布] 创建pub成功');
  	} else {
  		const materialId = existMaterial.id;
  		const materialVersion = getNextVersion(existMaterial.version);

  		if (editCode) {
  			// 兼容
  			const [editUrl, rtUrl, rtComUrl] = await Promise.all(
  				[
  					{ code: editCode, fileName: 'edit.js' },
  					{ code: runtimeCode, fileName: 'rt.js' },
  					{ code: runtimeComponentsMapCode, fileName: 'rtCom.js' },
  				].map(({ code, fileName }) => {
  					return new Promise((resolve, reject) => {
  						API.Upload.staticServer({
  							// TODO: 不能暴力替换，抽空改下
  							content: code.replace(
  								`version:"${version}"`,
  								`version:"${materialVersion}"`,
  							),
  							folderPath: `/material/${materialId}/${materialVersion}`,
  							fileName,
  							noHash: true,
  						})
  							.then((res: { url: string }) => {
  								let url = res.url;
  								resolve(url.slice(url.indexOf('/mfs')));
  							})
  							.catch((err) => {
  								reject(err?.message | err?.mgs | err);
  							});
  					});
  				}),
  			);
  			data = {
  				coms: rtComUrl,
  				editJs: editUrl,
  				rtJs: rtUrl,
  			};
  			/** pub 记录 */
  			await this.materialDao.createPub({
  				version: materialVersion,
  				materialId,
  				creatorId: userId,
  				creatorName: userId,
  				content: JSON.stringify({
  					coms: rtComUrl,
  					editJs: editUrl,
  					rtJs: rtUrl,
  				}),
  			});
  		} else {
  			const frameworks = tags.filter((tag) =>
  				['react', 'vue2', 'vue3'].includes(tag),
  			);
  			await Promise.all(
  				frameworks.map(async (framework) => {
  					const frameworkContentInfo = content[framework];
  					const { editJs, rtJs, coms, hmCode } = frameworkContentInfo;
  					const [editUrl, rtUrl, rtComUrl, hmCodeUrl] = await Promise.all(
  						[
  							{ code: editJs, fileName: 'edit.js' },
  							{ code: rtJs, fileName: 'rt.js' },
  							{ code: coms, fileName: 'rtCom.js' },
								{ code: hmCode, fileName: "hmCode.zip"}
  						].map(({ code, fileName }) => {
  							return new Promise((resolve, reject) => {
  								if (!code) {
										resolve("")
									} else {
										API.Upload.staticServer({
											// TODO: 不能暴力替换，抽空改下
											content: typeof code === "string" ? code.replace(
												`version:"${version}"`,
												`version:"${materialVersion}"`,
											) : code,
											// content: code.replace(
											// 	`version:"${version}"`,
											// 	`version:"${materialVersion}"`,
											// ),
											folderPath: `/material/${materialId}/${materialVersion}/${framework}`,
											fileName,
											noHash: true,
										})
											.then((res: { url: string }) => {
												let url = res.url;
												resolve(url.slice(url.indexOf('/mfs')));
											})
											.catch((err) => {
												reject(err?.message | err?.mgs | err);
											});
									}
  							});
  						}),
  					);
  					data[framework] = {
  						coms: rtComUrl,
  						editJs: editUrl,
  						rtJs: rtUrl,
							hmCode: hmCodeUrl
  					};
  					frameworkContentInfo.editJs = editUrl;
  					frameworkContentInfo.rtJs = rtUrl;
  					frameworkContentInfo.coms = rtComUrl;
						frameworkContentInfo.hmCode = hmCodeUrl;
  				}),
  			);
  			/** pub 记录 */
  			await this.materialDao.createPub({
  				version: materialVersion,
  				materialId,
  				creatorId: userId,
  				creatorName: userId,
  				content: JSON.stringify(content),
  			});
  		}
  		Logger.info('[vsc插件物料发布] 更新物料 -> 创建pub成功');

  		if (/^(\d+)\.(\d+)\.(\d+)$/.test(materialVersion)) {
  			/** 更新物料记录 */
  			await this.materialDao.update(
  				{ id: materialId },
  				{
  					updatorId: userId,
  					updatorName: userId,
  					title: title,
  					version: materialVersion,
  					sceneId,
  				},
  			);
  			Logger.info('[vsc插件物料发布] 更新物料成功');
  		}
  	}
  	if (curMaterialId) {
  		await this.handleMaterialTags(curMaterialId, tags);
  	}

  	return {
  		code: 1,
  		data,
  		message: '发布成功',
  	};
  }

  async getNextVersionByNamespace(namespace: string) {
  	const material = await this.materialDao.getMaterialByNamespace(namespace);

  	Logger.info('1-[根据namespace查询下一个版本] 查询物料成功');

  	let version = '1.0.0';

  	if (material) {
  		version = getNextVersion(material.version);
  		Logger.info(
  			`2-[根据namespace查询下一个版本] 已存在物料，下一个版本: ${version}`,
  		);
  	} else {
  		Logger.info(
  			`2-[根据namespace查询下一个版本] 不存在物料，默认版本: ${version}`,
  		);
  	}

  	return {
  		code: 1,
  		data: {
  			version,
  		},
  		message: '获取下一个版本成功',
  	};
  }
}

function compareVersion(v1, v2) {
	v1 = v1.split('.');
	v2 = v2.split('.');
	const len = Math.max(v1.length, v2.length);

	while (v1.length < len) {
		v1.push('0');
	}
	while (v2.length < len) {
		v2.push('0');
	}

	for (let i = 0; i < len; i++) {
		const num1 = parseInt(v1[i]);
		const num2 = parseInt(v2[i]);

		if (num1 > num2) {
			return 1;
		} else if (num1 < num2) {
			return -1;
		}
	}

	return 0;
}
