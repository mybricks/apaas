import { DOBase } from '@mybricks/rocker-dao';
import {
	AnyType,
	ComponentForCreateComLib,
	CreateMaterialComponent,
	Material,
	MaterialPub,
	TagSQLRes,
	CreateTagParams,
	TagRelation,
	CreateSceneParams,
} from './types';
import { genMainIndexOfDB } from '../../utils';
import { EffectStatus, ExtName, MaterialScopeStatus } from './const';

export default class MaterialDao extends DOBase {
	async batchCreate(
		materials: Array<{
      title: string;
      namespace: string;
      version: string;
      creatorId: string;
      creatorName: string;
      type: ExtName;
      icon?: string;
      previewImg?: string;
      description?: string;
      meta?: string;
      status?: EffectStatus;
      scopeStatus?: MaterialScopeStatus;
			sceneId?: number;
    }>,
	) {
		const result = await this.exe<AnyType>('material:batchCreate', {
			materials: materials.map((m) => {
				return {
					...m,
					id: genMainIndexOfDB(),
					status: m.status ?? EffectStatus.EFFECT,
					scopeStatus: m.scopeStatus ?? MaterialScopeStatus.PRIVATE,
					updatorId: m.creatorId,
					updatorName: m.creatorName,
					updateTime: Date.now(),
					createTime: Date.now(),
					sceneId: m.sceneId ?? null,
				};
			}),
		});

		return {
			id: result?.insertId ?? null,
		};
	}

	async getMaterialsByNamespace_Version(components: CreateMaterialComponent[]) {
		return await this.exe<MaterialPub[]>(
			'material:getMaterialsByNamespace_Version',
			{ components },
		);
	}

	/** 根据 namespaces 获取最新的物料 */
	async getLatestMaterialsByNamespace(params: {
    namespaces: string[];
    status?: EffectStatus;
    needContent?: boolean;
  }) {
		return await this.exe<Material[]>(
			'material:getLatestMaterialsByNamespace',
			params,
		);
	}

	/** 根据 namespaces 获取最新的物料，版本号为正式版 */
	async getLatestMaterialByNamespaceOfMainBranch(params: { namespace: string; status?: EffectStatus; needContent?: boolean }) {
		return await this.exe<Material[]>(
			'material:getLatestMaterialByNamespaceOfMainBranch',
			params,
		);
	}

	/** 根据 pub ids 获取物料 */
	async getMaterialPubInfoByIds(params: { ids: number[] }) {
		return await this.exe<Material[]>(
			'material:getMaterialPubInfoByIds',
			params,
		);
	}

	async update(
		query: { id: number },
		nextInfo: {
      updatorId: string;
      updatorName: string;
      filePubId?: number;
      version?: string;
      title?: string;
      icon?: string;
      description?: string;
      previewImg?: string;
      status?: EffectStatus;
      scopeStatus?: MaterialScopeStatus;
      sceneId?: number;
      meta?: string;
    },
	) {
		await this.exe('material:update', {
			query,
			nextInfo: { ...nextInfo, updateTime: Date.now() },
		});
	}

	async getContentByNamespace_Version(namespace: string, version: string) {
		return await this.exe<Material[]>(
			'material:getContentByNamespace_Version',
			{ namespace, version },
		);
	}

	async getMaterials(params: {
    offset: number;
    pageSize: number;
    keyword?: string;
    userId?: string;
    type: ExtName[];
		tags?: string[] | number[];
    scene?: string | number;
    status?: EffectStatus[];
    scopeStatus?: MaterialScopeStatus[];
  }) {
		return await this.exe<Material[]>('material:getMaterials', params);
	}

	async getMaterialsTotal(params: {
    offset: number;
    pageSize: number;
    keyword?: string;
    type: ExtName[];
		scene?: string | number;
		tags?: string[] | number[];
    status?: EffectStatus[];
    scopeStatus?: MaterialScopeStatus[];
  }) {
		return await this.exe<Array<{ total: number }>>(
			'material:getMaterialsTotal',
			params,
		);
	}

	async createPub(query: {
    version: string;
    materialId: number;
    createTime?: number;
    creatorId: string;
    creatorName: string;
    content: string;
    status?: EffectStatus;
    commitInfo?: string;
  }): Promise<{ id: number | null }> {
		const result = await this.exe<AnyType>('material:createPub', {
			...query,
			id: genMainIndexOfDB(),
			status: query.status ?? EffectStatus.EFFECT,
			createTime: query.createTime ?? Date.now(),
			commitInfo: query.commitInfo ?? '',
		});

		return {
			id: result && result.insertId ? result.insertId : null,
		};
	}

	async updatePub(
		query: { materialId?: number; id?: number; version?: string },
		nextInfo: {
      updatorId: string;
      updatorName: string;
      content?: string;
      commitInfo?: string;
      status?: EffectStatus;
    },
	) {
		if (query.id || (query.materialId && query.version)) {
			await this.exe<AnyType>('material:updatePub', {
				query,
				nextInfo: {
					...nextInfo,
					updateTime: Date.now(),
					content: nextInfo.content ?? null,
					status:
            nextInfo.status === undefined || nextInfo.status === null
            	? undefined
            	: String(nextInfo.status),
				},
			});
		}
	}

