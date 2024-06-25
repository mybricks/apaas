import { Body, Controller, Get, Post, Query, UseFilters } from '@nestjs/common';
import ConfigDao from '../../dao/config.dao';
import UserService from '../user/user.service';
import { ErrorExceptionFilter } from '../../filter/exception.filter';
import { configuration } from './../../utils/shared'

@Controller("/paas/api")
@UseFilters(ErrorExceptionFilter)
export default class ConfigController {
  configDao: ConfigDao;
  userService: UserService;

  constructor() {
    this.configDao = new ConfigDao();
    this.userService = new UserService()
  }

  @Post("/config/get")
  async getAll(@Body() body: { scope: string[]; type: string; id: number }) {
    const { scope: preScope, type, id } = body;

    if(preScope?.length === 0) return { code: 1, data: {} };
    // scope 过滤 system 类型，system 统一走全局配置文件
    const scope = preScope.filter((item) => item !== 'system');

    const allTypes = ['group'];
    const configList = await this.configDao.getConfig({
      namespace: type ? scope.reduce((pre, item) => type === 'all' ? [...pre, item, ...allTypes.map(t => `${item}@${t}[${id}]`)] : [...pre, `${item}@${type}[${id}]`], []) : scope,
    });
    const result: any = {};
    configList?.forEach((item) => {
      // @ts-ignore
      result[item.appNamespace] = item;

      if (type && type !== 'all') {
        const curNamespace = item.appNamespace.replace(`@${type}[${id}]`, '');

        result[curNamespace] = { ...item, appNamespace: curNamespace };

        delete result[item.appNamespace];
      }
    });

    // scope 过滤 system 类型，system 统一走全局配置文件
    Object.assign(result, {
      system: {
        appNamespace: 'system',
        config: {
          openLogout: configuration?.platformConfig?.openLogout ?? true,
          openSystemWhiteList: false,
          openUserInfoSetting: configuration?.platformConfig?.openUserInfoSetting ?? true,
    
          closeOfflineUpdate: "",
    
          createBasedOnTemplate: configuration?.platformConfig?.createBasedOnTemplate,
    
          appBlackList: "pc-cgn,pc-page-vue2,pc-website,cloud-com,domain,th5-page,pc-comgen,mybricks-cloud-com",
    
          isPureIntranet: false,
    
          title: configuration?.platformConfig?.title,
          logo: configuration?.platformConfig?.logo,
          favicon: configuration?.platformConfig?.favicon,
        },
        id: 1
      }
    })

    return {
      code: 1,
      data: result,
    };
  }

  @Post("/config/update")
  async updateConfig(@Body() body: { userId: string; config: any; namespace: string; type: string; id: number }) {
    const { userId: originUserId, config, namespace, type, id } = body;
    const userId = await this.userService.getCurrentUserId(originUserId);
    const user = await this.userService.queryById({ id: userId });
    const curNamespace = type ? `${namespace}@${type}[${id}]` : namespace;
    const [curConfig] = await this.configDao.getConfig({ namespace: [curNamespace] });

    if (!user) {
      return { code: -1, msg: '用户不存在' };
    }

    if (curConfig) {
      await this.configDao.update({
        config: JSON.stringify(config),
        updatorId: userId,
        updatorName: user.name || user.email || userId,
        namespace: curNamespace,
      });
    } else {
      await this.configDao.create({
        creatorId: userId,
        creatorName: user.name || user.email || userId,
        config: JSON.stringify(config),
        namespace: curNamespace,
      });
    }

    return { code: 1 };
  }
}
