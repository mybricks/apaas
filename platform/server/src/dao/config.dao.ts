import { Column, DOBase, Mapping } from "@mybricks/rocker-dao";
import * as moment from "dayjs";
import { genMainIndexOfDB, safeParse } from "../utils";

export class ConfigDO {
  @Column
  id: number;

  @Column
  password: string;

  @Column("creator_id")
  creatorId: string;

  @Column("creator_name")
  creatorName: string;

  @Column("updator_id")
  updatorId: string;

  @Column("updator_name")
  updatorName: string;

  @Column("create_time")
  createTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss");
  }

  @Column("update_time")
  updateTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss");
  }

  @Column("config")
  config(conf) {
    return safeParse(conf || "{}");
  }

  @Column("app_namespace")
  appNamespace: string;
}

export default class ConfigDao extends DOBase {
  @Mapping(ConfigDO)
  public async getConfig(params: { namespace: string[] }) {
    if (!params.namespace.length) {
      return [];
    }
    return await this.exe<ConfigDO[]>("apaas_config:getConfigByNamespace", {
      ...params,
    });
  }

  async create(params: {
    creatorId: string;
    creatorName: string;
    config: string;
    namespace: string
  }) {
    const result = await this.exe<{ insertId: number }>("apaas_config:insert", {
      ...params,
      id: genMainIndexOfDB(),
      admin: params.creatorId,
      updatorId: params.creatorId,
      updatorName: params.creatorName,
      createTime: new Date().getTime(),
      updateTime: new Date().getTime(),
      appNamespace: params.namespace
    });

    return { id: result.insertId };
  }

  async update(params: {
    updatorId: string;
    updatorName: string;
    config: string;
    namespace: string;
  }) {
    await this.exe<{ insertId: number }>("apaas_config:update", {
      ...params,
      updateTime: new Date().getTime(),
    });
  }
}
