import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
import ConfigDao from '../../dao/config.dao'


@Injectable()
export default class ConfigService {
  configDao: ConfigDao;

  constructor() {
    this.configDao = new ConfigDao();
  }

  async getConfigByScope(scope: string[]) {
    const configList = await this.configDao.getConfig({
      namespace: scope,
    });
    const result: any = {};
    configList?.forEach((item) => {
      // @ts-ignore
      result[item.appNamespace] = item;
    });
    return result
  }

}
