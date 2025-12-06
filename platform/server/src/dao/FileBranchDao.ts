import { Column, DOBase, Mapping } from "@mybricks/rocker-dao";
import * as moment from "dayjs";
import { genMainIndexOfDB } from '../utils/index';

export class FileBranchDO {
  @Column
  id;

  @Column("main_file_id")
  mainFileId;

  @Column("branch_file_id")
  branchFileId;

  @Column("branch_name")
  branchName;

  @Column
  description;

  @Column
  content;

  @Column("creator_id")
  creatorId;

  @Column("creator_name")
  creatorName;

  @Column("create_time")
  createTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss");
  }

  @Column("update_time")
  updateTime(a) {
    return a ? moment(a).format("YYYY-MM-DD HH:mm:ss") : null;
  }

  @Column
  status;

  toJSON() {
    const json = {};
    Object.getOwnPropertyNames(this).forEach((nm) => {
      json[nm] = this[nm];
    });

    const thProto = Object.getPrototypeOf(this);
    Object.getOwnPropertyNames(thProto).forEach((nm) => {
      const pd = Object.getOwnPropertyDescriptor(thProto, nm);
      if (pd.get) {
        json[nm] = this[nm];
      }
    });

    return json;
  }
}

export default class FileBranchDao extends DOBase {
  /**
   * 创建文件分支关系
   */
  public async createBranch(query: {
    mainFileId: number;
    branchFileId: number;
    branchName?: string;
    description?: string;
    content?: string;
    creatorId: string;
    creatorName?: string;
  }): Promise<{ id: number | null }> {
    const result = await this.exe<any>("apaas_file_branch:create", {
      description: "",
      ...query,
      id: genMainIndexOfDB(),
      create_time: new Date().getTime(),
      update_time: new Date().getTime(),
      status: 1,
    });

    return {
      id: result && result.insertId ? result.insertId : null,
    };
  }

  /**
   * 获取文件的所有分支
   */
  @Mapping(FileBranchDO)
  public async queryBranchesByMainFileId(mainFileId: number): Promise<Array<FileBranchDO>> {
    const branches = await this.exe<Array<FileBranchDO>>("apaas_file_branch:queryByMainFileId", {
      mainFileId,
      status: 1,
    });

    return branches || [];
  }

  /**
   * 获取分支对应的主文件
   */
  @Mapping(FileBranchDO)
  public async queryMainFileByBranchFileId(branchFileId: number): Promise<FileBranchDO | undefined> {
    const branches = await this.exe<Array<FileBranchDO>>("apaas_file_branch:queryByBranchFileId", {
      branchFileId,
      status: 1,
    });

    return branches && branches.length > 0 ? branches[0] : undefined;
  }

  /**
   * 获取文件分支详情
   */
  @Mapping(FileBranchDO)
  public async queryBranchById(id: number): Promise<FileBranchDO | undefined> {
    const branches = await this.exe<Array<FileBranchDO>>("apaas_file_branch:queryById", {
      id,
      status: 1,
    });

    return branches && branches.length > 0 ? branches[0] : undefined;
  }

  /**
   * 检查是否存在分支关系
   */
  public async checkBranchExists(mainFileId: number, branchFileId: number): Promise<boolean> {
    const result = await this.exe<any>("apaas_file_branch:check", {
      mainFileId,
      branchFileId,
      status: 1,
    });

    return result && result.length > 0;
  }

  /**
   * 删除分支关系
   */
  public async deleteBranch(branchFileId: number): Promise<boolean> {
    const result = await this.exe<any>("apaas_file_branch:delete", {
      branchFileId,
      update_time: new Date().getTime(),
    });

    return !!result;
  }

  /**
   * 更新分支信息
   */
  public async updateBranch(query: {
    id: number;
    branchName?: string;
    description?: string;
    content?: string;
  }): Promise<boolean> {
    const result = await this.exe<any>("apaas_file_branch:update", {
      ...query,
      update_time: new Date().getTime(),
    });

    return !!result;
  }

  /**
   * 获取分支关系详情（包含主文件和分支文件信息）
   */
  @Mapping(FileBranchDO)
  public async queryBranchWithFileInfo(branchFileId: number): Promise<FileBranchDO | undefined> {
    const branches = await this.exe<Array<FileBranchDO>>("apaas_file_branch:queryWithFileInfo", {
      branchFileId,
      status: 1,
    });

    return branches && branches.length > 0 ? branches[0] : undefined;
  }
}
