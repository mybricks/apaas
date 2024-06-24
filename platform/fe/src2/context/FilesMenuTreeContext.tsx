import React, { FC, createContext, PropsWithChildren, useContext } from "react";

import { FileData } from "@/types";

interface RefreshParams {
  file?: FileData
}

export interface FilesMenuTreeContextValue {
  registerNode: (namespace: string, refresh: (params?: RefreshParams) => Promise<any>) => void;
  refreshNode: (namespace: string, params?: RefreshParams) => void;
  unregisterNode: (namespace: string) => void;
}

const FilesMenuTreeContext = createContext<FilesMenuTreeContextValue>({} as FilesMenuTreeContextValue);

interface FilesMenuTreeProviderProps extends PropsWithChildren {};

const FilesMenuTreeProvider: FC<FilesMenuTreeProviderProps> = ({ children }) => {
  const namespaceToFilesTreeNode = {}
  const registerNode: FilesMenuTreeContextValue["registerNode"] = (namespace, refresh) => {
    namespaceToFilesTreeNode[namespace] = {
      loading: false,
      refresh
    }
  }
  const refreshNode: FilesMenuTreeContextValue["refreshNode"] = async (namespace, params) => {
    const node = namespaceToFilesTreeNode[namespace];
    if (!node.loading) {
      node.loading = true;
      await node.refresh(params);
      node.loading = false;
    }
  }
  const unregisterNode: FilesMenuTreeContextValue["unregisterNode"] = (namespace) => {
    Reflect.deleteProperty(namespaceToFilesTreeNode, namespace);
  }
  return (
    <FilesMenuTreeContext.Provider value={{ refreshNode, registerNode, unregisterNode }}>
      {children}
    </FilesMenuTreeContext.Provider>
  )
}

const useFilesMenuTreeContext = () => {
  return useContext(FilesMenuTreeContext)
}

export {
  FilesMenuTreeProvider,
  useFilesMenuTreeContext
}
