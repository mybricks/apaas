import * as React from 'react';
import { useWorkspaceConetxt, useUserContext } from '@workspace/context';
import { MarketMaterialList } from '@/components/materials';
import { useMarketMaterialContext } from './MaterialProvider';

export default () => {
  const { marketMaterial, user } = useMarketMaterialContext();

  return <>
    <MarketMaterialList marketMaterial={marketMaterial} user={user} />
  </>
}