	async batchCreatePub(
		materialPubs: Array<{
      version: string;
      materialId: number;
      createTime?: number;
      creatorId: string;
      creatorName: string;
      content: string;
      status?: EffectStatus;
      commitInfo?: string;
    }>,
	) {
		const result = await this.exe<AnyType>('material:batchCreatePub', {
			materialPubs: materialPubs.map((m) => {
				return {
					...m,
					id: genMainIndexOfDB(),
					status: m.status ?? EffectStatus.EFFECT,
					createTime: m.createTime ?? Date.now(),
					commitInfo: m.commitInfo ?? '',
				};
			}),
		});

		return {
			id: result && result.insertId ? result.insertId : null,
		};
	}
	
	async getMaterialContentByNamespaces({ components, type = ExtName.COMPONENT }: {
		type?: string
		components: ComponentForCreateComLib[]
	}) {
		return await this.exe<Material[]>(
			'material:getMaterialContentByNamespaces',
			{ components, type },
		);
	}
	
	async getMaterialVersions(query: { materialId?: number; namespace?: string; isBranch?: boolean; needContent?: boolean }) {
		return await this.exe<Material[]>('material:getMaterialVersions', query);
	}

	async getTemplateBySceneIdList(extNames: string[], templateGuideTypes?: string[]) {
		const data = await this.exe<any[]>('material_scene:getTemplateByExtName', { extNames, templateGuideTypes } );

		return data;
	}

	/** 根据物料 id 获取所有 tag 关系 */
	async getTagRelations(params: { materialIds: number[]; needTitle?: number; needOnline?: number }) {
		const data = await this.exe<TagRelation[]>('material_scene:getTagRelationsByMaterialId', params);

		return data;
	}

	async getScene(status: EffectStatus, types?: string[]) {
		return await this.exe<any[]>('material_scene:getScene', {
			status,
			types,
		});
	}

	async getSceneById(id: number) {
		const result = await this.exe('material_scene:getSceneById', { id });

		return result?.[0];
	}

	async getTemplateBySceneId(sceneId: number) {
		return await this.exe<any[]>('material_scene:getTemplateBySceneId', {
			sceneId
		});
	}

	

	async getTags(
		params: { status: EffectStatus; sceneId?: number; checkCategory?: boolean; isCategory?: boolean; tagIds?: number[] }
	): Promise<TagSQLRes[]> {
		const data = await this.exe<TagSQLRes[]>('material_scene:getTags', params);

		return data;
	}

	async createTag(params: Array<CreateTagParams & { create_time: number }>) {
		return await this.exe('material_scene:bulkInsertTag', {
			tags: params,
		});
	}

	async deleteTag(id: number): Promise<unknown> {
		return await this.exe('material_scene:deleteTag', { id });
	}

	async updateTag(params: {
    title?: string;
    id: number;
    updator_id: string;
    status?: EffectStatus;
    order?: number;
    scene_id?: number;
    parent_id: number | null;
  }) {
		await this.exe('material_scene:updateTag', {
			...params,
			update_time: Date.now(),
		});
	}

	/** 批量插入物料标签关系记录 */
	async bulkInsertMaterialTagRelation(
		relations: any[],
	) {
		await this.exe('material_scene:bulkInsertMaterialTagRelation', {
			relations,
		});
	}

	/** 批量插入物料 */
	async bulkInsertMaterial(materials: any[]) {
		await this.exe('material_scene:bulkInsertMaterial', { materials });
	}

	async getMaterialContentByPubIds(pubIds: number[]) {
		return await this.exe<any[]>('material_scene:getMaterialContentByPubIds', {
			pubIds,
		});
	}

	async getMaterialListByMaterialId(materialIds: number[]) {
		return await this.exe<any[]>(
			'material_scene:getMaterialListByMaterialId',
			{ materialIds },
		);
	}

	async updateMaterialById(materialId: number, params: object) {
		await this.exe('material_scene:updateMaterialById', {
			id: materialId,
			...params,
		});
	}

	async deleteRelationByMaterialId(materialIds: number[]) {
		await this.exe('material_scene:deleteRelationByMaterialId', {
			materialIds,
		});
	}

	async getMaterialByNamespace(namespace: string) {
		const result = await this.exe('material:getMaterialByNamespace', {
			namespace
		});
		return result && result[0];
	}

	async createScene(params: Array<CreateSceneParams & { create_time: number }>) {
		return await this.exe('material_scene:bulkInsertScene', {
			scenes: params,
		});
	}
	
	async getMaterialByNamespaces(params: {
		namespaces: string[]
	}) {
		const result = await this.exe<Material[]>('material:getMaterialByNamespaces', params);
		return result;
	}
}
