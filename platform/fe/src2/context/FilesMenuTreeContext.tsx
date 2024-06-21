import React, { FC, createContext, PropsWithChildren, useContext } from "react";

export interface FilesMenuTreeContextValue {
  registerNode: (namespace: string, refresh: () => Promise<any>) => void;
  refreshNode: (namespace: string) => void;
  unregisterNode: (namespace: string) => void;
}

const FilesMenuTreeContext = createContext<FilesMenuTreeContextValue>({} as FilesMenuTreeContextValue);

interface FilesMenuTreeProviderProps extends PropsWithChildren {};

const FilesMenuTreeProvider: FC<FilesMenuTreeProviderProps> = ({ children }) => {
  const namespaceToFilesTreeNode = {}
  const registerNode = (namespace: string, refresh: () => Promise<any>) => {
    namespaceToFilesTreeNode[namespace] = {
      loading: false,
      refresh
    }
  }
  const refreshNode = async (namespace: string) => {
    const node = namespaceToFilesTreeNode[namespace];
    if (!node.loading) {
      node.loading = true;
      await node.refresh();
      node.loading = false;
    }
  }
  const unregisterNode = (namespace: string) => {
    Reflect.deleteProperty(namespaceToFilesTreeNode, namespace);
  }
  return (
    <FilesMenuTreeContext.Provider value={{ registerNode, refreshNode, unregisterNode }}>
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
