import React, { FC, PropsWithChildren, useState, useContext } from "react";

interface FilesContext {
  viewType: "grid" | "list";
  setViewType: React.Dispatch<React.SetStateAction<FilesContext["viewType"]>>;
}
export interface FilesProviderProps extends PropsWithChildren {};

const FilesContext = React.createContext<FilesContext>({} as FilesContext);

export const FilesProvider: FC<FilesProviderProps> = ({ children }) => {
  const [viewType, setViewType] = useState<FilesContext["viewType"]>("grid"); 
  return (
    <FilesContext.Provider value={{ viewType, setViewType }}>
      {children}
    </FilesContext.Provider>
  )
}

export const useFilesContext = () => {
  return useContext(FilesContext);
}
