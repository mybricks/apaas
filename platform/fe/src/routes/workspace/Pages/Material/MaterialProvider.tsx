import React, { FC, PropsWithChildren, useState, useMemo, useContext, useEffect, useRef } from "react";
import { useUserContext, useWorkspaceConetxt } from "@workspace/context";
import { MarketMaterialValue, useMarketMaterials } from "@/components/materials/use-materials";
import { User } from "@workspace/types";

export interface MarketMaterialContextValue {
  marketMaterial: MarketMaterialValue,
  user: User
}

export interface MarketMaterialProviderProps extends PropsWithChildren {};


const MarketMaterialContext = React.createContext<MarketMaterialContextValue>({} as MarketMaterialContextValue);


export const MarketMaterialProvider: FC<MarketMaterialProviderProps> = ({ children }) => {
  const { system } = useWorkspaceConetxt();
  const { user } = useUserContext();

  const marketMaterial = useMarketMaterials({ shouldFetchLatestVersion: !!!system.isPureIntranet })

  const value: MarketMaterialContextValue = useMemo(() => {
    return {
      marketMaterial,
      user
    }
  }, [marketMaterial])

  return (
    <MarketMaterialContext.Provider value={value}>
      {children}
    </MarketMaterialContext.Provider>
  )
}

export const useMarketMaterialContext = () => {
  return useContext(MarketMaterialContext);
}