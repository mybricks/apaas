import React, { FC, PropsWithChildren, useState, useContext } from "react";

interface AppStoreContext {
  type: "installed" | "all";
  setType: React.Dispatch<React.SetStateAction<AppStoreContext["type"]>>;
}
export interface AppStoreProviderProps extends PropsWithChildren {};

const AppStoreContext = React.createContext<AppStoreContext>({} as AppStoreContext);

export const AppStoreProvider: FC<AppStoreProviderProps> = ({ children }) => {
  const [type, setType] = useState<AppStoreContext["type"]>("installed"); 
  return (
    <AppStoreContext.Provider value={{ type, setType }}>
      {children}
    </AppStoreContext.Provider>
  )
}

export const useAppStoreContext = () => {
  return useContext(AppStoreContext);
}
