import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Button, Table, Tabs, Tooltip, Spin } from 'antd'
import { unifiedTime } from './../utils'
import { Material, MaterialVersion } from './../types'
import { getMaterialVersions, getMaterialContent } from './../services'
import { ThemeIcon, ComponentIcon } from './../icon'

import styles from './index.less'
import { MaterialType } from './../types'

interface CommonMaterialInfoProps {
  /** 允许返回，一般用于当二级页的情况 */
  allowBack?: boolean
  onBack?: () => void
  material: Material
 
}

/** 通用的物料详情 */
const CommonMaterialDetail = ({
  allowBack,
  onBack,
  material: curMaterial,
  children,
}: CommonMaterialInfoProps & {
  children: (props: {
    materialInfo: Material
    materialVersions: MaterialVersion[]
    materialBranchVersions: MaterialVersion[]
  }) => ReactNode
}) => {
  const [materialVersions, setMaterialVersions] = useState<MaterialVersion[]>(
    []
  )
  const [materialBranchVersions, setMaterialBranchVersions] = useState<
    MaterialVersion[]
  >([])
  const [materialInfo, setMaterialInfo] = useState<any>({})

  const [loaded, setLoaded] = useState(false)

  const {
    id: materialId,
    preview_img,
    icon,
    type,
    version,
    title,
    namespace,
    creator_name,
    creator_id,
    create_time,
    update_time,
  } = materialInfo ?? {}

  useEffect(() => {
    Promise.all([
      getMaterialContent({ ...curMaterial, codeType: 'pure' }).then(data => {
        if (curMaterial.version === 'latest' && data?.version) {
          return {
            ...data,
            version: 'latest',
          }
        }
        return data
      }),
      getMaterialVersions({
        materialId: curMaterial.materialId,
        namespace: curMaterial.namespace,
      }),
      getMaterialVersions({
        materialId: curMaterial.materialId,
        namespace: curMaterial.namespace,
        isBranch: true,
      }),
    ])
      .then(([materialInfo, versionRes, branchVersionRes]) => {
        setMaterialInfo(materialInfo)
        setMaterialVersions(versionRes?.list ?? [])
        setMaterialBranchVersions(branchVersionRes?.list ?? [])
      })
      .finally(() => {
        setLoaded(true)
      })
  }, [curMaterial])

  return (
    <div className={styles.materialInfo}>
      <Spin spinning={!!!loaded}>
        <div className={styles.content}>
          <div
            className={styles.card}
            style={!allowBack ? { paddingTop: 0 } : undefined}
          >
            {!allowBack ? null : (
              <div className={styles.back} onClick={onBack}>
                <svg
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                >
                  <path
                    d="M192 344.64H128V192a96 96 0 0 1 96-96h608a96 96 0 0 1 96 96v640a96 96 0 0 1-96 96H224a96 96 0 0 1-96-96v-126.272h64V832a32 32 0 0 0 32 32h608a32 32 0 0 0 32-32V192a32 32 0 0 0-32-32H224a32 32 0 0 0-32 32v152.64z"
                    fill="#333333"
                  ></path>
                  <path
                    d="M538.688 410.848a32 32 0 1 1 39.808-50.112l148.32 117.856c23.744 18.848 10.4 57.056-19.904 57.056H72.832a32 32 0 1 1 0-64h542.368l-76.48-60.8z"
                    fill="#333333"
                  ></path>
                </svg>
              </div>
            )}
            <div className={styles.snap}>
              {!preview_img && !icon ? (
                type === 'theme' ? (
                  <ThemeIcon />
                ) : (
                  <ComponentIcon />
                )
              ) : (
                <div
                  className={styles.img}
                  style={{
                    backgroundImage: `url("${preview_img || icon}")`,
                  }}
                />
              )}
            </div>
            <div className={styles.cardContent}>
              <div className={styles.title}>
                {title}
                {type === 'com_lib' ? '' : '组件'}(ID: {materialId})
              </div>
              <div className={styles.infoLine}>
                <div style={{ width: '200px' }}>
                  {type === 'com_lib' ? '组件库' : '组件'}版本：
                  <div className={styles.value}>{version}</div>
                </div>
                <div>
                  命名空间：
                  <Tooltip title={namespace}>
                    <div className={styles.value}>{namespace}</div>
                  </Tooltip>
                </div>
              </div>
              <div className={styles.infoLine}>
                <div>
                  创建人：
                  <div className={styles.value}>
                    {creator_name || creator_id}
                  </div>
                </div>
                <div>
                  创建时间：
                  <div className={styles.value}>{unifiedTime(create_time)}</div>
                </div>
              </div>
              <div className={styles.infoLine}>
                <div>
                  最新更新时间：
                  <div className={styles.value}>{unifiedTime(update_time)}</div>
                </div>
              </div>
            </div>
          </div>
          {typeof children === 'function' &&
            children({
              materialVersions,
              materialBranchVersions,
              materialInfo,
            })}
        </div>
      </Spin>
    </div>
  )
}

