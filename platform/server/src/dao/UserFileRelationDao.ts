import * as moment from 'dayjs'
import {Column, DOBase, Mapping} from '@mybricks/rocker-dao'


/**
 * RUserFileDO
 * @param id          主键
 * @param file_id     关联文件id
 * @param user_id     用户id
 * @param creator_id  创建人id
 * @param create_time 创建时间
 * @param updator_id  更新人id
 * @param update_time 更新时间
 * @param role_description   用户权限
 * @param status      状态
 */
export class UserFileRelationDO {
  @Column
  id: number;

  @Column('file_id')
  fileId: number;

  @Column('user_id')
  userId: string;

  @Column('creator_id')
  creatorId: string;

  @Column('updator_id')
  updatorId: string;

  @Column('role_description')
  roleDescription: string;

  @Column
  status: number;

  @Column('create_time')
  createTime(a) {
    return moment(a).format('YYYY-MM-DD HH:mm:ss');
  };

  @Column('update_time')
  updateTime(a) {
    return moment(a).format('YYYY-MM-DD HH:mm:ss');
  };
};


export default class UserFileRelationDao extends DOBase {
  /**
   * 查询
   * @param userId 用户id
   * @param fileId 文件id
   */
  @Mapping(UserFileRelationDO)
  public async query(params: {
    userId: string;
    fileId: number;
  }) {
    const rst = await this.exe<any>(
      'apaas_user_file_relation:query',
      params
    );

    return rst && rst.length > 0 ? rst[0] : void 0
  };

  /**
   * 创建用户与文件关联
   * @param userId    用户id
   * @param fileId    文件id
   * @param creatorId 文件创建人id
   * @param roleDescription  权限
   */
  public async create(params: {
    userId: string;
    fileId: number;
    creatorId: string;
    roleDescription?: string;
  }) {
    params = Object.assign({}, params);

    // 目前默认只有编辑权限 '2'
    if (!params.roleDescription) {
      params.roleDescription = '2';
    };

    const relations = await this.exe<any>(
      'apaas_user_file_relation:query',
      params
    );

    const time = new Date().getTime();

    if (relations.length) {
      // 更新
      return await this.exe<any>(
        'apaas_user_file_relation:update',
        {...params, updateTime: time, updatorId: params.creatorId}
      );
    } else {
      // 新增
      return await this.exe<any>(
        'apaas_user_file_relation:create',
        {...params, updateTime: time, createTime: time}
      );
    };
  };
};
