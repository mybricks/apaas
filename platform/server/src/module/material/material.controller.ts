import {
	Body,
	Controller,
	Get,
	Inject,
	Post,
	Query,
	Req,
	Res,
	UploadedFile,
	UploadedFiles,
	UseInterceptors,
} from '@nestjs/common';
import {
	FileFieldsInterceptor,
	FileInterceptor,
} from '@nestjs/platform-express';
import { Logger } from '@mybricks/rocker-commons';
import { isNil } from 'lodash';
import { Request, Response } from 'express';
import MaterialService from './material.service';
import API from '@mybricks/sdk-for-app/api';
import { CodeType, EffectStatus, ExtName, MaterialScopeStatus, MaterialType } from './const';
import { AnyType } from './types';

export const INIT_PAGE_SIZE = 20;
export const INIT_PAGE_INDEX = 1;

@Controller('api/material')
export default class MaterialController {
  @Inject(MaterialService)
  	materialService: MaterialService;

  /** 发布组件，云组件定制 */
  @Post('/component/create')
  async createCloudComponent(@Body() body) {
  	const {
  		component: { namespace, sceneType, componentType, userId, ...components },
  		config,
  	} = body;

  	if (!namespace) {
  		return { code: 0, message: '参数 namespace 不能为空' };
  	} else if (!userId) {
  		return { code: 0, message: '参数 userId 不能为空' };
  	}

  	return await this.materialService.createComponents({
  		components: [{ ...components, namespace }],
  		userId,
  		sceneType: sceneType || componentType,
  		isCloudComponent: true,
  		config,
  	});
  }

  /** 组件库，导入分支版本 */
  @Post('/com_lib/beta/import')
  @UseInterceptors(
  	FileFieldsInterceptor([
  		{ name: 'rtJs', maxCount: 1 },
  		{ name: 'editJs', maxCount: 1 },
  		{ name: 'rtComJs', maxCount: 1 },
  	]),
  )
  async importBetaVersionForComLib(
    @Body() body,
    @UploadedFiles() files: AnyType,
  ) {
  	const { namespace, userId } = body;

  	if (!userId) {
  		return { code: 0, message: '当前用户不存在' };
  	} else if (!namespace) {
  		return { code: 0, message: '组件库的 namespace 不能为空' };
  	}

  	return await this.materialService.importBetaVersionForComLib({
  		...body,
  		rtJs: files.rtJs?.[0],
  		editJs: files.editJs?.[0],
  		rtComJs: files.rtComJs?.[0],
  	});
  }

	/** 组件库，导入分支版本 */
	@Post('/com_lib/external/init')
  async initExternalForComLib(@Body() body) {
  	const { id, userId, externals } = body;

  	if (!userId || !externals || !id) {
  		return { code: 0, message: '参数 id、userId、externals 不能为空' };
  	}

  	await this.materialService.initExternalForComLib(body);
  	return { code: 1, message: '初始化成功' };
  }

	/** 组件库，导入分支版本 */
	@Post('/namespace/content/update')
	async updateContentByNamespace_Version(@Body() body) {
  	const { namespace, userId, version, content } = body;

  	if (!userId || !namespace || !version || !content) {
  		return { code: 0, message: '参数 userId、namespace、version、content 不能为空' };
  	}

		try {
			JSON.parse(content);
		} catch (e) {
			return { code: 0, message: 'content 为非合法 JSON 字符串' };
		}

		await this.materialService.updateContentByNamespace_Version(body);
  	return { code: 1, message: '更新成功' };
	}

  /** 创建组件或者组件库物料，VsCode 创建会使用 */
  @Post('/create')
	async createMaterial(@Body() body) {
  	const { isComLib, config } = body;

  	let userId = body.userId;

  	if (!userId) {
  		return { code: 0, message: '参数 userId 不能为空' };
  	}
  	// TODO: 插件发布传的是email
  	if (config) {
  		try {
  			const user = await API.User.getUserInfo(userId);
  			userId = user.id;
  		} catch (e) {
  			return { code: 0, message: '当前用户不存在' };
  		}
  	}

  	/** 发布组件库 */
  	if (isComLib) {
  		const {
  			fileId,
  			namespace,
  			comLibEditor,
  			comLibRuntime,
  			title,
  			commitInfo,
  			comLibRuntimeMap = '',
  			comLibEditorMap = '',
  			tags,
  		} = body;

  		if (!fileId && !namespace) {
  			return { code: 0, message: '参数 namespace、fileId 不能都为空' };
  		}

  		return await this.materialService.createComLib({
  			fileId,
  			userId,
  			title,
  			namespace,
  			commitInfo,
  			comLibEditor,
  			comLibRuntime,
  			comLibRuntimeMap,
  			comLibEditorMap,
  			tags,
  		});
  	} else {
  		const { components, sceneType, componentType, config = {} } = body;
  		if (!components) {
  			return { code: 0, message: '参数 components 不能为空' };
  		}

  		if (!Array.isArray(components)) {
  			return { code: 0, message: '参数 components 必须为对象数组类型' };
  		}

  		for (let idx = 0; idx < components.length; idx++) {
  			const { namespace } = components[idx];

  			if (!namespace) {
  				return {
  					code: 0,
  					message: `第 ${idx + 1} 组件，描述参数 namespace 不能为空`,
  				};
  			}
  		}

  		return await this.materialService.createComponents({
  			components: components,
  			userId,
  			sceneType: sceneType || componentType,
  			config,
  		});
  	}
	}