interface ReadVersionsMaterialDetailProps extends CommonMaterialInfoProps {}

/** 仅用于查看版本的物料详情 */
export const ReadVersionsMaterialDetail = (props: ReadVersionsMaterialDetailProps) => {
  const { allowBack, onBack, material, ...versionsProps } = props

  return (
    <CommonMaterialDetail
      allowBack={allowBack}
      onBack={onBack}
      material={material}
    >
      {({ materialInfo, materialVersions, materialBranchVersions }) => {
        return (
          <div className={styles.tabCard}>
            <Tabs defaultActiveKey="historyVersion">
              <Tabs.TabPane tab="历史版本" key="historyVersion">
                <ReadMaterialVersion
                  versions={materialVersions}
                  curMaterial={materialInfo}
                  {...versionsProps}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab="分支版本" key="branchVersion">
                <ReadMaterialVersion
                  versions={materialBranchVersions}
                  curMaterial={materialInfo}
                  isBranch
                  {...versionsProps}
                />
              </Tabs.TabPane>
            </Tabs>
          </div>
        )
      }}
    </CommonMaterialDetail>
  )
}

const ReadMaterialVersion: FC<{
  curMaterial: Material
  versions: MaterialVersion[]
  isBranch?: boolean
}> = ({
  versions,
  curMaterial,
  isBranch,
}) => {

  const columns = useMemo(() => {
    return [
      {
        title: '物料名称',
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: '版本号',
        dataIndex: 'version',
        key: 'version',
      },
      {
        title: '发布人',
        dataIndex: 'creator_name',
        key: 'creator_name',
        render: (creatorName) => {
          return creatorName
        },
      },
      {
        title: '发布时间',
        dataIndex: 'create_time',
        key: 'create_time',
        render: (time) => {
          return unifiedTime(time)
        },
      },
    ]
  }, [curMaterial])

  return (
    <div className={styles.materialVersion}>
      <div className={styles.table}>
        <Table
          rowKey="material_id"
          columns={columns}
          dataSource={versions}
          pagination={false}
        />
      </div>
    </div>
  )
}

interface SelectVersionsMaterialDetailProps extends CommonMaterialInfoProps {
  /** 允许选择所有版本，默认是小于material版本不可以选 */
  allowAnyVersion?: boolean
  onChange?: (materials: Material[]) => void
  selectedMaterials: Material[]
}

/** 用于选择版本的物料详情 */
export const SelectVersionsMaterialDetail = (
  props: SelectVersionsMaterialDetailProps
) => {
  const { allowBack, onBack, material, ...versionsProps } = props

  return (
    <CommonMaterialDetail
      allowBack={allowBack}
      onBack={onBack}
      material={material}
    >
      {({ materialInfo, materialVersions, materialBranchVersions }) => {
        return (
          <div className={styles.tabCard}>
            <Tabs defaultActiveKey="historyVersion">
              <Tabs.TabPane tab="历史版本" key="historyVersion">
                <SelectMaterialVersion
                  versions={materialVersions}
                  curMaterial={materialInfo}
                  {...versionsProps}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab="分支版本" key="branchVersion">
                <SelectMaterialVersion
                  versions={materialBranchVersions}
                  curMaterial={materialInfo}
                  isBranch
                  {...versionsProps}
                />
              </Tabs.TabPane>
            </Tabs>
          </div>
        )
      }}
    </CommonMaterialDetail>
  )
}

