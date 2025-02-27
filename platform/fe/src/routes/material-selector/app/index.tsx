import React, { useState, useRef, useMemo, useCallback } from 'react'
import { ConfigProvider, Button } from 'antd'
import zhCN from 'antd/locale/zh_CN';
import { RightOutlined } from '@ant-design/icons'
import {
  SelectableMaterialList,
  Material,
  MaterialType,
  MaterialItemType,
  SelectVersionsMaterialDetail,
} from '@/components/materials'
import { getMaterialContent } from '@/components/materials/services'
import { safeParse } from '@/utils'

import css from './index.less'
import classNames from 'classnames'

const MYBRICKS_MSG_CHANNEL = 'MYBRICKS_MSG_CHANNEL'

export default () => {
  const [curMaterial, setCurMaterial] = useState<any>(null)
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([])
  const [defaultSelected, setDefaultSelected] = useState<MaterialItemType[]>([])
  // 注意老应用的组件选择有些使用没有type，所以默认materialType必须为组件
  const [materialType, setMaterialType] = useState(MaterialType.COMPONENT)
  const [queryParams, setQueryParams] = useState<Record<string, string>>({})
  const [limit, setLimit] = useState(null)
  const title = useRef('选择组件')
  const combo = useRef(false)
  const [loaded, setLoaded] = useState(false)
  const configRef = useRef<Record<string, unknown>>({})

  const autoCloseOnSuccessRef = useRef(true)

  useMemo(() => {
    window.parent.postMessage(
      {
        key: MYBRICKS_MSG_CHANNEL,
        action: 'onLoad',
      },
      '*'
    )

    window.addEventListener('message', (event) => {
      const { key, action, payload } = event.data

      if (key === MYBRICKS_MSG_CHANNEL && action === 'initialData') {
        const parsedPayload = safeParse(payload)
        title.current = parsedPayload.title || title.current
        combo.current = parsedPayload.combo
        setDefaultSelected(parsedPayload.defaultSelected || [])

        const finalType = parsedPayload.type ?? materialType

        setMaterialType(finalType)

        // 有 curUpgradeMaterial 代表是选择版本的那种选择器，非列表选择
        parsedPayload.curUpgradeMaterial
          ? setCurMaterial(parsedPayload.curUpgradeMaterial)
          : setCurMaterial(null)

        parsedPayload.config && (configRef.current = parsedPayload.config || {})

        if (parsedPayload.autoCloseOnSuccess !== undefined) {
          autoCloseOnSuccessRef.current = !!parsedPayload.autoCloseOnSuccess
        }
        parsedPayload.limit && setLimit(parsedPayload.limit)

        setQueryParams({
          type: parsedPayload.type ?? materialType,
          scene: parsedPayload.scene,
          tags: Array.isArray(parsedPayload.tags)
            ? parsedPayload.tags.join(',')
            : undefined,
        })

        setTimeout(() => {
          setLoaded(true)
        }, 300)
      }
    })
  }, [])

  const onClose = useCallback(() => {
    window.parent.postMessage(
      {
        key: MYBRICKS_MSG_CHANNEL,
        action: 'closeModal',
      },
      '*'
    )
  }, [])

  const onOk = useCallback(
    async (selectedMaterials) => {
      if (
        !selectedMaterials ||
        !Array.isArray(selectedMaterials) ||
        !selectedMaterials.length
      ) {
        return
      }

      if (materialType === MaterialType.COMPONENT) {
        const calcSelectedMaterials = selectedMaterials.map((material) => ({
          materialId: material.id,
          namespace: material.namespace,
          version: material.version,
        }))
        const allMaterials = [...defaultSelected, ...calcSelectedMaterials]

        let comboUrl = undefined

        if (combo.current) {
          comboUrl = `${
            location.origin
          }/material/api/material/components/combo?components=${allMaterials.reduce(
            (pre, material, index) => {
              return `${pre}${index ? ',' : ''}${material.namespace}@${
                material.version
              }`
            },
            ''
          )}`
        }

        autoCloseOnSuccessRef.current && onClose()
        window.parent.postMessage(
          {
            key: MYBRICKS_MSG_CHANNEL,
            action: 'onSuccess',
            payload: JSON.stringify({
              updatedMaterials: calcSelectedMaterials,
              materials: allMaterials,
              url: comboUrl, // TODO: 这个有可能应用就没在用，后续考虑删除
            }),
          },
          '*'
        )
      } else {
        const [comLib] = selectedMaterials
        const data = await getMaterialContent({
          namespace: comLib.namespace,
          version: comLib.version,
          codeType: configRef.current.pure ? 'pure' : undefined,
        })

        autoCloseOnSuccessRef.current && onClose()
        window.parent.postMessage(
          {
            key: MYBRICKS_MSG_CHANNEL,
            action: 'onSuccess',
            payload: JSON.stringify({
              updatedMaterials: [data],
              materials: [data],
            }),
          },
          '*'
        )
      }
    },
    [combo, defaultSelected, materialType]
  )

  return (
    <>
      <div className={css.materialSelector}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#f26726d9',
            },
          }}
          locale={zhCN}
        >
          <div className={css.header}>
            <div className={css.title}>{title.current}</div>
            <div className={css.close} onClick={onClose}>
              <svg
                viewBox="64 64 896 896"
                focusable="false"
                width="1em"
                height="1em"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path>
              </svg>
            </div>
          </div>
          <div className={css.container}>
            {loaded &&
              (curMaterial ? (
                <SelectVersionsMaterialDetail
                  selectedMaterials={selectedMaterials}
                  material={curMaterial}
                  allowBack={false}
                  allowAnyVersion={false}
                  onChange={(m) => setSelectedMaterials(m)}
                />
              ) : (
                <SelectableMaterialList
                  limit={limit}
                  materialType={materialType}
                  queryParams={queryParams}
                  defaultSelected={defaultSelected}
                  selectedMaterials={selectedMaterials}
                  onChange={(m) => setSelectedMaterials(m)}
                  supportVersionSelect
                />
              ))}
          </div>
          <div className={css.footer}>
            <div className={css.tip}>请选择需要的组件</div>
            <Button onClick={onClose}>取消</Button>
            <Button
              type="primary"
              className={css.okBtn}
              onClick={() => onOk(selectedMaterials)}
              disabled={!selectedMaterials.length}
            >
              确定
            </Button>
          </div>
        </ConfigProvider>
      </div>
    </>
  )
}
