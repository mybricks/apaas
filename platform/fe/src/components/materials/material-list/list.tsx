import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import { Spin, message, Modal } from 'antd'
import {
  RightOutlined,
} from '@ant-design/icons'
import classNames from 'classnames'

import InfiniteScroll from '../../infinite-scroll'
import MaterialFilters from './../material-filters'
import MaterialFooter from './../material-footer'
import { SelectVersionsMaterialDetail, ReadVersionsMaterialDetail } from './../material-detail'
import { MaterialCard } from './card'

import { MarketMaterialValue, useSelectableMaterials } from './../use-materials'

import css from './index.less'
import { User } from '@/routes/workspace/types'
import { Material, MaterialType } from './../types'

interface MarketMaterialListProps {
  marketMaterial: MarketMaterialValue
  user?: User
}

/**
 * @description 市场中心的物料列表，主要是用于查看/筛选和管理物料，比如查看/升级/删除
 * @param options 
 * @returns 
 */
export const MarketMaterialList = (options?: MarketMaterialListProps) => {
  const { marketMaterial, user } = options ?? {}

  const {
    hasMore,
    loading,
    materials,
    loadMore,
    fetchMaterials,
    upgradeMaterialItem,
    removeMaterial,
  } = marketMaterial

  const [clickedMaterial, setClickedMaterial] = useState<any>(null)

  const [modal, contextHolder] = Modal.useModal();

  return (
    <div className={css.materialList}>
      {contextHolder}
      <MaterialFilters
        defaultValues={{
          type: 'com_lib',
        }}
        onQuery={(params) => fetchMaterials({ ...params, userId: user?.id })}
      />
      <div className={css.list} id="com-material-list">
        <InfiniteScroll
          loading={loading}
          scrollableTarget={'com-material-list'}
          dataLength={materials.length}
          hasMore={hasMore}
          loader={
            <p className={css.loading}>
              <Spin />
            </p>
          }
          style={{ paddingTop: 12 }}
          endMessage={<p className={css.noMore}>- 没有更多了 -</p>}
          next={loadMore}
        >
          {materials.map((item) => {
            return (
              <MaterialCard
                key={item.id}
                material={item}
                user={user}
                onUpgrade={(material) => upgradeMaterialItem(material, user)}
                onDelete={(material) => {
                  modal.confirm({
                    content: `确认删除物料「${material.title ?? material.name}」？`,
                    onOk: () => removeMaterial(material, user)
                  })
                }}
                onClick={(material) => setClickedMaterial(material)}
              />
            )
          })}
        </InfiniteScroll>
        <SecondPageView open={!!clickedMaterial}>
          <ReadVersionsMaterialDetail
            material={clickedMaterial}
            allowBack={true}
            onBack={() => setClickedMaterial(null)}
          />
        </SecondPageView>
      </div>
    </div>
  )
}

export interface SelectableMaterialListProps {
  /** 补充的请求参数 */
  queryParams?: Record<string, string>
  /** 查询物料类型 */
  materialType?: MaterialType
  limit?: number
  defaultSelected: MaterialItemType[]

  selectedMaterials: Material[]
  onChange?: (selectedMaterials: Material[]) => void

  /** 是否使用postMessage */
  isPostMessage?: boolean
  /** 是否请求中心化服务 */
  isQueryRemote?: boolean

  /** 重新定义footer */
  footer?: JSX.Element

  supportVersionSelect?: boolean
}

export type MaterialItemType = {
  materialId: number
  namespace: string
  version: string
}


const DEFAULT_SELECTED_LIMIT_MAPPER = {
  [MaterialType.THEME]: 1,
  [MaterialType.COM_LIB]: 1,
  [MaterialType.PICTURE]: 1,
}

/**
 * @description 用于物料选择的列表，可以选择并将选择后物料的信息返回回来
 * @param options 
 * @returns 
 */
