import React, { FC } from "react";

import { User, FileData } from "@workspace/types";
import { useWorkspaceConetxt } from "@workspace/context";
import { Icon } from "@workspace/components/icon";
import { Dropdown } from "./dropdown";
import classNames from "classnames";
import FileLink from "../FileLink";
import { Handle } from "./FilesListContainer";

import css from "./ViewAsGrid.less";

interface ViewAsGridProps {
  files: FileData[];
  user: User;
  roleDescription: number;
  handle: Handle;
}

const ViewAsGrid: FC<ViewAsGridProps> = ({
  user: {
    id: userId
  },
  files,
  handle,
  roleDescription
}) => {
  const { apps: { getApp } } = useWorkspaceConetxt();

  return (
    <div className={css.files}>
      {files.map((file) => {
        const {
          id,
          name,
          extName,
          icon: fileIcon,
          creatorId,
          shareType,
          creatorName,
        } = file;
        const app = getApp(extName);
        const { icon: appIcon } = app;
        /** 文件夹用大图标 */
        const snapLargeIcon = ["folder"].includes(extName) || fileIcon;
        /** 创建人和拥有管理、编辑权限的用户可见操作按钮 */
        const showOperate = (creatorId == userId) || [1, 2].includes(roleDescription)
        /** 是否已分享 */
        const alreadyShared = [1, 11].includes(shareType);
        /** 是否支持游客直接访问 */
        const touristVisit = [10, 11].includes(shareType);
        return (
          <FileLink key={id} file={file} app={app}>
             <div className={css.file}>
              {
                alreadyShared || touristVisit ? (
                  <div className={css.share}>
                    <SharerdIcon width={16} height={16} />
                  </div>
                ) : null
              }
              <div className={classNames(css.snap)}>
                <span className={snapLargeIcon ? css.largeIcon : css.icon}>
                  <Icon icon={fileIcon || appIcon} />
                </span>
              </div>
              <div className={css.tt}>
                <div className={css.typeIcon}>
                  <Icon icon={appIcon}/>
                </div>
                <div className={css.detail}>
                  <div className={css.name}>
                    {name}
                  </div>
                  <div className={css.path}>
                    {creatorName}
                  </div>
                </div>
                {showOperate && <RenderOperate project={file} operate={handle} appMeta={app} />}
              </div>
            </div>
          </FileLink>
        )
      })}
    </div>
  )
}

export default ViewAsGrid;

function SharerdIcon({ width = 32, height = 32 }) {
  return (
    <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="13647" width={width} height={height}><path d="M422.5536 27.0336zM431.8208 25.6a25.6 25.6 0 0 1 4.096 50.8928c-1.024 0.2048-2.56 0.4096-7.5264 1.024H165.4272c-48.64 0-88.6272 42.0864-88.6272 94.6176v680.448c0 52.5312 39.9872 94.6176 88.6272 94.6176H858.624c48.64 0 88.6272-42.0864 88.6272-94.6176V451.584a25.6 25.6 0 0 1 51.2 0v400.9984c0 80.2304-62.3104 145.8176-139.8272 145.8176H165.376C87.9104 998.4 25.6 932.864 25.6 852.5824V172.1344C25.6 91.904 87.9104 26.3168 165.4272 26.3168l259.1744 0.1536A30.4128 30.4128 0 0 1 431.8208 25.6z m531.456 68.5568a24.832 24.832 0 0 1 18.432 29.3376 25.9072 25.9072 0 0 1-6.144 12.8L814.4896 363.008a25.6 25.6 0 0 1-41.7792-29.696l128.256-180.5312C634.5216 204.3904 409.088 423.6288 387.2768 688.128a25.6 25.6 0 0 1-51.0464-4.1984c22.528-273.7152 242.3808-500.8384 510.4128-571.2384l-156.0576-46.6432a25.6 25.6 0 0 1 14.6944-49.0496l257.9968 77.1584zM437.248 76.0832l-0.5632 0.2048a2.816 2.816 0 0 0 0.5632-0.2048z" fill="#333333" p-id="13648"></path></svg>
  )
}

import {
  EditOutlined,
  CopyOutlined,
  SelectOutlined,
  ShareAltOutlined,
  ExportOutlined,
  ExclamationCircleFilled,
  UserOutlined,
  BranchesOutlined
} from '@ant-design/icons'

