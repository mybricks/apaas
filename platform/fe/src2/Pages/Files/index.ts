import page from "./FilesPage";
import header from "./FilesHeader";
import { id, FilesMenuButton as button } from "./FilesMenuButton";
import { FilesProvider } from "./FilesProvider";

export { button };

export default {
  id,
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
  creatorId: string;
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
