import { genMainIndexOfDB } from '../utils';
import * as moment from 'dayjs'
import {Column, DOBase, Mapping} from '@mybricks/rocker-dao'

export class UserLogDO {
  @Column
  id: number

  @Column
  type: string

  @Column('user_id')
  userId: string

  @Column('user_email')
  userEmail: string

  @Column('log_content')
  logContent: string

  @Column('create_time')
  createTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss")
  }
}

export default class UserLogDao extends DOBase {
  @Mapping(UserLogDO)
  public async queryAllDownload(): Promise<UserLogDO[]> {
    const result = await this.exe<any>(
      'apaas_user_log:queryByType', {type: 1}
    )

    return result
  }

  public async createDownloadLog(params: {
    userId: string,
    userEmail: string
    logContent: string
  }): Promise<number> {
    params = Object.assign({}, params)

    const result = await this.exe<any>(
      'apaas_user_log:insert',
      Object.assign(
        params,
        {
          id: genMainIndexOfDB(),
          type: 1,
          createTime: new Date().getTime()
        }
      )
    )

    return result.insertId
  }

  public async insertLog(params: { type: number, logContent: string; userEmail?: string; userId?: string, relationToken?: number }): Promise<number> {
    const result = await this.exe<any>('apaas_user_log:insert', {
        ...params,
        userId: String(params.userId || ''),
        userEmail: params.userEmail || '',
        relationToken: params.relationToken || null,
        id: genMainIndexOfDB(),
        createTime: Date.now()
      }
    );

    return result.insertId;
  }

  public async queryChatCount(params: { startTime?: number, endTime?: number, type: number[] }): Promise<number> {
    const res = await this.exe<any>('apaas_user_log:queryChatCount', params);
    return res ? res[0].total : 0;
  }

  @Mapping(UserLogDO)
  async queryDetailByTime(params: { startTime?: number, endTime?: number, limit: number, offset: number, type: number[] }) {
    return await this.exe<UserLogDO[]>('apaas_user_log:queryDetailByTime', params);
  }

  public async createUpgradeLog(params: {
    userId: string,
    userEmail: string
    logContent: string
  }): Promise<number> {
    params = Object.assign({}, params)

    const result = await this.exe<any>(
      'apaas_user_log:insert',
      Object.assign(
        params,
        {
          id: genMainIndexOfDB(),
          type: 2,
          createTime: new Date().getTime()
        }
      )
    )

    return result.insertId
  }

  async queryDetailOfAll(params: { limit: number; offset: number, type: number[] }) {
    return await this.exe('apaas_user_log:queryDetailOfAll', params);
  }

  async queryTotalOfAll(params: { type: number[] }) {
    const res = await this.exe<Array<{ total: number }>>('apaas_user_log:queryTotalOfAll', params);
    return res ? res[0].total : 0;
  }

  async queryPageSaveOperateList(params: { fileIds: number[], type }) {
    return await this.exe<any[]>('apaas_user_log:queryPageSaveLogsByRelateId', params);
  }
}