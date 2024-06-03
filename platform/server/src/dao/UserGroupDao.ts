import { genMainIndexOfDB } from '../utils';
import * as moment from 'dayjs'
import {Column, DOBase, Mapping} from '@mybricks/rocker-dao'

/**
 * UserGroupDO
 * @param id          主键
 * @param name        组名称
 * @param icon        组图标
 * @param status      状态，-1-删除，1-正常
 * @param creatorName 创建人名称
 * @param createTime  创建时间
 * @param creatorId   创建人ID
 * @param updatorName 更新人名称
 * @param updateTime  更新时间
 * @param updatorId   更新人ID
 */
export class UserGroupDO {
  @Column
  id: number

  @Column
  name: string

  @Column
  icon: string

  @Column
  status: number

  @Column('creator_name')
  creatorName: string

  @Column('create_time')
  createTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss")
  }

  @Column('creator_id')
  creatorId: string

  @Column('updator_name')
  updatorName: string

  @Column('update_time')
  updateTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss")
  }

  @Column('updator_id')
  updatorId: string
}

export default class UserGroupDao extends DOBase {

  public async create(params: {
    name: string;
    icon?: string;
    creatorId: string;
    creatorName?: string;
  }) {
    const time = new Date().getTime()
    return await this.exe<any>(
      'apaas_user_group:insert',
      {
        ...params,
        id: genMainIndexOfDB(),
        status: 1,
        createTime: time,
        updateTime: time,
        updatorId: params.creatorId,
        updatorName: params.creatorName || ''
      }
    )
  }

  @Mapping(UserGroupDO)
  public async queryByIds(params: {
    ids: string[]
  }): Promise<any> {
    const result = await this.exe<any>(
      'apaas_user_group:queryByIds',
      params
    )

    return result
  }

  @Mapping(UserGroupDO)
  public async queryById(params: {
    id: string
  }): Promise<any> {
    const result = await this.exe<any>(
      'apaas_user_group:queryById',
      params
    )

    return result && result[0]
  }

  public async delete(params: {
    id: number;
    updatorId: string | number;
    updatorName: string;
  }) {
    const result = await this.exe<any>(
      'apaas_user_group:delete', 
      {
        ...params,
        updateTime: new Date().getTime()
      }
    )

    return result;
  }

  public async update(params: {
    id: number;
    name?: string;
    icon?: string;
    updatorId: string;
    updatorName: string;
  }) {
    return await this.exe<any>(
      'apaas_user_group:update', 
      {
        ...params,
        updateTime: new Date().getTime()
      }
    )
  }
}