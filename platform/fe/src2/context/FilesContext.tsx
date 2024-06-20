import React, { FC, createContext, PropsWithChildren, useContext } from "react";

interface FilesContextValue {}

const FilesContext = createContext<FilesContextValue>({} as FilesContextValue);

interface FilesProviderProps extends PropsWithChildren {};

const FilesProvider: FC<FilesProviderProps> = ({ children }) => {
  const namespaceToFilesTreeNode = {}
  const registeredNode = (namespace: string, refresh: () => Promise<any>) => {
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
  return (
    <FilesContext.Provider value={{ registeredNode, refreshNode }}>
      {children}
    </FilesContext.Provider>
  )
}

const useFilesContext = () => {
  return useContext(FilesContext)
}

export {
  FilesProvider,
  useFilesContext
}
