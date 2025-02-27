import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Dropdown, Button, Modal, message, Segmented } from 'antd'
import { SelectableMaterialList, Material } from '@/components/materials'

import { importMaterialsFromRemote } from './services'

/** 中心化拉取物料的弹窗 */
export const useMaterialsFromRemote = ({ onSuccess, user }) => {
  const [open, setOpen] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]) 

  const handleMaterialChange = useCallback((selectedMaterials) => {
    setSelectedMaterials(selectedMaterials)
  }, [])

  const handlePull = useCallback(async () => {
    try {
      await importMaterialsFromRemote(selectedMaterials, user);
      onSuccess?.(selectedMaterials)
    } catch (error) {
      
    }
    setOpen(false)
  }, [onSuccess])

  useEffect(() => {
    if (!open) { // 关闭弹窗清空数据
      setSelectedMaterials([])
    }
  }, [open])

  const jsx = useMemo(() => {
    return (
      <Modal
        width={'90vw'}
        bodyProps={{ style: { height: '60vh', margin: '0px -10px' } }}
        open={open}
        title="物料市场"
        maskClosable
        destroyOnClose
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        okButtonProps={{ disabled: !!!selectedMaterials.length }}
        onOk={handlePull}
      >
        <SelectableMaterialList
          selectedMaterials={selectedMaterials}
          isQueryRemote
          defaultSelected={[]}
          onChange={handleMaterialChange}
        />
      </Modal>
    )
  }, [open, handleMaterialChange, selectedMaterials])

  return {
    open: () => setOpen(true),
    jsx,
  }
}
