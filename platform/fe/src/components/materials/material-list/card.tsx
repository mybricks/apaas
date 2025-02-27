import React, { useRef, useCallback, useMemo } from 'react'
import { Tooltip, Dropdown, Badge} from 'antd'
import {
  MoreOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import classNames from 'classnames'

import { unifiedTime, getLabelWidth } from './../utils'

import { ThemeIcon, ComponentIcon } from './../icon'

import css from './index.less'
import { User } from '@/routes/workspace/types'
import { Material } from './../types'


interface SelectableMaterial {
  material: any
  snap?: any
  selected?: boolean
  /** 不可修改选择状态 */
  readonly?: boolean
  onSelect?: (m) => void
  onCancel?: (m) => void

  extra?: any
}

interface OperableMaterial {
  user?: User
  material: any
  snap?: any
  onShare?: (m) => void
  onUpgrade?: (m) => void
  onDelete?: (m) => void
  onClick?: (m: Material) => void

}

type MaterialItemProps =
  | (SelectableMaterial & { mode: 'selectable' })
  | (OperableMaterial & { mode?: 'operable' })

/**
 * @description 支持各种升级/删除操作的物料卡片
 * @param param0 
 * @returns 
 */
const OperableMaterialItem = ({
  material,
  user,
  snap,
  onShare,
  onDelete,
  onUpgrade,
  onClick,
}: OperableMaterial) => {
  const {
    preview_img,
    icon,
    type,
    namespace,
    title,
    creator_name,
    creator_id,
    update_time,
    version,
    scope_status,
    canShare,
    nextVersion,
  } = material

  const Actions = useMemo(() => {
    const menus = []
    // if (canShare && scope_status !== 3 && scope_status !== 2) {
    //   menus.push({
    //     key: 'share',
    //     label: (
    //       <div className={css.operateItem} onClick={() => onShare(material)}>
    //         <CloudUploadOutlined width={16} height={16} />
    //         <div className={css.label}>分享</div>
    //       </div>
    //     ),
    //   })
    // }
    if (user.isAdmin && nextVersion) {
      menus.push({
        key: 'upgrade',
        label: (
          <div className={css.operateItem} onClick={(e) => {
            e.stopPropagation();
            onUpgrade(material);
          }}>
            <CloudDownloadOutlined width={16} height={16} />
            <div className={css.label}>升级</div>
          </div>
        ),
      })
    }
    if (user.isAdmin || +user?.id === +creator_id) {
      menus.push({
        key: 'delete',
        danger: true,
        label: (
          <div className={css.operateItem} onClick={(e) => {
            e.stopPropagation();
            onDelete(material);
          }}>
            <DeleteOutlined width={16} height={16} />
            <div className={css.label}>删除</div>
          </div>
        ),
      })
    }
    if (menus.length) {
      return (
        <div className={css.btns}>
          <Dropdown
            trigger={['hover']}
            menu={{ items: menus }}
            overlayClassName={css.operates}
          >
            <MoreOutlined style={{ transform: 'rotate(90deg)' }} />
          </Dropdown>
        </div>
      )
    }
    return null
  }, [scope_status, material, nextVersion, user])

  const Ribbon = useMemo(() => {
    return !!nextVersion ? Badge.Ribbon : React.Fragment
  }, [nextVersion])

  return (
    <div className={classNames(css.material, { [css.clickable]: !!onClick })} onClick={() => onClick?.(material)}>
      <Ribbon
        className={css.ribbon}
        text={!!nextVersion ? '有新的更新' : null}
        color="gold"
      >
        <div className={css.item}>
          {snap}
          <div className={css.content}>
            <div className={css.detail}>
              <div className={css.name}>
                <Tooltip
                  placement="topLeft"
                  title={getLabelWidth(title) > 212 ? title : undefined}
                >
                  {title}
                </Tooltip>
              </div>
              <div className={css.createName}>
                创建人：
                {(
                  creator_name || (creator_id ? String(creator_id) : '')
                )?.split('@')[0] ?? ''}
              </div>
              <div className={css.time}>
                更新时间：{unifiedTime(update_time)}
              </div>
              <div className={css.version}>版本号：{version}</div>
            </div>
            {Actions}
          </div>
        </div>
      </Ribbon>
    </div>
  )
}

/**
 * @description 支持选择和选择当前物料其它版本的物料卡片
 * @param param0 
 * @returns 
 */
const SelectableMaterialItem = ({
  material,
  snap,
  selected = false,
  readonly = false,
  onSelect,
  onCancel,
  extra: Extra,
}: SelectableMaterial) => {
  const {
    preview_img,
    icon,
    type,
    namespace,
    title,
    creator_name,
    creator_id,
    update_time,
    version,
  } = material

  const onClick = useCallback(() => {
    if (readonly) {
      return
    }

    if (selected) {
      onCancel(material.id)
    } else {
      onSelect(material)
    }
  }, [material, selected, readonly, onSelect, onCancel])

  return (
    <div
      className={classNames(
        css.material,
        { [css.selectable]: !readonly, [css.readonly]: readonly },
        {
          [css.selected]: selected,
        }
      )}
      onClick={onClick}
      data-text={readonly ? '当前已添加' : '已选择'}
    >
      <div className={css.item}>
        {snap}
        <div className={css.content}>
          <div className={css.detail}>
            <div className={css.name}>
              <Tooltip
                placement="topLeft"
                title={getLabelWidth(title) > 212 ? title : undefined}
              >
                {title}
              </Tooltip>
            </div>
            <div className={css.createName}>
              创建人：
              {(creator_name || (creator_id ? String(creator_id) : ''))?.split(
                '@'
              )[0] ?? ''}
            </div>
            <div className={css.time}>更新时间：{unifiedTime(update_time)}</div>
            {version && <div className={css.version}>版本号：{version}</div>}
          </div>
        </div>
      </div>
      <div className={css.extra}>
        {typeof Extra === 'function' ? <Extra material={material} /> : Extra}
      </div>
    </div>
  )
}

/**
 * @description 物料卡片
 * @param props 
 * @returns 
 */
export const MaterialCard: React.FC<MaterialItemProps> = (props) => {
  const { material } = props

  const {
    tags,
    preview_img,
    icon,
    type,
    namespace,
    title,
    creator_name,
    creator_id,
    update_time,
    version,
    scope_status,
    canShare,
    nextVersion,
  } = material

  const isIcon = tags?.includes('icon') && type === 'picture'
  const isImage = tags?.includes('image') && type === 'picture'

  const isCloudComponent = useMemo(
    () => /^mybricks\.cdm\.\d+-/.test(namespace),
    [namespace]
  )

  const Snap = useMemo(() => {
    let ImageJsx
    switch (true) {
      case !preview_img && !icon && type === 'theme': {
        ImageJsx = <ThemeIcon />
        break
      }
      case !preview_img && !icon: {
        ImageJsx = <ComponentIcon />
        break
      }
      case isIcon && preview_img: {
        ImageJsx = (
          <div
            dangerouslySetInnerHTML={{ __html: preview_img }}
            style={{ fontSize: 35 }}
          ></div>
        )
        break
      }
      default: {
        ImageJsx = (
          <div
            className={css.img}
            style={{
              backgroundImage: `url("${preview_img || icon}")`,
              backgroundSize: preview_img ? 'contain' : '80px',
            }}
          />
        )
        break
      }
    }

    const TagsJsx = []
    if (tags?.includes?.('react')) {
      TagsJsx.push(<div className={classNames(css.tag, css.react)}>React</div>)
    }
    if (tags?.includes?.('vue')) {
      TagsJsx.push(<div className={classNames(css.tag, css.vue)}>Vue</div>)
    }
    if (tags?.includes?.('vue2')) {
      TagsJsx.push(<div className={classNames(css.tag, css.vue)}>Vue2</div>)
    }
    if (tags?.includes?.('vue3')) {
      TagsJsx.push(<div className={classNames(css.tag, css.vue)}>Vue3</div>)
    }
    if (isCloudComponent) {
      TagsJsx.push(
        <div className={classNames(css.tag, css.cloudComponent)}>云组件</div>
      )
    }

    return (
      <div className={css.snap}>
        {ImageJsx}
        <div className={css.tags}>{TagsJsx}</div>
      </div>
    )
  }, [material, preview_img, icon, tags])

  if (props.mode === 'selectable') {
    const { onSelect, onCancel, selected, readonly, extra } = props
    return (
      <SelectableMaterialItem
        material={material}
        selected={selected}
        readonly={readonly}
        snap={Snap}
        onSelect={onSelect}
        onCancel={onCancel}
        extra={extra}
      />
    )
  }
  const { user, onShare, onUpgrade, onDelete, onClick } = props
  return (
    <OperableMaterialItem
      material={material}
      snap={Snap}
      user={user}
      onShare={onShare}
      onUpgrade={onUpgrade}
      onDelete={onDelete}
      onClick={onClick}
    />
  )
}