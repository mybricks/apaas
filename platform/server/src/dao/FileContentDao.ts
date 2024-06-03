import * as moment from 'dayjs';
import {Column, DOBase, Mapping} from '@mybricks/rocker-dao';
import { genMainIndexOfDB } from '../utils';

export class FileContentDO {
  @Column
  id: number;

  @Column('file_id')
  fileId: number;
	
	@Column('version')
  version : number;

  @Column('creator_id')
  creatorId: string;

  @Column('creator_name')
  creatorName: string;

  // 只是for版本插件的虚拟字段，数据库不存在
  @Column('creator_email')
  creatorEmail: string;

  @Column('create_time')
  createTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss")
  }

  @Column('update_time')
  updateTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss")
  }

  @Column('content')
  content: string;
}

export default class FileContentDao extends DOBase {
  @Mapping(FileContentDO)
  public async queryBy<T>(params: {
    fileId?: number;
    ids?: number[];
    fileIds?: number[];
    orderBy?: string;
	  sortType?: 'desc' | 'asc';
    offset?: number;
    limit?: number;
  }): Promise<T> {
    const fileContents = await this.exe<FileContentDO[]>(
      'apaas_file_content:queryByFilters',
      params
    )

    if (Array.isArray(fileContents)) {
      if (fileContents.length > 0) {
        // @ts-ignore
        return fileContents.length == 1 ? fileContents[0] : fileContents
      } else {
        return
      }
    } else {
      return fileContents
    }
  }

  @Mapping(FileContentDO)
  public async queryLatestByFileId<T>(fileId: number): Promise<T> {
    const fileContents = await this.exe<FileContentDO[]>('apaas_file_content:queryLatestByFileId', { fileId })

    if (Array.isArray(fileContents)) {
      if (fileContents.length > 0) {
        // @ts-ignore
        return fileContents.length == 1 ? fileContents[0] : fileContents
      } else {
        return
      }
    } else {
      return fileContents
    }
  }

  @Mapping(FileContentDO)
  public async queryById(params: {
    id: number
  }): Promise<FileContentDO[]> {
    const fileContents = await this.exe<FileContentDO[]>(
      'apaas_file_content:queryById',
      params
    ) as any

    return fileContents;
  }

  @Mapping(FileContentDO)
  public async getLatestContentId(params: {
    fileId: number
  }): Promise<FileContentDO> {
    const fileContents = await this.exe<FileContentDO[]>(
      'apaas_file_content:getLatestContentId',
      params
    ) as any

    return fileContents ? fileContents[0] : null;
  }

  @Mapping(FileContentDO)
  public async queryLatestSave(params: {
    fileId: number
  }): Promise<FileContentDO> {
    const fileContents = await this.exe<FileContentDO[]>(
      'apaas_file_content:queryLatestSave',
      params
    ) as any

    return fileContents ? fileContents[0] : null;
  }

  @Mapping(FileContentDO)
  public async getContentByVersionAndFileId(params: {
    fileId: number,
    version: string
  }): Promise<FileContentDO> {
    const fileContents = await this.exe<FileContentDO[]>(
      'apaas_file_content:getContentByVersionAndFileId',
      params
    ) as any

    return fileContents ? fileContents[0] : null;
  }


  public async queryLatestSaves(params: {
    fileIds: number[]
  }) {
    if (!Array.isArray(params.fileIds) || params.fileIds.length === 0) {
      return []
    } 
    const fileContents = await this.exe<FileContentDO[]>(
      'apaas_file_content:queryLatestSaves',
      {
        ids: params.fileIds
      }
    )
    return fileContents ?? []
  }

  @Mapping(FileContentDO)
  public async getContentVersions(params: {
    fileId: number;
	  limit: number;
	  offset: number;
  }): Promise<FileContentDO[]> {
	  return await this.exe<FileContentDO[]>('apaas_file_content:getContentVersions', params) as any;
  }

  public async getContentVersionsCount(params: {
    fileId: number;
  }): Promise<number> {
    const res =  await this.exe<number>('apaas_file_content:getContentVersionsCount', params) as any;
    return res?.[0] ? res?.[0]?.total : null
  }

  public async create(params: {
    fileId: number
    creatorId: string
    version: string
    content: string
  }): Promise<{ id: number }> {
    const result = await this.exe<any>(
      'apaas_file_content:insert',
      Object.assign(
        params,
        {
          id: genMainIndexOfDB(),
          createTime: new Date().getTime(),
          updateTime: new Date().getTime(),
        }
      )
    );

    return {id: result.insertId}
  }

  public async update(params: {
    id: number
    fileId?: number
    creatorId?: string
    creatorName?: string
    content?: string
  }): Promise<{ id: number }> {
    await this.exe<any>(
      'apaas_file_content:update',
      Object.assign(
        params,
        {
          updateTime: new Date().getTime()
        }
      )
    );

    // return result;
    return {id: params.id};
  }


  public async updateContent(params: {
    id: number,
    content: string
  }): Promise<{ id: number }> {
    await this.exe<any>(
      'apaas_file_content:updateContent',
      Object.assign(
        params,
        {
          updateTime: new Date().getTime()
        }
      )
    );

    // return result;
    return {id: params.id}
  }
}