  @Post('/vsc/createComlib')
  async vscCreateComlib(@Body() body, @Req() request: Request) {
  	let userId = body.userId;
  	if (!userId) {
  		return { code: 0, message: '当前用户不存在，请正确填写userName' };
  	}
  	try {
  		const user = await API.User.getUserInfo(userId);
  		userId = user.id;
  	} catch (e) {
  		return { code: 0, message: '当前用户不存在，请正确填写userName' };
  	}

  	const {
  		content,
  		editCode,
  		runtimeCode,
  		runtimeComponentsMapCode,
  		version,
  		namespace,
  		tags,
  		title,
  		scene,
  	} = body;

  	return await this.materialService.vscCreateComlib(
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

  			// 场景: 默认PC
  			scene: scene || {
  				type: 'PC',
  				title: 'PC',
  			},
  		},
  		request,
  	);
  }

  @Get('/namespace/content')
  async getMaterialContentByNamespace(
    @Query() query: { namespace: string; version: string; codeType: AnyType },
  ) {
  	const { namespace, version, codeType } = query;
  	return await this.materialService.getContentByNamespace_Version(
  		namespace,
  		version,
  		codeType ?? CodeType.EDITOR,
  	);
  }

  @Get('/list')
  async getMaterials(
    @Query('pageSize') pageSize: number,
    @Query('page') page: number,
    @Query('keyword') keyword: string,
    @Query('type') type: string,
    @Query('status') status: string,
    @Query('scopeStatus') scopeStatus: string,
    @Query('scene') scene: string,
    @Query('userId') userId: string,
    @Query('tags') tags: string,
		@Query('materialIds') materialIds: string,
  ) {
  	return {
  		code: 1,
  		data: await this.materialService.getMaterials({
  			type: type ? (type.split(',') as ExtName[]) : undefined,
  			pageSize: Number(pageSize) || INIT_PAGE_SIZE,
  			page: Number(page) || INIT_PAGE_INDEX,
  			scene,
  			tags: tags ? tags.split(',') : undefined,
  			status: status
  				? (status.split(',') as unknown as EffectStatus[])
  				: [EffectStatus.EFFECT],
  			keyword: keyword ?? '',
  			scopeStatus: scopeStatus
  				? (scopeStatus
  					.split(',')
  					.map(Number) as unknown as MaterialScopeStatus[])
  				: [
  					MaterialScopeStatus.PRIVATE,
  					MaterialScopeStatus.WORKSPACE,
  					MaterialScopeStatus.PUBLIC,
  					MaterialScopeStatus.TOFAREND,
  					MaterialScopeStatus.FROMFAREND,
  				],
  			userId,
				materialIds: materialIds? (materialIds.split(",")) : undefined
  		}),
  	};
  }

  @Post('/tag/create')
  async createTag(
    @Body('tags') tags: AnyType,
    @Body('isCategory') isCategory: boolean,
  ) {
  	await this.materialService.createTag(
      tags as unknown as AnyType[],
      isCategory,
  	);

  	return {
  		code: 1,
  		data: null,
  		message: 'success',
  	};
  }

  @Get('/tag/list')
  async getTags(
    @Query('scene_id') sceneId: number,
    @Query('status') status: AnyType,
    @Query('isCategory') isCategory: number,
  ) {
  	return {
  		code: 1,
  		data: await this.materialService.getTags({
  			status: status ? Number(status) : EffectStatus.EFFECT,
  			sceneId: Number(sceneId) || undefined,
  			isCategory: isNil(isCategory) ? undefined : Boolean(Number(isCategory)),
  		}),
  		message: 'success',
  	};
  }

  @Post('/tag/delete')
  async deleteTag(@Body('id') tagId: number) {
  	await this.materialService.deleteTag(tagId);

  	return {
  		code: 1,
  		data: null,
  		message: 'success',
  	};
  }

  @Post('/tag/update')
  async updateTag(
    @Body('title') title: string,
    @Body('id') id: number,
    @Body('updator_id') updator_id: string,
    @Body('status') status: AnyType,
    @Body('order') order: number,
    @Body('scene_id') scene_id: number,
    @Body('parent_id') parent_id?: number | null,
  ) {
  	await this.materialService.updateTag({
  		title,
  		id,
  		order: Number(order),
  		updator_id,
  		status,
  		scene_id: Number(scene_id) || undefined,
  		parent_id: parent_id ?? null,
  	});

  	return {
  		code: 1,
  		data: null,
  		message: 'success',
  	};
  }

  @Get('/components/combo')
  async componentsCombo(
    @Query('components') components: string,
    @Query('comboType') comboType: AnyType,
    @Res() res: Response,
  ) {
  	const data = await this.materialService.componentsCombo(
  		(components || '').split(',').reduce((pre, item) => {
  			const [namespace, version] = item.split('@');
  			return [...pre, { namespace, version }];
  		}, []),
  		comboType,
  	);

  	if (data.code === 1) {
  		res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  		res.setHeader('Cache-Control', 'max-age=31536000');
  		res.status(200).send(data.resource).end();
  	} else {
  		res.status(500).send(data.message).end();
  	}
  }

  @Post('/checkNamespaceUsedByCdm')
  async checkNamespaceUsedByCdm(@Body() body) {
  	const { namespace, config } = body;
  	if (!namespace) {
  		return {
  			code: 0,
  			message: 'namespace 不能为空',
  		};
  	}

  	return await this.materialService.checkNamespaceUsedByCdm(
  		namespace,
  		config,
  	);
  }

  @Get('/versions')
  async getMaterialVersions(
    @Query()
    	query: {
      materialId?: number;
      namespace?: string;
      isBranch?: string;
    },
  ) {
  	const { materialId, namespace } = query;

  	return {
  		code: 1,
  		data:
        materialId || namespace
        	? await this.materialService.getMaterialVersions(query)
        	: { list: [], total: 0 },
  	};
  }

  @Post('/template/queryListBySceneId')
  async getTemplateBySceneId(@Body() body) {
  	const { sceneId }: { sceneId: number } = body;
  	return {
  		code: 1,
  		data: await this.materialService.getTemplateBySceneId(sceneId),
  		msg: 'success',
  	};
  }

  @Post('/template/create')
  async createTemplate(@Body() body) {
  	const { templates } = body;
  	return {
  		code: 1,
  		data: await this.materialService.createTemplate(templates as AnyType),
  		message: 'success',
  	};
  }

  @Post('/theme/create')
  async createTheme(@Body() body, @Req() req: AnyType) {
  	const {
  		userId,
  		namespace,
  		themeConfig,
  		title,
  	}: {
      userId: AnyType;
      namespace: AnyType;
      themeConfig: AnyType;
      title: string;
    } = body;
  	Logger.info(`0-[创建主题包] 开始: ${namespace} - ${userId} - ${title}`);
  	return {
  		code: 1,
  		data: await this.materialService.createTheme({
  			userId,
  			namespace,
  			themeConfig,
  			title,
  			req,
  		}),
  		message: 'success',
  	};
  }

  @Post('/picture/batchCreateIcon')
  async batchCreateIcon(@Body() body) {
  	const { icons, userId } = body;
  	return {
  		code: 1,
  		data: await this.materialService.batchCreateIcon({
  			icons,
  			userId,
  		}),
  		message: 'success',
  	};
  }

	@Post('/picture/createImage')
  async createImage(@Body() body) {
  	const { userId, url, name } = body;
  	return {
  		code: 1,
  		data: await this.materialService.createImageMaterial({
  			userId,
  			url,
  			name,
  		}),
  		message: 'success',
  	};
  }

  @Post('/common/create')
	async createCommonMaterial(@Body() body) {
  	const {
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
  	}: {
      userId: string;
      namespace: string;
      type: string;
      icon: string;
      previewImg: string;
      title: string;
      description: string;
      meta: string;
      content: string;
      scene: { type: string; title: string };
      tags: string;
    } = body;
  	try {
  		await this.materialService.createCommon({
  			userId,
  			namespace,
  			type: type || MaterialType.COMPONENT,
  			icon: icon || '',
  			previewImg: previewImg || '',
  			title,
  			description: description || '',
  			meta: meta || '',
  			content,
  			scene,
  			tags: tags || [],
  		});

  		return { code: 1, data: null, message: '发布物料成功' };
  	} catch (e) {
  		return { code: -1, data: null, message: `发布物料失败：${e.message}` };
  	}
	}

  @Get('/theme/list')
  async getThemeList(@Query() query) {
  	const { themes } = query;
  	return {
  		code: 1,
  		data: await this.materialService.getThemeList({
  			themes: themes.map((theme) => JSON.parse(theme)),
  		}),
  		message: 'success',
  	};
  }

  @Post('/delete')
  async deleteMaterial(@Body() body: { id: number; userId: string }) {
  	await this.materialService.deleteMaterial(body);

  	return { code: 1, data: null, message: '删除物料成功' };
  }

  @Post('/update')
  async updateMaterial(
    @Body('materials') materials: AnyType,
    @Body('resetTagRelation') resetTagRelation: boolean,
  ) {
  	await this.materialService.updateMaterial(
      materials as AnyType,
      isNil(resetTagRelation) ? true : resetTagRelation,
  	);

  	return {
  		code: 1,
  		data: null,
  		message: 'success',
  	};
  }

  @Get('/sceneAndTag/list')
  async getSceneAndTagList(@Query('type') type: string) {
  	const types = type
  		? type.split(',').map((t) => t.replace('common', ''))
  		: [];

  	return {
  		code: 1,
  		data: await this.materialService.getSceneAndTagList(types),
  		message: 'success',
  	};
  }

  @Post('/share')
  async share(@Body('namespace') namespace, @Req() req: AnyType) {
  	return await this.materialService.shareMaterial(namespace, req);
  }

  @Post('/pull')
  async pull(@Body('namespaces') namespaces, @Body('userId') userId) {
  	Logger.info(`0-[从中心化拉物料] namespaces: ${JSON.stringify(namespaces)}`);
  	return await this.materialService.pullMaterial(namespaces, userId || '');
  }

  @Get('/remoteList')
  async remoteList(
    @Query('pageSize') pageSize: number,
    @Query('page') page: number,
    @Query('keyword') keyword: string,
    @Query('type') type: string,
		@Req() req: AnyType
  ) {
  	return await this.materialService.getRemoteList({
  		pageSize,
  		page,
  		keyword,
  		type
  	}, req);
  }

  @Get('/remoteLatestComponentLibrarys')
  async remoteLatestComponentLibrarys(@Req() req: AnyType) {
  	return await this.materialService.getRemoteLatestComponentLibrarys(req);
  }

  @Get('/env')
  async getEnv() {
  	return {
  		code: 1,
  		data: {
  			MYBRICKS_CAN_PUBLISH_REMOTE:
          process.env.MYBRICKS_CAN_PUBLISH_REMOTE || false,
  		},
  		message: 'success',
  	};
  }

  @Get('/getLatestComponentLibrarys')
  async getLatestComponentLibrarysByNamespaces(
    @Query() query: { namespaces: AnyType },
  ) {
  	return await this.materialService.getLatestMaterialsByNamespaces(
  		query.namespaces,
  	);
  }

  @Post('/getLatestComponentLibraries')
  async getLatestComponentLibrariesByNamespaces_POST(@Body() body: { namespaces: string[] },) {
  	return await this.materialService.getLatestMaterialsByNamespaces(body.namespaces);
  }

  @Get('/getRemoteLatestVersionByNamespaces')
  async getRemoteLatestVersionByNamespaces(
    @Query('namespaces') namespaces: AnyType,
    @Req() req: AnyType,
  ) {
  	return await this.materialService.getRemoteLatestVersionByNamespaces(
  		namespaces,
  		req,
  	);
  }

  @Post('/importMaterials')
  @UseInterceptors(FileInterceptor('file'))
  async importMaterials(@UploadedFile() file, @Req() req, @Body() body) {
  	Logger.info('[导入物料] 开始导入物料');
  	const { userId } = body;
  	return await this.materialService.importMaterials(file, userId || '', req);
  }

  @Get('/getNextVersionByNamespace')
  async getNextVersionByNamespace(@Query() query) {
  	const {
  		namespace,
  	}: {
      namespace: string;
    } = query;
  	Logger.info(`0-[根据namespace查询下一个版本] 开始查询: ${namespace}`);
  	return await this.materialService.getNextVersionByNamespace(namespace);
  }
}
