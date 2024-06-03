import * as moment from 'dayjs'
import { Column, DOBase, Mapping } from '@mybricks/rocker-dao'
import { genMainIndexOfDB, isNumber } from '../utils'

type Status = -1 | 0 | 1

/**
 * FileCooperationDO
 * @param id         主键ID
 * @param fileId     文件ID
 * @param userId     用户ID
 * @param updateTime 最后一次心跳更新时间
 * @param status     状态，-1-离线，0-在线，1-在线编辑
 */
export class FileCooperationDO {
  @Column
  id: number

  @Column('file_id')
  fileId: number

  @Column('user_id')
  userId: string

  @Column('update_time')
  updateTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss")
  }

  @Column
  status: number
}

export default class FileCooperationDao extends DOBase {

  @Mapping(FileCooperationDO)
  public async query(params: {
    userId: string
    fileId: number
    status?: Status
  }) {
    const result = await this.exe<FileCooperationDO>(
      'apaas_file_cooperation:query', params
    )

    return result ? result[0] : null;
  }

  public async delete(params: {
    fileId: number
    timeInterval?: number
  }) {
    const currentTime = new Date().getTime()
    params = Object.assign(params, {
      currentTime
    })

    if (!isNumber(params.timeInterval)) {
      /** 默认3分钟没更新心跳时间为超时 */
      params.timeInterval = 60 * 1000 * 3
    }
    return await this.exe<any>(
      'apaas_file_cooperation:delete', params
    )
  }

  public async create(params: {
    userId: string
    fileId: number
    status: Status
  }) {
    const currentTime = new Date().getTime()
    params = Object.assign(params, {
      updateTime: currentTime
    })

    const result = await this.exe<any>(
      'apaas_file_cooperation:create', {
        ...params,
        id: genMainIndexOfDB()
      }
    )

    return {
      id: result && result.insertId ? result.insertId : null
    }
  }

  @Mapping(FileCooperationDO)
  public async queryOnlineUsers(params: {
    fileId: number
  }) {

    return await this.exe<FileCooperationDO[]>(
      'apaas_file_cooperation:queryOnlineUsers', params
    )
  }

  public async numberOfOnlineUsers(params: {
    fileId: number
  }) {
    const [result] = await this.exe<FileCooperationDO[]>(
      'apaas_file_cooperation:numberOfOnlineUsers', params
    )

    return result['count(*)']
  }

  public async update(params: {
    userId: string
    fileId: number
    status: Status
  }) {
    const currentTime = new Date().getTime()
    params = Object.assign(params, {
      updateTime: currentTime
    })

    return await this.exe<any>('apaas_file_cooperation:update', params)
  }

  @Mapping(FileCooperationDO)
  public async queryEditUser(params: {
    fileId: number;
  }) {
    const result = await this.exe('apaas_file_cooperation:queryEditUser', params)

    return result && result[0]
  }
}
