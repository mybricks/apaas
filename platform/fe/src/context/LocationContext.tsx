import React, { FC, PropsWithChildren, createContext, useContext, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import Files from "@/Pages/Files";

export interface LocationContextValue {
  size: number;
  search: string;
  params: {
    appId: string;
    groupId?: number;
    parentId?: number;
  }
}

const LocationContext = createContext<LocationContextValue>({} as LocationContextValue);

interface LocationProviderProps extends PropsWithChildren {}

const DEFAULT_APPID = Files.id;

const LocationProvider: FC<LocationProviderProps> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const ref = useRef<LocationContextValue>();
  const { current } = ref;
  const appId = searchParams.get("appId");
  const paramsSize = searchParams.size;

  if (!appId) {
    // 没有appId，默认使用DEFAULT_APPID
    ref.current = {
      size: 1,
      search: `?appId=${DEFAULT_APPID}`,
      params: {
        appId: DEFAULT_APPID
      }
    }
  } else if (!current || appId !== current.params.appId || paramsSize !== current.size) {
    // 没有current，初始化
    // appId发生变更
    // 参数个数发生变更
    ref.current = {
      size: paramsSize,
      search: paramsSize === 1 ? `?appId=${appId}` : null,
      params: {
        appId,
      }
    }
  }

  return (
    <LocationContext.Provider value={ref.current}>
      {children}
    </LocationContext.Provider>
  );
}

const useLocationConetxt = () => {
  return useContext(LocationContext);
}

export {
  LocationProvider,
  useLocationConetxt
}
