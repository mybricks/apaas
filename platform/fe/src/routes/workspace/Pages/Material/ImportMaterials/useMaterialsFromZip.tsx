import React, { useCallback } from 'react';
import { importMaterialsFromZip } from './services'

export const useMaterialsFromZip = ({
  onSuccess,
  user,
}) => {
  const open = useCallback(async () => {
    await importMaterialsFromZip(user);
    onSuccess?.()
  }, [user, onSuccess])

  return {
    open
  }
}