import page from "./FilesPage";
import header from "./FilesHeader";
import button from "./FilesMenuButton";
import { FilesProvider } from "./FilesProvider";

export { button };

export default {
  id: "files",
  page,
  header,
  provider: FilesProvider
};

export interface File {
  id: number;
  groupId?: number;
  parentId?: number;
  name: string;
  icon: string;
  description?: string;
  creatorId: number;
  creatorName: string;
  _createTime: number;
  _updateTime: number;
  extName: string;
  status: number; // 1
  shareType?: number;
  createTime: string;
  updateTime: string;
}


export type Files = File[];

export interface FilePath {
  id?: number;
  name: string;
  parentId?: number;
  groupId?: number;
  extName?: string;
}

export type FilePaths = FilePath[];

export type ViewType = "grid" | "list";
