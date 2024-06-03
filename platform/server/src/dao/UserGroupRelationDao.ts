import { genMainIndexOfDB } from '../utils';
import * as moment from 'dayjs'
import {Column, DOBase, Mapping} from '@mybricks/rocker-dao'

/**
 * UserGroupRelationDO
 * @param id              主键
 * @param status 状态，    -1-删除，1-正常
 * @param creatorName     创建人名称
 * @param createTime      创建时间
 * @param creatorId       创建人ID
 * @param updatorName     更新人名称
 * @param updateTime      更新时间
 * @param updatorId       更新人ID
 * @param roleDescription 权限等级，1-管理，2-编辑， 3-能看到组，-1-被移除 ...
 * @param userGroupId     组ID
 * @param userId          用户ID
 */
export class UserGroupRelationDO {
  @Column
  id: number

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

  @Column('role_description')
  roleDescription: string
  
  @Column('user_group_id')
  userGroupId: string

  @Column('user_id')
  userId: string
}

export default class UserGroupRelationDao extends DOBase {

  public async create(params: {
    creatorId: string | number;
    creatorName?: string;
    roleDescription: number;
    userGroupId: number;
    userId: string | number;
  }) {
    const time = new Date().getTime()
    return await this.exe<any>(
      'apaas_user_group_relation:insert',
      {
        ...params,
        id: genMainIndexOfDB(),
        status: 1,
        createTime: time,
        updateTime: time,
        updatorId: params.creatorId,
        creatorName: '', // 后面数据库中删除这个字段
        updatorName: '' // 后面数据库中删除这个字段
      }
    )
  }

  public async update(params: {
    updatorId: string;
    updatorName?: string;
    roleDescription: number;
    userGroupId: number;
    userId: string;
    status?: number;
  }) {
    const time = new Date().getTime()
    return await this.exe<any>(
      'apaas_user_group_relation:update',
      {
        ...params,
        status: params.status || 1,
        updateTime: time
      }
    )
  }

  @Mapping(UserGroupRelationDO)
  public async queryByUserId(params: {
    userId: string
  }) {
    return await this.exe<UserGroupRelationDO[]>(
      'apaas_user_group_relation:queryByUserId',
      params
    )
  }

  @Mapping(UserGroupRelationDO)
  public async adminQueryRemainPart(params: {
    userId: string
  }) {
    return await this.exe<UserGroupRelationDO[]>(
      'apaas_user_group_relation:adminQueryRemainPart',
      params
    )
  }

  public async queryByUserGroupId(params: {
    userGroupId: number;
    limit?: number;
    offset?: number;
  }) {
    params = Object.assign({}, params)

    if (!params.limit) {
      params.limit = 1
    } else {
      params.limit = Number(params.limit)
    }
    if (!params.offset) {
      params.offset = 0
    } else {
      params.offset = Number(params.offset)
    }
    return await this.exe<UserGroupRelationDO[]>(
      'apaas_user_group_relation:queryByUserGroupId',
      params
    )
  }

  public async queryUserTotalByUserGroupId(params: {
    userGroupId: number;
  }) {

    const [result] = await this.exe<any>(
      'apaas_user_group_relation:queryUserTotalByUserGroupId', params
    )

    return result['count(*)']
  }

  @Mapping(UserGroupRelationDO)
  public async queryByUserIdAndUserGroupId(params: {
    userId: string;
    userGroupId: number;
    status?: 1 | -1;
  }) {
    const result = await this.exe<UserGroupRelationDO>(
      'apaas_user_group_relation:queryByUserIdAndUserGroupId',
      params
    )
    return result && result[0]
  }

  /**
   * 根据用户组id查询成员
   * @async
   * @function
   * @typedef  {object} params
   * @returns  {Promise<any>}
   */
  // @Mapping(UserGroupRelationDO)
  public async queryUsersByGroupId(params: {
    status?: number
    userGroupId: number
    limit?: number
    offset?: number
    roleDescription?: string
  }): Promise<any[]> {
    params = Object.assign({}, params)
    if (typeof params.status !== 'number') {
      params.status = 1
    }
    const result = await this.exe<any>('apaas_user_group_relation:queryUsersByGroupId', params)

    return result
  }
}