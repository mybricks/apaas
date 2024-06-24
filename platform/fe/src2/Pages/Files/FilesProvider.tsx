import React, { FC, PropsWithChildren, useState, useMemo, useContext, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

import { FilePaths, ViewType } from ".";
import { useUserContext } from "@/context";
import { storage } from "@/utils/local";
import { MYBRICKS_WORKSPACE_DEFAULT_FILES_VIEWTYPE } from "@/const";
import { FileData } from "@/types";

interface FilesContextValue {
  viewType: ViewType;
  setViewType: React.Dispatch<React.SetStateAction<FilesContextValue["viewType"]>>;
  loading: boolean;
  filesInfo: {
    roleDescription: number;
    filePaths: FilePaths;
    files: FileData[];
    params: {
      groupId?: string;
      parentId?: string;
    }
  }
  refreshFilesInfo: (params?: {
    file?: FileData
  }) => void
}
export interface FilesProviderProps extends PropsWithChildren {};

const FilesContext = React.createContext<FilesContextValue>({} as FilesContextValue);

/** 获取当前groupId下权限 */
const fetchRoleDescription = async ({ groupId, userId }) => {
  if (!groupId) {
    return 1
  }

  const response = (await axios.get("/paas/api/userGroup/getUserGroupRelation", {
    params: {
      id: groupId,
      userId,
    }
  })).data.data;

  return response ? response.roleDescription : 3;
}

/** 获取文件路径 */
const fetchFilePaths = async ({ groupId, parentId }) => {
  return (await axios.get("/paas/api/file/getFilePath", {
    params: {
      fileId: parentId,
      groupId
    }
  })).data.data;
}

/** 获取文件列表 */
const fetchFiles = async ({ groupId, parentId, userId }) => {
  // 区分”协作组“和“我的”
  return filesSort((await axios.get(`/paas/api/file/${groupId ? "getGroupFiles" : "getMyFiles"}`, {
    params: {
      userId,
      parentId,
      groupId
    }
  })).data.data);
}

/** 文件列表排序，将文件夹排在前面 */
const filesSort = (files: FileData[]) => {
  // 参与排序替换位置，数字越大越靠前
  const orderMap = {
    'folder': 1
  }
  return files.sort((c, s) => {
    const cNum = orderMap[c.extName] || -1
    const sNum = orderMap[s.extName] || -1

    return sNum - cNum
  })
}
// TODO: Next
const fetchFilesInfo = ({ userId, groupId, parentId }: any, next) => {
  Promise.all([
    fetchRoleDescription({ groupId, userId }),
    fetchFilePaths({ groupId, parentId }),
    fetchFiles({ groupId, userId, parentId })
  ]).then(([roleDescription, filePaths, files]) => {
    next({
      roleDescription,
      filePaths: (!groupId ? [{id: null, name: '我的', parentId: null, groupId: null, extName: null}] : [] as FilePaths).concat(filePaths),
      files,
      params: {
        groupId,
        parentId
      }
    });
  })
}

const DEFAULT_VIEWTYPE = storage.get(MYBRICKS_WORKSPACE_DEFAULT_FILES_VIEWTYPE) || "grid";

export const FilesProvider: FC<FilesProviderProps> = ({ children }) => {
  const { user: { id: userId, name: userName } } = useUserContext();
  const [searchParams] = useSearchParams();
  const [viewType, setViewType] = useState<FilesContextValue["viewType"]>(DEFAULT_VIEWTYPE);
  const [loading, setLoading] = useState(true);
  const [filesInfo, setFilesInfo] = useState<FilesContextValue["filesInfo"]>({
    roleDescription: 3,
    filePaths: [],
    files: [],
    params: {}
  })

  useEffect(() => {
    setLoading(true);

    const groupId = searchParams.get("groupId");
    const parentId = searchParams.get("parentId");

    fetchFilesInfo({ userId, groupId, parentId }, (filesInfo) => {
      setLoading(false);
      setFilesInfo(filesInfo);
    });
  }, [searchParams])

  const value: FilesContextValue = useMemo(() => {
    storage.set(MYBRICKS_WORKSPACE_DEFAULT_FILES_VIEWTYPE, viewType);
    return {
      viewType,
      loading,
      filesInfo,
      setViewType,
      refreshFilesInfo: ({ file } = { file: null }) => {
        const { params } = filesInfo;
        if (file) {
          setFilesInfo((filesInfo) => {
            const { files, ...otherInfo } = filesInfo;
            if (file.extName === "folder") {
              files.unshift(file);
            } else {
              const index = files.findIndex((file) => file.extName !== "folder");
              files.splice(index, 0, file);
            }
            return {
              files,
              ...otherInfo
            };
          })
        } else {
          setLoading(true);
          fetchFilesInfo({ userId, ...params }, (filesInfo) => {
            setLoading(false);
            setFilesInfo(filesInfo);
          });
        }
      }
    }
  }, [viewType, loading, filesInfo])

  return (
    <FilesContext.Provider
      value={value}
    >
      {children}
    </FilesContext.Provider>
  )
}

export const useFilesContext = () => {
  return useContext(FilesContext);
}