export const SelectableMaterialList = (
  options: SelectableMaterialListProps
) => {
  const {
    limit,
    defaultSelected,
    selectedMaterials,
    materialType,
    queryParams,
    onChange,
    supportVersionSelect = false,
  } = options

  const { hasMore, loading, materials, loadMore, fetchMaterials } =
    useSelectableMaterials({
      isQueryRemote: options.isQueryRemote,
    })

  // const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([])

  const finalLimit = useMemo(() => {
    return limit ?? DEFAULT_SELECTED_LIMIT_MAPPER[materialType] ?? 5
  }, [limit, materialType])

  const onSelectMaterial = useCallback(
    (material: Material) => {
      if (selectedMaterials.length >= finalLimit) {
        message.warning({
          content: `选择数量不能大于 ${finalLimit} 个`,
          style: { marginTop: '5px' },
        })
        return
      }
      const index = selectedMaterials.findIndex(
        (item) => item.namespace === material.namespace
      )
      let newSelectedMaterials = [...selectedMaterials]

      if (index !== -1) {
        newSelectedMaterials[index] = material
      } else {
        newSelectedMaterials.push(material)
      }

      onChange(newSelectedMaterials)
    },
    [selectedMaterials, finalLimit]
  )

  const cancelSelectMaterial = useCallback(
    (materialId) => {
      onChange(selectedMaterials.filter((m) => m.id !== materialId))
    },
    [selectedMaterials]
  )

  const uuid = useMemo(() => {
    return 'com-material-list' + new Date().getTime()
  }, [])

  const [clickedMaterial, setClickedMaterial] = useState<any>(null)
  const VersionSelect = useCallback(({ material }) => {
    return (
      <div
        className={css.versionSelect}
        onClick={(e) => {
          e.stopPropagation()
          setClickedMaterial(material)
        }}
      >
        {'选择其它版本'}
        <RightOutlined />
      </div>
    )
  }, [])

  return (
    <div className={css.materialList}>
      <MaterialFilters
        defaultValues={{
          type: materialType ?? 'com_lib',
        }}
        onQuery={(params) =>
          fetchMaterials({ ...params, ...(queryParams ?? {}) })
        }
        blackList={materialType ? ['createByMine', 'type'] : ['createByMine']}
      />
      <div className={css.list} id={uuid}>
        <InfiniteScroll
          loading={loading}
          scrollableTarget={uuid}
          dataLength={materials.length}
          hasMore={hasMore}
          loader={
            <p className={css.loading}>
              <Spin />
            </p>
          }
          style={{ paddingTop: 12 }}
          endMessage={<p className={css.noMore}>- 没有更多了 -</p>}
          next={loadMore}
        >
          {materials.map((item) => {
            return (
              <MaterialCard
                key={item.id}
                material={item}
                mode="selectable"
                readonly={
                  !!defaultSelected.find((t) => t.namespace === item.namespace)
                }
                selected={
                  !!selectedMaterials.find(
                    (t) => t.namespace === item.namespace
                  )
                }
                extra={supportVersionSelect && VersionSelect}
                onSelect={onSelectMaterial}
                onCancel={cancelSelectMaterial}
              />
            )
          })}
        </InfiniteScroll>
        {supportVersionSelect && (
          <SecondPageView open={!!clickedMaterial}>
            <SelectVersionsMaterialDetail
              selectedMaterials={selectedMaterials}
              material={clickedMaterial}
              allowBack={true}
              allowAnyVersion
              onChange={(m) => onChange(m)}
              onBack={() => setClickedMaterial(null)}
            />
          </SecondPageView>
        )}
      </div>
      <MaterialFooter
        selectedMaterials={selectedMaterials}
        onDelete={cancelSelectMaterial}
      />
    </div>
  )
}

/** 通过position来渲染一个新页面，不影响原有页面逻辑，同时每次open都会触发mount */
const SecondPageView = ({ open, children }) => {
  const uuid = useMemo(() => {
    return Math.random()
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div
      key={uuid}
      className={classNames(css.secondPage, { [css.open]: open })}
    >
      {children}
    </div>
  )
}
