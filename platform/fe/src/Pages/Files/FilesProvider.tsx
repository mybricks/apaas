import React, { FC, PropsWithChildren, useState, useMemo, useContext, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

import { FilePath, FilePaths, ViewType } from ".";
import { useUserContext, useWorkspaceConetxt } from "@/context";
import { storage } from "@/utils/local";
import { MYBRICKS_WORKSPACE_DEFAULT_FILES_VIEWTYPE } from "@/const";
import { FileData } from "@/types";

interface BasicParams {
  groupId?: string;
  parentId?: string;
}

export interface FilesContextValue {
  viewType: ViewType;
  setViewType: React.Dispatch<React.SetStateAction<FilesContextValue["viewType"]>>;
  filesInfo: {
    roleDescription: number;
    loading: boolean;
    files: FileData[];
    params: BasicParams;
  };
  filePathsInfo: {
    filePaths: FilePaths;
    loading: boolean;
    params: BasicParams;
  }
  refreshFiles: (params?: {
    file?: FileData;
    type: "create" | "delete" | "update"
  }) => void;
  refreshFilePaths: (filePath: FilePath) => void;
}
export interface FilesProviderProps extends PropsWithChildren {};

const FilesContext = React.createContext<FilesContextValue>({} as FilesContextValue);

/** 获取文件路径 */
const fetchFilePaths = async ({ groupId, parentId }, next) => {
  axios.get("/paas/api/file/getFilePath", {
    params: {
      fileId: parentId,
      groupId
    }
  }).then(({ data }) => {
    next({
      filePaths: (!groupId ? [{id: null, name: '我的', parentId: null, groupId: null, extName: null}] : [] as FilePaths).concat(data.data),
      loading: false,
    })
  })
}

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

/** 获取文件列表信息 */
const fetchFilesInfo = ({ userId, groupId, parentId, getApp }: any, next) => {
  Promise.all([
    fetchRoleDescription({ groupId, userId }),
    fetchFiles({ groupId, userId, parentId })
  ]).then(([roleDescription, files]) => {
    next({
      roleDescription,
      files: files.filter((file) => getApp(file.extName)),
      loading: false,
    });
  })
}

interface HandleFileParams {
  files: FileData[];
  file: FileData;
}

const handleCreateFile = ({ files, file }: HandleFileParams) => {
  if (file.extName === "folder") {
    files.unshift(file);
  } else {
    const index = files.findIndex((file) => file.extName !== "folder");
    if (index === -1) {
      files.push(file)
    } else {
      files.splice(index, 0, file);
    }
  }

  return files;
}

const handleDeleteFile = ({ files, file }: HandleFileParams) => {
  const index = files.findIndex((f) => f.id === file.id);
  files.splice(index, 1);

  return files;
}

const handleUpdateFile = ({ files, file }: HandleFileParams) => {
  const index = files.findIndex((f) => f.id === file.id);
  files.splice(index, 1, file);

  return files;
}

interface HandleFilePathParams {
  filePaths: FilePaths;
  filePath: FilePath;
}

const handleUpdateFilePath = ({ filePaths, filePath }: HandleFilePathParams) => {
  const index = filePaths.findIndex((f) => f.id === filePath.id);
  filePaths.splice(index, 1, filePath);

  return filePaths;
}


const DEFAULT_VIEWTYPE = storage.get(MYBRICKS_WORKSPACE_DEFAULT_FILES_VIEWTYPE) || "grid";

export const FilesProvider: FC<FilesProviderProps> = ({ children }) => {
  const { apps: { getApp } } = useWorkspaceConetxt();
  const { user: { id: userId } } = useUserContext();
  const [searchParams] = useSearchParams();
  const previousFetch = useRef<unknown>();
  const [viewType, setViewType] = useState<FilesContextValue["viewType"]>(DEFAULT_VIEWTYPE);
  const [filePathsInfo, setFilePathsInfo] = useState({
    loading: true,
    filePaths: [],
    params: {}
  })
  const [filesInfo, setFilesInfo] = useState({
    loading: true,
    files: [],
    roleDescription: 3,
    params: {}
  })

  useEffect(() => {
    const currentFetch = {};
    const params = {
      groupId: searchParams.get("groupId"),
      parentId: searchParams.get("parentId")
    }

    previousFetch.current = currentFetch;

    setFilePathsInfo((filePathsInfo) => {
      return {
        ...filePathsInfo,
        loading: true,
        params
      }
    })
    setFilesInfo((filesInfo) => {
      return {
        ...filesInfo,
        loading: true,
        params
      }
    })
    fetchFilesInfo({ ...params, userId, getApp }, (filesInfo) => {
      if (currentFetch === previousFetch.current) {
        setFilesInfo((previousFilesInfo) => {
          return {
            ...previousFilesInfo,
            ...filesInfo,
          }
        });
      }
    });
    fetchFilePaths(params, (filePathsInfo) => {
      if (currentFetch === previousFetch.current) {
        setFilePathsInfo((previousFilePathsInfo) => {
          return {
            ...previousFilePathsInfo,
            ...filePathsInfo
          }
        });
      }
    })
  }, [searchParams])

  const value: FilesContextValue = useMemo(() => {
    storage.set(MYBRICKS_WORKSPACE_DEFAULT_FILES_VIEWTYPE, viewType);
    return {
      viewType,
      filesInfo,
      filePathsInfo,
      setViewType,
      refreshFiles: ({ file, type }) => {
        setFilesInfo((previousFilesInfo) => {
          const { files, ...other } = previousFilesInfo;
          if (type === "create") {
            handleCreateFile({ files, file });
          } else if (type === "delete") {
            handleDeleteFile({ files, file });
          } else if (type === "update") {
            handleUpdateFile({ files, file });
          }
          
          return {
            files,
            ...other
          };
        })
      },
      refreshFilePaths: (filePath) => {
        setFilePathsInfo((previousFilePathsInfo) => {
          const { filePaths, ...other } = previousFilePathsInfo;
          handleUpdateFilePath({ filePaths, filePath })
          return {
            filePaths,
            ...other
          }
        })
      }
    }
  }, [viewType, filesInfo, filePathsInfo])

  return (
    <FilesContext.Provider value={value}>
      {children}
    </FilesContext.Provider>
  )
}

export const useFilesContext = () => {
  return useContext(FilesContext);
}
