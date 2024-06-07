import { Injectable } from '@nestjs/common';
import FileContentDao from "../../dao/FileContentDao";
import FileDao from "../../dao/FileDao";

@Injectable()
export default class FileService {
  fileDao: FileDao;
  fileContentDao: FileContentDao;

  constructor() {
    this.fileDao = new FileDao();
    this.fileContentDao = new FileContentDao();
  }

  async getAllShareFiles(params?: { pageSize?: number, page?: number, extName?: string, onlyPublished?: 1 }): Promise<any> {
    const { pageSize, page, extName, onlyPublished } = params || {};
    return await this.fileDao.getAllShareFiles({
      pageSize,
      page,
      shareTypes: [1, 11],
      extName,
      onlyPublished
    })
  }

  async getCountOfShareFiles(extName?: string, onlyPublished?: 1): Promise<any> {
    return await this.fileDao.getCountOfShareFiles({
      shareType: 1,
      extName,
      onlyPublished
    })
  }

  async moveFile({
    fileId,
    toGroupId,
    toFileId,
  }: {
    fileId: number;
    toGroupId: string;
    toFileId: number;
  }) {
    let result = {};
    const file = await this.fileDao.queryById(fileId);
    if (toGroupId) {
      // 移动到协作组下
      if (!file.parentId) {
        if (file.groupId === Number(toGroupId)) {
          result = {
            data: '已在当前协作组下',
            message: '移动失败',
          };
          return result;
        } else {
          const { id } = await this.fileDao.moveFile({
            fileId,
            extName: file.extName,
            groupId: Number(toGroupId),
            parentId: null,
          });
          result = {
            data: id,
            message: '移动成功1',
          };
          return result;
        }
      } else {
        const { id } = await this.fileDao.moveFile({
          fileId,
          extName: file.extName,
          groupId: Number(toGroupId),
          parentId: null,
        });
        result = {
          data: id,
          msg: '移动成功2',
        };
        return result;
      }
    }

    if (toFileId) {
      // 移动到文件夹下
      const toFile = await this.fileDao.queryById(toFileId);
      const files = await this.fileDao.getFiles({
        groupIds: [toFile.groupId],
      });
      const parent = this._findParent(toFile.id, files);

      if (
        (file.parentId && parent.find((pId) => pId === file.id)) ||
        file.parentId === toFile.id
      ) {
        // 不能添加
        result = {
          data: '在自身文件夹下，无法移动',
          message: '移动失败',
        };
        return result;
      } else {
        // 移动
        const { id } = await this.fileDao.moveFile({
          fileId,
          extName: file.extName,
          groupId: toFile.groupId,
          parentId: toFile.id,
        });
        result = {
          data: id,
          message: '移动成功3',
        };
        return result;
      }
    }
  }

  _findParent(item, flattenTree) {
    const parentArr = []; // 存储所有的父级元素
    function find(item, flattenTree) {
      flattenTree.forEach((ele) => {
        if (ele.id === item) {
          parentArr.unshift(ele.id);
          find(ele.parentId, flattenTree);
        }
      });
    }
    find(item, flattenTree);
    return parentArr;
  }

  async getCountOfUserAndExt(param: { userId: string, extName: string }): Promise<any> {
    return this.fileDao.getCountOfUserAndExt(param)
  }

  async modifyFileDeliveryChannel(query: {
    id: number, deliveryChannel: string
  }) {
    const res = await this.fileDao.modifyFileDeliveryChannel(query.id, query.deliveryChannel);
    return res;
  }

  
}
