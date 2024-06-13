import React from "react";

import { Dropdown } from "./dropdown";
import { Shared, User, Edit, Move, Copy, Export, Trash, More } from "@/components/icon";

import css from "./index.less";

export function RenderOperate({project, operate, size = 28, iconSize = 18, appMeta}) {
  const {extName} = project
  /** 非文件夹，可分享 */
  const isFolder = ["folder"].includes(extName);
  /** 是否已分享 */
  const alreadyShared = [1, 11].includes(project.shareType);
  /** 是否支持游客直接访问 */
  const touristVisit = [10, 11].includes(project.shareType);

  let dropdownMenus = [
    isFolder ? undefined : {
      key: 'share',
      label: (
        <div className={css.operateItem} onClick={() => {
          if(alreadyShared) {
            operate('unshare', {project})
          } else {
            operate('share', {project})
          }
        }}>
          <Shared />
          <div className={css.label}>{ alreadyShared ? '取消分享' : '分享'}</div>
        </div>
      )
    },
    isFolder ? undefined : {
      key: 'touristVisit',
      label: (
        <div className={css.operateItem} onClick={() => {
          if(touristVisit) {
            operate('unTouristVisit', { project })
          } else {
            operate('touristVisit', { project })
          }
        }}>
          <User />
          <div className={css.label}>{ touristVisit ? '取消游客可访问' : '游客访问'}</div>
        </div>
      )
    },
    {
      key: 'rename',
      label: (
        <div className={css.operateItem} onClick={() => operate('rename', {project})}>
          <Edit />
          <div className={css.label}>重命名</div>
        </div>
      )
    },
    {
      key: 'move',
      label: (
        <div className={css.operateItem} onClick={() => operate('move', {project})}>
          <Move />
          <div className={css.label}>移动到</div>
        </div>
      )
    },
   !isFolder ? {
      key: 'copy',
      label: (
        <div className={css.operateItem} onClick={() => operate('copy', {project})}>
          <Copy />
          <div className={css.label}>创建副本</div>
        </div>
      )
    } : null,
    appMeta?.snapshot?.export ? {
      key: 'exportSnapshot',
      label: (
        <div className={css.operateItem} onClick={() => operate('exportSnapshot', {project, appMeta})}>
          <Export />
          <div className={css.label}>导出</div>
        </div>
      )
    } : undefined,
    {
      key: 'divider1',
      label: (
        <Divider />
      )
    },
    {
      key: 'delete',
      label: (
        <div className={css.operateItem} onClick={() => operate('delete', {project})}>
          <Trash />
          <div className={css.label}>删除</div>
        </div>
      )
    }
  ].filter(item => item)

  return (
    <div
      className={css.btns}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Dropdown
        menus={dropdownMenus}
        overlayClassName={css.overlayClassName}
      >
        <ClickableIconContainer size={size}>
          <More />
        </ClickableIconContainer>
      </Dropdown>
    </div>
  )
}

function ClickableIconContainer({className = '', size = 28, children}) {
  return (
    <div className={`${css.clickableIconContainer} ${className}`} style={{width: size, height: size}}>
      {children}
    </div>
  )
}

function Divider() {
  return <div className={css.divider}></div>
}
