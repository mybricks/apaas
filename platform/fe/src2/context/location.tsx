import React, { FC, useMemo, PropsWithChildren, createContext, useContext, useRef, ReactNode, useEffect } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

import Files from "@/Pages/Files";

export interface LocationContext {
  size: number;
  search: string;
  params: {
    appId: string;
    groupId?: number;
    parentId?: number;
  }
}

const locationContext = createContext<LocationContext>({} as LocationContext);

interface LocationProviderProps extends PropsWithChildren {}

const DEFAULT_APPID = Files.id;

export const LocationProvider: FC<LocationProviderProps> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const ref = useRef<LocationContext>();
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
    <locationContext.Provider value={ref.current}>
      {children}
    </locationContext.Provider>
  );
}

export const useLocationConetxt = () => {
  return useContext(locationContext);
}
