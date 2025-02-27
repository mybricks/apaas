import React, { FC, PropsWithChildren, useState, useContext } from "react";

interface ToolsContext {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}
export interface ToolsProviderProps extends PropsWithChildren {};

const ToolsContext = React.createContext<ToolsContext>({} as ToolsContext);

export const ToolsProvider: FC<ToolsProviderProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('');

  return (
    <ToolsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ToolsContext.Provider>
  )
}

export const useToolsContext = () => {
  return useContext(ToolsContext);
}
