import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { message, Breadcrumb } from "antd";
import classNames from "classnames";
import { useNavigate } from "react-router-dom";

import { RenderOperate } from "./component/renderOperate";
import { useAppConetxt, useUserContext } from "@/context";
import { Button, Popover, Modal, Input } from "@/components";
import { Shared, Icon } from "@/components/icon";
import { JSXDefaultProps } from "../detail";
import { InstalledApp } from "@/types";

import css from "./index.less";

const { confirm } = Modal;

interface FilesProps extends JSXDefaultProps {

}

/** 获取当前groupId下权限 */
const getRoleDescription: (props: { groupId?: number, userId: number }) => Promise<number> = async ({ groupId, userId }) => {
  if (!groupId) {
    return 1
  }

  const response = (await axios.get("/paas/api/userGroup/getUserGroupRelation", {
    params: {
      id: groupId,
      userId,
    }
  })).data.data;

  return response ? response.roleDescription : 3;
}

interface FilePath {
  id?: number;
  name: string;
  parentId?: number;
  groupId?: number;
  extName?: string;
}

/** 获取文件路径 */
const getFilePaths: (props: { groupId?: number, parentId?: number }) => Promise<FilePath[]> = async ({ groupId, parentId }) => {
  return (await axios.get("/paas/api/file/getFilePath", {
    params: {
      fileId: parentId,
      groupId
    }
  })).data.data;
}

interface File {
  id: number;
  parentId?: number;
  groupId?: number;
  name: string;
  extName: string;
  createTime: string;
  updateTime: string;
  icon?: string;
  creatorId: number;
  shareType?: number;
  creatorName: string;
}

/** 获取文件列表 */
const getFiles: (props: { groupId?: number, userId: number, parentId?: number }) => Promise<File[]> = async ({ groupId, parentId, userId }) => {
  return filesSort((await axios.get(`/paas/api/file/${groupId ? "getGroupFiles" : "getMyFiles"}`, {
    params: {
      userId,
      parentId,
      groupId
    }
  })).data.data);
}

/** 文件列表排序 */
const filesSort = (files: File[]) => {
  /** 参与排序替换位置，数字越大越靠前 */
  const orderMap = {
    'folder': 1
  }
  return files.sort((c, s) => {
    const cNum = orderMap[c.extName] || -1
    const sNum = orderMap[s.extName] || -1

    return sNum - cNum
  })
}