export function RenderOperate({project, operate, size = 28, iconSize = 18, appMeta}: any) {
  const {extName} = project
  /** 非文件夹，可分享 */
  const isFolder = ["folder"].includes(extName)
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
            // operate('unshare', {project})
            operate.unShare({ file: project })
          } else {
            // operate('share', {project})
            operate.share({ file: project })
          }
        }}>
          {/* @ts-ignore */}
          <ShareAltOutlined width={16} height={16}/>
          <div className={css.label}>{ alreadyShared ? '取消分享' : '分享'}</div>
        </div>
      )
    },
    isFolder ? undefined : {
      key: 'touristVisit',
      label: (
        <div className={css.operateItem} onClick={() => {
          if(touristVisit) {
            // operate('unTouristVisit', { project })
            operate.unTouristVisit({ file: project })
          } else {
            // operate('touristVisit', { project })
            operate.touristVisit({ file: project })
          }
        }}>
          {/* @ts-ignore */}
          <UserOutlined width={16} height={16} />
          <div className={css.label}>{ touristVisit ? '取消游客可访问' : '游客访问'}</div>
        </div>
      )
    },
    {
      key: 'rename',
      label: (
        <div className={css.operateItem} onClick={() => operate.rename({ file: project })}>
          {/* @ts-ignore */}
          <EditOutlined width={16} height={16}/>
          <div className={css.label}>重命名</div>
        </div>
      )
    },
    {
      key: 'move',
      label: (
        <div className={css.operateItem} onClick={() => operate.move({ file: project })}>
          {/* @ts-ignore */}
          <SelectOutlined width={16} height={16}/>
          <div className={css.label}>移动到</div>
        </div>
      )
    },
   !isFolder ? {
      key: 'copy',
      label: (
        <div className={css.operateItem} onClick={() => operate.copy({ file: project })}>
          {/* @ts-ignore */}
          <CopyOutlined width={16} height={16}/>
          <div className={css.label}>创建副本</div>
        </div>
      )
    } : null,
    ["pc-page", "pc-cdm"].includes(extName) ? {
      key: 'createBranch',
      label: (
        <div className={css.operateItem} onClick={() => operate.createBranch({ file: project })}>
          {/* @ts-ignore */}
          <BranchesOutlined width={16} height={16}/>
          <div className={css.label}>创建分支</div>
        </div>
      )
    } : null,
    appMeta?.snapshot?.export ? {
      key: 'exportSnapshot',
      label: (
        <div className={css.operateItem} onClick={() => operate('exportSnapshot', {project, appMeta})}>
          {/* @ts-ignore */}
          <ExportOutlined width={16} height={16}/>
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
        <div className={css.operateItem} onClick={() => operate.delete({ file: project })}>
          <Trash width={16} height={16}/>
          <div className={css.label}>删除</div>
        </div>
      )
    }
  ].filter(item => item)

  return (
    <div className={css.btns} onClick={(e) => {
      e.preventDefault(); // 目前不加会触发页面刷新，看下Link相关
    }}>
      <Dropdown
        menus={dropdownMenus}
        overlayClassName={css.overlayClassName}
      >
        <ClickableIconContainer size={size}>
          <More width={iconSize} height={iconSize}/>
        </ClickableIconContainer>
      </Dropdown>
    </div>
  )
}

function Divider() {
  return <div className={css.divider}></div>
}

function ClickableIconContainer({className = '', size = 28, children}) {
  return (
    <div className={`${css.clickableIconContainer} ${className}`} style={{width: size, height: size}}>
      {children}
    </div>
  )
}

/** 删除(垃圾桶) */
function Trash ({width, height}) {
  return (
    <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
       width={width} height={height}>
    <path
      d="M765.505691 191.942567 639.627772 191.942567c0-35.32453-28.636201-63.960731-63.960731-63.960731L447.74558 127.981836c-35.32453 0-63.960731 28.636201-63.960731 63.960731L257.905908 191.942567c-36.452213 0-66.00325 29.551036-66.00325 66.00325l0 59.875692c0 36.452213 29.551036 66.00325 66.00325 66.00325l-2.042519 0 0 445.681572c0 36.452213 29.551036 66.00325 66.00325 66.00325l61.918211 0 63.960731 0 127.921461 0 63.960731 0 61.918211 0c36.452213 0 66.00325-29.551036 66.00325-66.00325L767.549234 383.823736l-2.042519 0c36.452213 0 66.00325-29.551036 66.00325-66.00325l0-59.875692C831.508941 221.49258 801.958928 191.942567 765.505691 191.942567zM703.58748 803.413046c-0.101307 3.123131-1.743714 27.813462-27.961842 28.134781l-35.998889 0-63.960731 0L447.74558 831.547827 383.78485 831.547827l-35.879162 0c-27.988448-0.343831-27.969005-28.459169-27.969005-28.459169l-0.112564 0.031722L319.824119 383.823736l383.76336 0L703.58748 803.413046zM735.567845 319.863005 287.843754 319.863005c-17.662265 0-31.980365-14.3181-31.980365-31.980365 0-17.662265 14.3181-31.980365 31.980365-31.980365l159.901827 0 127.921461 0 159.901827 0c17.662265 0 31.980365 14.3181 31.980365 31.980365C767.54821 305.544905 753.23011 319.863005 735.567845 319.863005z"
    ></path>
    <path
      d="M447.74558 767.588119c17.662265 0 31.980365-14.3181 31.980365-31.980365L479.725946 479.764831c0-17.662265-14.3181-31.980365-31.980365-31.980365-17.662265 0-31.980365 14.3181-31.980365 31.980365l0 255.842922C415.765215 753.270019 430.083316 767.588119 447.74558 767.588119z"
    ></path>
    <path
      d="M575.667042 767.588119c17.662265 0 31.980365-14.3181 31.980365-31.980365L607.647407 479.764831c0-17.662265-14.3181-31.980365-31.980365-31.980365-17.662265 0-31.980365 14.3181-31.980365 31.980365l0 255.842922C543.686676 753.270019 558.004777 767.588119 575.667042 767.588119z"
    ></path>
  </svg>
  );
}


/** 更多（操作省略） */
function More({width, height}) {
  return (
    <svg width={width} height={height} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2825"><path d="M512 512m-96.7 0a96.7 96.7 0 1 0 193.4 0 96.7 96.7 0 1 0-193.4 0Z" fill="#5A5A68" p-id="2826"></path><path d="M863 512m-96.7 0a96.7 96.7 0 1 0 193.4 0 96.7 96.7 0 1 0-193.4 0Z" fill="#5A5A68" p-id="2827"></path><path d="M161 512m-96.7 0a96.7 96.7 0 1 0 193.4 0 96.7 96.7 0 1 0-193.4 0Z" fill="#5A5A68" p-id="2828"></path></svg>
  )
}
