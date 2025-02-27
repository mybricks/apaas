import React, { FC } from 'react'
import { Dropdown, Button } from 'antd'
import {
  CloudDownloadOutlined,
  FileImageOutlined,
  FileZipOutlined,
} from '@ant-design/icons'

import { Navbar } from '@workspace/components'

import {
  useMaterialsFromRemote,
  useMaterialsFromZip,
  useDesignMaterials,
} from './ImportMaterials'

import css from './MaterialHeader.less'
import { useUserContext } from '../../context'
import { useMarketMaterialContext } from './MaterialProvider'
import { MaterialType } from '@/components/materials'

const MaterialHeader: FC = () => {
  const { user } = useUserContext()
  const { marketMaterial } = useMarketMaterialContext()

  const { open: openMaterialsFromRemote, jsx: MaterialsFromRemoteJsx } =
    useMaterialsFromRemote({
      onSuccess: () => {
        marketMaterial.refresh({ type: MaterialType.COM_LIB })
      },
      user,
    })
  const { open: openMaterialsFromZip } = useMaterialsFromZip({
    onSuccess: () => {
      marketMaterial.refresh({ type: MaterialType.COM_LIB })
    },
    user,
  })

  const { open: openDesignMaterials, jsx: DesignMaterialsJsx } =
    useDesignMaterials({
      onSuccess: () => {
        marketMaterial.refresh({ type: MaterialType.PICTURE })
      },
      user,
    })

  return (
    <div className={css.header}>
      {MaterialsFromRemoteJsx}
      {DesignMaterialsJsx}
      <Navbar.Section
        value={'material'}
        options={[{ label: '物料中心', value: 'material' }]}
      />
      {user.isAdmin && (
        <Dropdown
          menu={{
            items: [
              {
                key: '1',
                label: <a target="_blank">从中心化服务拉取</a>,
                icon: <CloudDownloadOutlined />,
                onClick: openMaterialsFromRemote,
              },
              {
                key: '2',
                label: <a target="_blank">从zip包导入</a>,
                icon: <FileZipOutlined />,
                onClick: openMaterialsFromZip,
              },
              {
                type: 'divider',
              },
              {
                key: '3',
                label: <a target="_blank">添加图标素材</a>,
                icon: <FileImageOutlined />,
                onClick: openDesignMaterials,
              },
            ],
          }}
        >
          <Button
            className={css.create}
            type={'primary'}
            style={{ fontWeight: 'bold' }}
          >
            <label className={css.addIcon}>+</label>
            获取物料
          </Button>
        </Dropdown>
      )}
    </div>
  )
}

export default MaterialHeader
