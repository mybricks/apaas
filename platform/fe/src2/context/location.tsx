import React, { FC, PropsWithChildren, createContext, useContext, useRef, ReactNode } from "react";
import { useLocation } from "react-router-dom";

export interface LocationContext {
  search: string;
  params: {
    appId: string;
    groupId?: number;
    parentId?: number;
  }
}

const locationContext = createContext<LocationContext>({} as LocationContext);

interface LocationProviderProps extends PropsWithChildren {

}

export const LocationProvider: FC<LocationProviderProps> = ({ children }) => {
  const { search: locationSearch } = useLocation();
  const ref = useRef<LocationContext>();
  const { current } = ref;

  if (!locationSearch) {
    ref.current = {
      search: "?appId=files",
      params: {
        appId: "files"
      }
    }
  } else if (!current || locationSearch !== current.search) {
    const urlSearchParams = new URLSearchParams(locationSearch);
    const appId = urlSearchParams.get("appId");
    const groupId = urlSearchParams.get("groupId");
    const parentId = urlSearchParams.get("parentId");
    ref.current = {
      search: locationSearch,
      params: {
        appId,
        groupId: groupId ? Number(groupId) : null,
        parentId: parentId ? Number(parentId) : null
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