export default function Files({ locationContext }: FilesProps) {
  const navigate = useNavigate();
  const { user: { id: userId, name: userName, email: userEmail } } = useUserContext();
  const { apps: { folderApps, getAppByNamespace }, system, getUserSystemConfig } = useAppConetxt();
  const { current } = useRef<{ groupId?: number, parentId?: number, roleDescription?: number }>({})
  const { roleDescription } = current;
  const { params } = locationContext;
  const [filePaths, setFilePaths] = useState<FilePath[]>([]);
  const [files, setFiles] = useState<File[]>(null);
  const [createApp, setCreateApp] = useState(null);

  useEffect(() => {
    const { groupId, parentId } = params;

    Promise.all([
      getRoleDescription({ groupId, userId }),
      getFilePaths({ groupId, parentId }),
      getFiles({ groupId, userId, parentId })
    ]).then(([roleDescription, filePaths, files]) => {
      current.roleDescription = roleDescription;
      setFilePaths((!groupId ? [{id: null, name: '我的', parentId: null, groupId: null, extName: null}] : [] as FilePath[]).concat(filePaths));
      setFiles(files);
    })
  }, [params])

  const handleBreadcrumbClick = (filePath: FilePath) => {
    const { id, groupId, extName } = filePath;
    if (filePaths[filePaths.length - 1].id !== id) {
      navigate("?appId=files" + (!extName && id) ? `&groupId=${id}` : `${groupId ? `&groupId=${groupId}` : ''}${id ? `&parentId=${id}` : ''}`);
    }
  }

  const handleCreateApp = async (app: InstalledApp) => {
    const { extName, namespace } = app;
    const { createFileCount } = getUserSystemConfig();
    if (createFileCount) {
      const appMaxCreateFleCount = createFileCount[extName];
      if (appMaxCreateFleCount) {
        const response = (await axios.post("/paas/api/file/getCountOfUserAndExt", {
          userId,
          extName
        })).data.data as number;
        if (appMaxCreateFleCount <= response) {
          message.error('当前账号此类型文件数量已达上限，禁止新建');
          return
        }
      }
    }

    const { createBasedOnTemplate } = system;

    if (createBasedOnTemplate?.includes(namespace)) {
      // 基于模版创建
    } else if (namespace === "mybricks-app-pc-template") {
      console.log("特殊处理");
    } else {
      // 直接创建
      console.log("直接创建");
      setCreateApp(app);
    }
    // 开启了基于模板新建
    // if (appCtx?.systemConfig?.createBasedOnTemplate && appCtx?.systemConfig?.createBasedOnTemplate?.indexOf(app.namespace) !== -1) {
    //   // 基于模板新建
    //   setChooseTemplateModalVisible(true)
    //   chooseApp = app
    // } else if (app.namespace === 'mybricks-app-pc-template') {
    //   setPageChooseModalVisible(true)
    //   chooseApp = app
    // } else {
    //   // 直接新建
    //   setCreateApp(app)
    // }
  }

  const handleCreateAppModalOk = async (value: { fileName: string, type?: string, componentType?: string }) => {
    return new Promise(async (resolve, reject) => {
      const item = filePaths[filePaths.length - 1];
      const isGroup = !!!item.extName && !!item.id
      const { fileName, componentType, type } = value
      const { extName, isSystem } = createApp;
      const params: any = {
        extName,
        userId,
        userName: userName || userEmail,
        type
      };
      if (isGroup) {
        params.groupId = item.id;
      } else {
        params.parentId = item.id;
        params.groupId = item.groupId;
      }

      if (isSystem) {
        params.type = 'system'
      }

      console.log("🍎 TODO: 1. 选择模版的创建")

      if (
        // chooseTemplate
        false
      ) {
        // axios({
        //   method: 'post',
        //   url: getApiUrl('/paas/api/file/createFileBaseTemplate'),
        //   data: { ...params, name: fileName, templateId: chooseTemplate.fileId, dumpJSON: chooseTemplate.dumpJSON }
        // }).then(async ({ data }) => {
        //   if (data.code === 1) {
        //     const appReg = appCtx.APPSMap[extName]
        //     const { homepage } = appReg

        //     ctx.getAll(getUrlQuery())

        //     if (typeof homepage === 'string') {
        //       setTimeout(() => {
        //         window.open(`${homepage}?id=${data.data.id}`);
        //       }, 0);
        //     }

        //     if (folderExtnames.includes(extName)) {
        //       await appCtx.refreshSidebar()
        //     }

        //     resolve('创建成功！')
        //   } else {
        //     reject(`创建文件错误：${data.message}`)
        //   }
        // })
      } else {
        const response = (await axios.post("/paas/api/workspace/createFile", {
          ...params, name: fileName, componentType
        })).data;

        if (response.code === 1) {
          console.log("🍎 TODO: 1. 跳转应用 2. 刷新侧边栏");
          // const appReg = appCtx.APPSMap[extName]
          // const { homepage } = appReg

          // ctx.getAll(getUrlQuery())
          // if (typeof homepage === 'string') {
          //   const { id: fileId } = data.data
          //   if (app.extName === 'pc-template') {
          //     setTimeout(() => {
          //       window.open(`${homepage}?id=${fileId}&targetPageId=${targetPageId}`);
          //     }, 0);
          //   } else {
          //     setTimeout(() => {
          //       window.open(`${homepage}?id=${data.data.id}`);
          //     }, 0);
          //   }
          // }

          // if (folderExtnames.includes(extName)) {
          //   await appCtx.refreshSidebar()
          // }
          setCreateApp(null);
          resolve("新建成功");
        } else {
          reject(`创建文件错误：${response.message}`);
        }
      }
    })
  }

  /** 各种操作 */
  const handleOperate = (type, {project, appMeta}: any) => {
    const { id, name, extName, parentId, groupId } = project;
    switch (type) {
      case 'open':
        if (!["folder"].includes(extName)) {
          const { homepage } = appMeta;
          window.open(`${homepage}?id=${id}`);
        } else {
          navigate(`?appId=files${groupId ? `&groupId=${groupId}` : ''}${id ? `&parentId=${id}` : ''}`);
        }
        break;
      case 'delete':
        confirm({
          title: `确定要删除"${name}"吗？`,
          onOk() {
            return new Promise((resolve) => {
              console.log("删除")

              
              // axios({
              //   method: "post",
              //   url: getApiUrl('/paas/api/workspace/deleteFile'),
              //   data: {id: project.id, userId: appCtx.user.id}
              // }).then(async ({data}) => {
              //   if (data.code === 1) {
              //     ctx.getAll(getUrlQuery());
              //     console.log('进来了',folderExtnames, extName)
              //     if (folderExtnames.includes(extName)) {
              //       await appCtx.refreshSidebar();
              //     }
              //     message.success('删除成功');
              //     resolve(true);
              //   } else {
              //     message.error(`删除项目错误：${data.message}`);
              //   }
              // });
            })
          },
          onCancel() {},
        })
        break;
      case 'rename':
        // setCreateApp(project)
        console.log("重命名")
        break;
      case 'share': 
      case 'unshare': {
        const clickShare = type === 'share'
        confirm({
          title: clickShare ? `即将分享"${name}"到大家的分享` : `即将取消分享"${name}"`,
          // icon: <ExclamationCircleFilled />,
          // centered: true,
          // okText: '确认',
          // cancelText: '取消',
          onOk() {
            return new Promise((resolve) => {
              console.log("分享")
              // axios({
              //   method: "post",
              //   url: clickShare ? getApiUrl('/paas/api/file/share/mark') : getApiUrl('/paas/api/file/share/unmark'),
              //   data: {id: project.id, userId: appCtx.user.id, type: 'share'}
              // }).then(async ({data}) => {
              //   if (data.code === 1) {
              //     ctx.getAll(getUrlQuery());
              //     if (folderExtnames.includes(extName)) {
              //       await appCtx.refreshSidebar();
              //     }
              //     message.success(clickShare ? `分享成功` : '取消分享成功');
              //   } else {
              //     message.error(`${data.msg}`);
              //   }
              //   resolve(true)
              // });
            })
          },
          onCancel() {},
        })
        break
      }
      case 'touristVisit':
      case 'unTouristVisit': {
        const needTouristVisit = type === 'touristVisit';
        confirm({
          title: needTouristVisit ? `即将开放"${name}"的游客可访问权限` : `即将取消"${name}"的游客可访问权限`,
          // icon: <ExclamationCircleFilled />,
          // centered: true,
          // okText: '确认',
          // cancelText: '取消',
          onOk() {
            return new Promise((resolve) => {
              console.log("开放访问权限")
              // axios({
              //   method: "post",
              //   url: needTouristVisit ? getApiUrl('/paas/api/file/share/mark') : getApiUrl('/paas/api/file/share/unmark'),
              //   data: {id: project.id, userId: appCtx.user.id, type: 'touristVisit'}
              // }).then(async ({data}) => {
              //   if (data.code === 1) {
              //     ctx.getAll(getUrlQuery());
              //     if (folderExtnames.includes(extName)) {
              //       await appCtx.refreshSidebar();
              //     }
              //     message.success(needTouristVisit ? `开放游客访问权限成功` : '取消游客访问权限成功');
              //   } else {
              //     message.error(`${data.msg}`);
              //   }
              //   resolve(true)
              // });
            })
          },
          onCancel() {},
        })
        break
      }
      case 'move': {
        // setMoveApp(project)
        console.log("移动")
        break;
      }
      case 'copy': {
        console.log("复制")
        // setCopyApp({ ...project, name: `${project.name}(副本)` })
        break
      }
      case 'exportSnapshot': {
        console.log("导出")
        // axios.post(getApiUrl(appMeta.snapshot.export), {
        //   fileId: id,
        //   userId: appCtx.user.id
        // },
        // {responseType: 'blob'}
        // ).then((res) => {
        //   // console.log(res)
        //   const { data, headers } = res
        //   const fileName = headers['content-disposition'].replace(/\w+;filename=(.*)/, '$1')
        //   const blob = new Blob([data], {type: headers['content-type']})
        //   let dom = document.createElement('a')
        //   let url = window.URL.createObjectURL(blob)
        //   dom.href = url
        //   dom.download = decodeURIComponent(fileName)
        //   dom.style.display = 'none'
        //   document.body.appendChild(dom)
        //   dom.click()
        //   dom.parentNode.removeChild(dom)
        //   window.URL.revokeObjectURL(url)
        // }).catch(e => {
        //   console.log(e)
        //   message.error(e.message || '导出失败')
        // }) 
        // console.log(111, appMeta)
        break
      }
      default:
        break;
    }
  }

  return (
    <div className={css.files}>
      <div className={css.title}>
        <div className={css.path}>
          <Breadcrumb
            className={css.breadcrumb}
            items={filePaths.map((path) => {
              return {
                title: (
                  <div className={css.item} onClick={() => handleBreadcrumbClick(path)}>
                    {path.name}
                  </div>
                )
              }
            })}
          />
        </div>
        <div className={css.actions}>
          <Popover
            arrow={false}
            placement="bottomRight"
            content={(
              <>
                <div className={css.appList}>
                  {folderApps.map((app) => {
                    return (
                      <div className={css.app} onClick={() => handleCreateApp(app)}>
                        <div className={css.icon}>
                          {app.icon}
                        </div>
                        <div className={css.info}>
                          <label>{app.title}</label>
                          <p>{app.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
            overlayClassName={css.createAppPopover}
          >
            <div>
              <Button type={"primary"} onClick={() => console.log("点击新建")}>
                新 建
              </Button>
            </div>
          </Popover>
        </div>
      </div>
      <div className={css.split}></div>
      <div className={css.content}>
        <div className={css.list}>
          {!files ? (
            <div className={css.tip}>加载中，请稍后...</div>
          ) : (files.length ? (
            files.map((file) => {
              const { name, extName, icon, creatorId, shareType, creatorName } = file;
              const app = getAppByNamespace(extName);
              const { icon: appIcon } = app;
              const bigAppIcon = extName === "folder" || icon;
              /** 创建人和拥有管理、编辑权限的用户可见操作按钮 */
              const showOperate = (creatorId == userId) || [1, 2].includes(roleDescription);
              /** 是否已分享 */
              const alreadyShared = [1, 11].includes(shareType);
              /** 是否支持游客直接访问 */
              const touristVisit = [10, 11].includes(shareType);

              return (
                <div className={css.file} onClick={() => handleOperate('open', {project: file, appMeta: app})} onDragEnter={(e) => e.preventDefault()}>
                  {
                    alreadyShared || touristVisit ? (
                      <div className={css.share}>
                        <Shared />
                      </div>
                    ) : null
                  }
                  <div className={classNames(css.snap, {[css.bigAppIcon]: bigAppIcon})}>
                    <Icon icon={icon || appIcon}/>
                  </div>
                  <div className={css.tt}>
                    <div className={css.typeIcon}>
                      <Icon icon={appIcon} />
                    </div>
                    <div className={css.detail}>
                      <div className={css.name}>
                        {name}
                      </div>
                      <div className={css.path}>
                        {creatorName}
                      </div>
                    </div>
                    {showOperate && <RenderOperate project={file} operate={handleOperate} appMeta={app} />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={css.tip}>暂无内容，请新建...</div>
          ))}
        </div>
      </div>
      <DefaultCreateAppModal
        app={createApp}
        onOk={handleCreateAppModalOk}
        onCancel={() => setCreateApp(null)}
      />
    </div>
  )
}

interface DefaultCreateAppModalProps {
  // title: string;
  app?: InstalledApp;
  onOk: (props: {
    fileName: string;
    componentType?: string;
    type?: string;
  }) => Promise<any>;
  onCancel: () => void;
}

function DefaultCreateAppModal({ app, onOk, onCancel }: DefaultCreateAppModalProps) {
  const ref = useRef({
    init: false,
    title: "",
    fileNamePlaceholder: "",
    fileName: false
  });
  const { current } = ref;

  if (app && !current.init) {
    const appTitle = app.title;
    current.init = true;
    current.title = `新建${appTitle}`;
    current.fileNamePlaceholder = `请输入${appTitle}名称`;
    current.fileName = false;
  }

  const [fileName, setFileName] = useState("");
  const trimmedFileName = fileName.trim();
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleFileNameChange = (value: string) => {
    current.fileName = true;
    setFileName(value);
  }

  const handleAfterClose = () => {
    current.init = false;
    setFileName("");
  }

  const handleOnOk = () => {
    if (!confirmLoading) {
      setConfirmLoading(true);
      onOk({ fileName }).then((response) => {
        message.success(response);
      }).catch((error) => {
        message.error(error);
        setConfirmLoading(false);
      })
    }
  }

  return (
    <Modal
      open={!!app}
      title={current.title}
      confirmLoading={confirmLoading}
      confirmDisabled={!trimmedFileName}
      onOk={handleOnOk}
      onCancel={onCancel}
      afterClose={handleAfterClose}
    >
      <div className={css.form}>
        <Input
          label="名称"
          placeholder={current.fileNamePlaceholder}
          value={fileName}
          onChange={handleFileNameChange}
          error={!trimmedFileName && current.fileName}
          autoFocus
          // onPressEnter 回车
        />
      </div>
    </Modal>
  )
}
