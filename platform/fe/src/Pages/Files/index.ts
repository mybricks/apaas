import page from "./FilesPage";
import header from "./FilesHeader";
import button from "./FilesMenuButton";
import { FilesProvider } from "./FilesProvider";

export { button };

export default {
  id: "files",
  page,
  pageStyle: {
    padding: 0,
  },
  header,
  provider: FilesProvider
};

export interface FilePath {
  id?: number;
  name: string;
  parentId?: number;
  groupId?: number;
  extName?: string;
}

export type FilePaths = FilePath[];

export type ViewType = "grid" | "list";
