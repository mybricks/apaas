import React, { FC, PropsWithChildren, createContext, useContext } from "react";
import { useSearchParams } from "react-router-dom";

type AppRouterContextValue = string;

const AppRouterContext = createContext<AppRouterContextValue>("");

interface AppRouterContextProviderProps extends PropsWithChildren {};

const AppRouterContextProvider: FC<AppRouterContextProviderProps> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get("appId");

  return (
    <AppRouterContext.Provider value={appId || "files"}>
      {children}
    </AppRouterContext.Provider>
  )
}

const useAppRouterContext = () => {
  return useContext(AppRouterContext);
}

export {
  AppRouterContextProvider,
  useAppRouterContext
}