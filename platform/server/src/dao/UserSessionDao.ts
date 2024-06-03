import { genMainIndexOfDB } from '../utils';
import * as moment from 'dayjs'
import {Column, DOBase, Mapping} from '@mybricks/rocker-dao'

/**
 * UserDO
 * @param id         主键
 * @param userId     用户id
 * @param name       用户中文名
 * @param userName   用户名
 * @param avatar     用户头像
 * @param department 所属部门
 * @param email      用户邮箱
 * @param status     状态
 * @param createTime 创建时间
 * @param updateTime 更新时间
 */
export class UserSessionDO {
  @Column
  id: number

  @Column('user_id')
  userId: string

  @Column('fingerprint')
  fingerprint: string

  @Column('create_time')
  createTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss")
  }

  @Column('update_time')
  updateTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss")
  }
}

export default class UserSessionDao extends DOBase {

  public async create(params: {
    userId: number
    fingerprint: string
  }): Promise<any> {
    params = Object.assign({}, params)

    const result = await this.exe<any>(
      'apaas_user_session:insert',
      Object.assign(
        params,
        {
          id: genMainIndexOfDB(),
          createTime: new Date().getTime(),
          updateTime: new Date().getTime(),
          status: 1,
        }
      )
    )

    return {id: result.insertId}
  }

  @Mapping(UserSessionDO)
  public async queryByUserId(params: {
    userId: number
  }): Promise<any> {

    const result = await this.exe<any>(
      'apaas_user_session:queryByUserId',
      params
    )

    return result ? result[0] : null
  }

  public async updateFingerprintByUserId(params: {
    userId: number,
    fingerprint: string
  }): Promise<any> {
    const result = await this.exe<any>(
      'apaas_user_session:updateFingerprintByUserId',
      {
        ...params,
        updateTime: new Date().getTime(),
      }
    )

    return result
  }

}