const checkIsAllowSelect = (material, currentMaterial) => {
  if (currentMaterial?.version === 'latest') {
    // 当前选中是latest，那么只有最后一个版本可选
    if (material.version === 'latest') {
      // 物料是latest，为当前选中，禁用操作
      return false
    }
    return material.isLatest
  }

  if (material.version === 'latest') {
    // 版本号为latest的一定可选
    return true
  }
  if (!currentMaterial) {
    return true
  }

  const { version: currentVersion } = currentMaterial
  const { version: nextVersion } = material
  if (currentVersion === nextVersion) {
    return false
  }

  const versionRegExp = /(^\d+\.\d+\.\d+)(-(.*)\.\d+)?$/
  const vAry1 = currentVersion.match(versionRegExp)[1].split('.')
  const vAry2 = nextVersion.match(versionRegExp)[1].split('.')

  const diffIdx = vAry1.findIndex((item, idx) => +item != +vAry2[idx])
  return diffIdx !== -1 ? +vAry2[diffIdx] > +vAry1[diffIdx] : true
}
const SelectMaterialVersion: FC<{
  curMaterial: Material
  versions: MaterialVersion[]
  isBranch?: boolean
  selectedMaterials?: Material[]
  onChange?: (materials: Material[]) => void
  /** 允许选择所有版本，默认是小于material版本不可以选 */
  allowAnyVersion?: boolean
}> = ({
  versions,
  curMaterial,
  onChange,
  selectedMaterials,
  isBranch,
  allowAnyVersion,
}) => {
  const selectedMaterial = useMemo(() => {
    return selectedMaterials?.find(
      (item) => item.namespace === curMaterial.namespace
    )
  }, [curMaterial, selectedMaterials])

  const columns = useMemo(() => {
    return [
      {
        title: '物料名称',
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: '版本号',
        dataIndex: 'version',
        key: 'version',
      },
      {
        title: '发布人',
        dataIndex: 'creator_name',
        key: 'creator_name',
        render: (creatorName) => {
          return creatorName
        },
      },
      {
        title: '发布时间',
        dataIndex: 'create_time',
        key: 'create_time',
        render: (time) => {
          return unifiedTime(time)
        },
      },
      {
        title: '操作',
        dataIndex: 'operate',
        key: 'operate',
        render: (_, item) => {
          const onClick = () => {
            if (selectedMaterial?.version === item.version) {
              // 取消选择这个版本
              onChange(
                selectedMaterials.filter(
                  (t) => t.namespace !== selectedMaterial.namespace
                )
              )
            } else {
              // 选择这个版本，新增选择，或者修改已有选择的版本
              onChange(
                !selectedMaterial
                  ? (selectedMaterials ?? []).concat({
                      ...curMaterial,
                      version: item.version,
                      material_pub_id: item.material_pub_id,
                    })
                  : (selectedMaterials ?? []).map((m) => {
                      if (m.namespace === curMaterial.namespace) {
                        return {
                          ...m,
                          version: item.version,
                          material_pub_id: item.material_pub_id,
                        }
                      } else {
                        return m
                      }
                    })
              )
            }
          }

          if (!allowAnyVersion) {
            const disabled = !checkIsAllowSelect(item, curMaterial)
            if (disabled) {
              /** 是否当前选中 */
              const isCurrent = item.version === curMaterial.version

              return (
                <Tooltip
                  title={isCurrent ? '' : '物料版本不能低于当前已生效版本'}
                >
                  <Button size="small" disabled>
                    {isCurrent ? '当前' : '使用'}
                  </Button>
                </Tooltip>
              )
            }
          }

          return (
            <Button size="small" onClick={onClick}>
              {selectedMaterial?.version === item.version ? '取消' : '使用'}
            </Button>
          )
        },
      },
    ]
  }, [selectedMaterial, allowAnyVersion, curMaterial, selectedMaterials])

  const prependLatestVersion = (versions) => {
    if (isBranch || !versions?.length) {
      return versions
    }

    if (!Array.isArray(versions) || versions.length < 1) {
      return versions
    }
    // 正式版默认额外添加一个latest版本
    return [
      {
        ...versions[0],
        version: 'latest',
      },
    ].concat(
      {
        ...versions[0],
        // 最新版本设置isLatest标识
        isLatest: true,
      },
      versions.slice(1)
    )
  }

  return (
    <div className={styles.materialVersion}>
      <div className={styles.table}>
        <Table
          rowKey="material_id"
          columns={columns}
          dataSource={
            curMaterial.type === MaterialType.COMPONENT
              ? prependLatestVersion(versions || [])
              : versions
          }
          pagination={false}
        />
      </div>
    </div>
  )
}
