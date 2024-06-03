import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useLayoutEffect
} from 'react'

import {
  Form,
  Spin,
  Modal,
  Input,
  Table,
  message
} from 'antd'
import axios from 'axios'
import {
  evt,
  observe,
  useComputed,
  useObservable
} from '@mybricks/rxui'
import {
  EditOutlined,
  CopyOutlined,
  SelectOutlined,
  ShareAltOutlined,
  ExportOutlined,
  ExclamationCircleFilled,
  UserOutlined
} from '@ant-design/icons'

import {
  fileSort,
  getApiUrl,
  getUrlQuery,
  unifiedTime
} from '../../../utils'
import Info from './info'
import TitleBar from './title'
import AppCtx from '../../AppCtx'
import {Content, Block} from '..'
import Ctx, {folderExtnames} from './Ctx'
import FolderList from './temp/FolderList'
import {Divider, Dropdown, Icon, Trash, More, SharerdIcon} from '@/components'
import {useDebounceFn, useUpdateEffect} from '@/hooks'

import css from './index.less'

const {confirm} = Modal

let appCtx: AppCtx

export default function Files() {
  // const appCtx = observe(AppCtx, {from: 'parents'})
  appCtx = observe(AppCtx, {from: 'parents'})
  const ctx = useObservable(Ctx, next => {
    const {APPSMap} = appCtx
    next({
      user: appCtx.user,
      setPath({parentId, groupId}) {
        if (groupId) {
          if (groupId !== ctx.groupId) {
            axios({
              method: 'get',
              url: getApiUrl(`/paas/api/userGroup/getUserGroupRelation?id=${groupId}&userId=${appCtx.user.id}`)
            }).then(({data: {data}}) => {
              ctx.roleDescription = data?.roleDescription || 3
            })
          }
        } else {
          ctx.roleDescription = 1
        }
        ctx.projectList = null
        const path = !groupId ? [{id: null, name: '我的', parentId: null, groupId: null, extName: null}] : []

        axios({
          method: "get",
          url: getApiUrl('/paas/api/file/getFilePath'),
          params: {fileId: parentId, groupId}
        }).then(({data}) => {
          if(data.code === 1) {
            if (data.data.length) {
              if (data.data[0]) {
                path.push(...data.data)
              } else {
                history.pushState(null, '', `?appId=files`)
                return
              }
            }
            ctx.path = path
          } else {
            message.error(data.msg)
          }
        })
        ctx.getAll({parentId, groupId})
        ctx.parentId = parentId
        ctx.groupId = groupId
      },
      getAll({parentId, groupId}) {
        if (!groupId) {
          axios({
            method: 'get',
            url: getApiUrl('/paas/api/file/getMyFiles'),
            params: {
              userId: appCtx.user.id,
              parentId
            }
          }).then(({data}) => {
            if(data.code === 1) {
              ctx.projectList = fileSort(data.data)
              .filter(item => APPSMap[item.extName])
              .map(item => ({
                ...item,
                homepage: APPSMap[item.extName].homepage
              }))
            } else {
              message.error(data.msg)
            }
            
          })
        } else {
          axios({
            method: 'get',
            url: getApiUrl('/paas/api/file/getGroupFiles'),
            params: {
              userId: appCtx.user.id,
              parentId,
              groupId
            }
          }).then(({data}) => {
            if(data.code === 1) {
              ctx.projectList = fileSort(data.data)
                .filter(item => APPSMap[item.extName])
                .map(item => ({
                  ...item,
                  homepage: APPSMap[item.extName].homepage
                }))
            } else {
              // 恶心的兼容代码，如果拉取失败，则展示空的列表，避免一直显示加载中
              ctx.projectList = []
              // message.error(data.msg)
            }
          })
        }
      }
    })
  }, {to: 'children'})

  useMemo(() => {
    appCtx.getAll = ctx.getAll
  }, [])

  useComputed(() => {
    const {urlQuery} = appCtx
    const {parentId, groupId} = urlQuery
    setTimeout(() => {
      ctx.setPath({parentId, groupId})
    })
  })

  const pathInfo = useComputed(() => {
    const pathInfo = ctx.path[ctx?.path?.length - 1]
    return pathInfo
  })

  return (
    <>
      <Content title={<TitleBar/>}>
        <Block style={{flex: 1, height: 0, marginBottom: 0, display: 'flex'}}>
	        <Block className={css.projects}>
		        <Projects/>
	        </Block>
          {pathInfo && <Info path={pathInfo}/>}
        </Block>
      </Content>
    </>
  );
}

function Projects() {
  // const appCtx = observe(AppCtx, {from: 'parents'})
  const ctx = observe(Ctx, {from: "parents"})
  const [createApp, setCreateApp] = useState(null)
  const [moveApp, setMoveApp] = useState(null)
  const [copyApp, setCopyApp] = useState(null)
  

  /** 各种操作 */
  const operate = useCallback((type, {project, appMeta}) => {
    const {id, name, extName, parentId, groupId, homepage} = project;
    switch (type) {
      case 'open':
        if (!folderExtnames.includes(extName)) {
          window.open(`${homepage}?id=${id}`);
        } else {
          history.pushState(null, '', `?appId=files${groupId ? `&groupId=${groupId}` : ''}${id ? `&parentId=${id}` : ''}`)
        }
        break;
      case 'delete':
        confirm({
          title: `确定要删除"${name}"吗？`,
          icon: <ExclamationCircleFilled />,
          centered: true,
          okText: '确认',
          cancelText: '取消',
          onOk() {
            return new Promise((resolve) => {
              axios({
                method: "post",
                url: getApiUrl('/paas/api/workspace/deleteFile'),
                data: {id: project.id, userId: appCtx.user.id}
              }).then(async ({data}) => {
                if (data.code === 1) {
                  ctx.getAll(getUrlQuery());
                  console.log('进来了',folderExtnames, extName)
                  if (folderExtnames.includes(extName)) {
                    await appCtx.refreshSidebar();
                  }
                  message.success('删除成功');
                  resolve(true);
                } else {
                  message.error(`删除项目错误：${data.message}`);
                }
              });
            })
          },
          onCancel() {},
        })
        break;
      case 'rename':
        setCreateApp(project)
        break;
      case 'share': 
      case 'unshare': {
        const clickShare = type === 'share'
        confirm({
          title: clickShare ? `即将分享"${name}"到大家的分享` : `即将取消分享"${name}"`,
          icon: <ExclamationCircleFilled />,
          centered: true,
          okText: '确认',
          cancelText: '取消',
          onOk() {
            return new Promise((resolve) => {
              axios({
                method: "post",
                url: clickShare ? getApiUrl('/paas/api/file/share/mark') : getApiUrl('/paas/api/file/share/unmark'),
                data: {id: project.id, userId: appCtx.user.id, type: 'share'}
              }).then(async ({data}) => {
                if (data.code === 1) {
                  ctx.getAll(getUrlQuery());
                  if (folderExtnames.includes(extName)) {
                    await appCtx.refreshSidebar();
                  }
                  message.success(clickShare ? `分享成功` : '取消分享成功');
                } else {
                  message.error(`${data.msg}`);
                }
                resolve(true)
              });
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
          icon: <ExclamationCircleFilled />,
          centered: true,
          okText: '确认',
          cancelText: '取消',
          onOk() {
            return new Promise((resolve) => {
              axios({
                method: "post",
                url: needTouristVisit ? getApiUrl('/paas/api/file/share/mark') : getApiUrl('/paas/api/file/share/unmark'),
                data: {id: project.id, userId: appCtx.user.id, type: 'touristVisit'}
              }).then(async ({data}) => {
                if (data.code === 1) {
                  ctx.getAll(getUrlQuery());
                  if (folderExtnames.includes(extName)) {
                    await appCtx.refreshSidebar();
                  }
                  message.success(needTouristVisit ? `开放游客访问权限成功` : '取消游客访问权限成功');
                } else {
                  message.error(`${data.msg}`);
                }
                resolve(true)
              });
            })
          },
          onCancel() {},
        })
        break
      }
      case 'move': {
        setMoveApp(project)
        break;
      }
      case 'copy': {
        setCopyApp({ ...project, name: `${project.name}(副本)` })
        break
      }
      case 'exportSnapshot': {
        axios.post(getApiUrl(appMeta.snapshot.export), {
          fileId: id,
          userId: appCtx.user.id
        },
        {responseType: 'blob'}
        ).then((res) => {
          // console.log(res)
          const { data, headers } = res
          const fileName = headers['content-disposition'].replace(/\w+;filename=(.*)/, '$1')
          const blob = new Blob([data], {type: headers['content-type']})
          let dom = document.createElement('a')
          let url = window.URL.createObjectURL(blob)
          dom.href = url
          dom.download = decodeURIComponent(fileName)
          dom.style.display = 'none'
          document.body.appendChild(dom)
          dom.click()
          dom.parentNode.removeChild(dom)
          window.URL.revokeObjectURL(url)
        }).catch(e => {
          console.log(e)
          message.error(e.message || '导出失败')
        }) 
        console.log(111, appMeta)
        break
      }
      default:
        break;
    }
  }, []);

  const moveModalOk = useCallback((values, app) => {
    return new Promise((resolve, reject) => {
      appCtx.fileMove(values, app, [async () => await ctx.getAll(getUrlQuery())]).then(resolve).catch(reject)
    })
  }, [])

  /** 渲染项目列表 */
  const Render: JSX.Element | JSX.Element[] = useComputed(() => {
    let JSX: JSX.Element | JSX.Element[] = <></>;
    const userId = appCtx.user.id
    // console.log(ctx.projectList, 'ctx.projectList')
    if (Array.isArray(ctx.projectList)) {
      if (ctx.projectList.length) {
        const {APPSMap} = appCtx;
        const {roleDescription} = ctx;
        JSX = ctx.projectList.map((project) => {
          const {extName} = project
          const appReg = APPSMap[extName];
          const {icon} = appReg;
          const bigIcon = folderExtnames.includes(extName) || project.icon
          /** 创建人和拥有管理、编辑权限的用户可见操作按钮 */
          const showOperate = (project.creatorId == userId) || [1, 2].includes(roleDescription)
          /** 是否已分享 */
          const alreadyShared = [1, 11].includes(project.shareType);
          /** 是否支持游客直接访问 */
          const touristVisit = [10, 11].includes(project.shareType);

          return (
            <DragFile key={project.id} item={project} canDrag={showOperate} drag={moveModalOk}>
              <div className={css.file} onClick={() => operate('open', {project})} onDragEnter={(e) => e.preventDefault()}>
                {
                  alreadyShared || touristVisit ? (
                    <div className={css.share}>
                      <SharerdIcon width={16} height={16} />
                    </div>
                  ) : null
                }
                <div className={css.snap}>
                  <Icon icon={project.icon || icon} width={bigIcon ? 140 : 32} height={bigIcon ? '100%' : 32}/>
                </div>
                <div className={css.tt}>
                  <div className={css.typeIcon}>
                    <Icon icon={icon} width={18} height={18}/>
                  </div>
                  <div className={css.detail}>
                    <div className={css.name}>
                      {project.name}
                    </div>
                    <div className={css.path} data-content-start={project.path}>
                      {project.creatorName}
                    </div>
                  </div>
                  {showOperate && <RenderOperate project={project} operate={operate} appMeta={appReg} />}
                </div>
              </div>
            </DragFile>
          );
        });
      } else {
        JSX = (
          <div className={css.loading}>
            暂无内容，请添加...
          </div>
        )
      }
    } else {
      JSX = (
        <div className={css.loading}>
          加载中，请稍后..
        </div>
      );
    }
    return (
      <div className={css.files}>
        {JSX}
      </div>
    );
  });

  const columns = useCallback(() => {
    const {APPSMap} = appCtx
    const {roleDescription} = ctx
    const userId = appCtx.user.id
    return [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        ellipsis: {
          showTitle: false,
        },
        render: (name, record) => {
          return (
            <DragFile item={record} canDrag={(record.creatorId == userId) || [1, 2].includes(roleDescription)} drag={moveModalOk}>
              <div className={css.tableName} onClick={() => operate('open', { project: record })}>
                <div className={css.tableNameIcon}>
                  <Icon
                    icon={APPSMap[record.extName].icon}
                    width={16}
                    height={16}
                  />
                </div>
                {name}
              </div>
            </DragFile>
          )
        }
      },
      {
        title: '创建人',
        dataIndex: 'creatorName',
        key: 'creatorName',
        ellipsis: {
          showTitle: false,
        },
      },
      {
        title: '更新时间',
        dataIndex: '_updateTime',
        key: '_updateTime',
        width: 140,
        render: (time) => {
          return unifiedTime(time)
        }
      },
      {
        dataIndex: 'action',
        key: 'action',
        width: 60,
        render: (_, record) => {
          const showOperate = (record.creatorId == userId) || [1, 2].includes(roleDescription)
          return showOperate && <RenderOperate project={record} operate={operate} size={24} iconSize={14}/>
        }
      }
    ]
  }, [])

  const RenderList: JSX.Element = useComputed(() => {
    return (
      <div>
        <Table
          loading={ctx.projectList === null}
          columns={columns()}
          dataSource={ctx.projectList}
          size='small'
          pagination={false}
          locale={{
            emptyText: '暂无内容，请添加...'
          }}
        />
      </div>
    )
  })

  const moveModalCancel = useCallback(() => {
    setMoveApp(null)
  }, [])

  const modalOk = useCallback((values, app) => {
    return new Promise(async (resolve, reject) => {
      const { name } = values
      const item = ctx.path[ctx?.path?.length - 1]
      const isGroup = !!!item.extName && !!item.id
      const { extName, isSystem } = app
      const params: any = {
        extName,
        userId: appCtx.user.id
      }

      if (isGroup) {
        params.groupId = item.id
      } else {
        params.parentId = item.id
        params.groupId = item.groupId
      }
      
      // const check = await axios({
      //   method: 'get',
      //   url: getApiUrl('/paas/api/file/checkFileCanCreate'),
      //   params: {
      //     ...params,
      //     fileName: name
      //   }
      // })
      // 暂时放开同名文件检测
      const check = { data: { data: {next: true} } }

      if (check.data?.data?.next) {
        if (isSystem) {
          params.type = 'system'
        }
  
        axios({
          method: 'post',
          url: getApiUrl('/paas/api/file/rename'),
          data: {
            id: app.id,
            name,
            userId: appCtx.user.id
          }
        }).then(async ({data}) => {
          if (data.code === 1) {
            ctx.getAll(getUrlQuery())

            if (folderExtnames.includes(extName)) {
              await appCtx.refreshSidebar()
            }

            resolve('重命名成功！')
          } else {
            reject(`重命名错误：${data.message}`)
          }
        })
      } else {
        reject('相同路径下不允许有同名文件！')
      }
    })
  }, [])

  const copyModalOk = useCallback((values, app) => {
    return new Promise(async (resolve, reject) => {
      const { name } = values
      const { extName } = app
      
      axios({
        method: 'post',
        url: getApiUrl('/paas/api/file/copy'),
        data: {
          id: app.id,
          name,
          userId: appCtx.user.id
        }
      }).then(async ({data}) => {
        if (data.code === 1) {
          ctx.getAll(getUrlQuery())

          if (folderExtnames.includes(extName)) {
            await appCtx.refreshSidebar()
          }

          resolve('创建副本成功！')
        } else {
          reject(`创建副本失败：${data.message}`)
        }
      })
    })
  }, [])

  const modalCancel = useCallback(() => {
    setCreateApp(null)
  }, [])

  const RenderRenameFileModal = useMemo(() => {
    return (
      <RenameFileModal
        app={createApp}
        onOk={modalOk}
        onCancel={modalCancel}
      />
    )
  }, [createApp])

  const RenderCopyFileModal = useMemo(() => {
    return (
      <CopyFileModal
        app={copyApp}
        onOk={copyModalOk}
        onCancel={() => { setCopyApp(null) }}
      />
    )
  }, [copyApp])

  const RenderMoveFileModal = useMemo(() => {
    return (
      <MoveFileModal
        app={moveApp}
        onOk={moveModalOk}
        onCancel={moveModalCancel}
      />
    )
  }, [moveApp])

  return (
    <>
      {ctx.viewType === 'card' ? Render : RenderList}
      {RenderCopyFileModal}
      {RenderRenameFileModal}
      {RenderMoveFileModal}
    </>
  );
}

const folderExtNameMap = {
  'folder': true,
  'folder-module': true,
  'folder-project': true
}

function onDragStart (event, dom, item) {
  appCtx.setDragItem({item, dom})
}

function onDragOver (event, dom, item) {
  event.preventDefault()
  const { dragItem: {
    item: dragItem
  } } = appCtx
  if (dragItem.id !== item.id && folderExtNameMap[item.extName]) {
    event.dataTransfer.dropEffect = 'copy'
    const domStyle = dom.children[0].style
    domStyle.outline = '4px solid #fa6400'
  } else {
    event.dataTransfer.dropEffect = 'none'
  }
}

function onDragLeave (event, dom, item) {
  const { dragItem: {
    item: dragItem
  } } = appCtx
  if (dragItem.id !== item.id && folderExtNameMap[item.extName]) {
    const domStyle = dom.children[0].style
    domStyle.outline = 'none'
  }
}

function onDragEnd (event, dom, item) {
  appCtx.setDragItem(null)
}

function onDrop (event, dom, item, drag) {
  const { 
    item: dragItem,
    dom: dragDom
   } = appCtx.dragItem

  dragDom.style.opacity = 0.5
  dragDom.draggable = false

  const msgKey = `move-${new Date().getTime()}`

  message.loading({
    content: '移动中...',
    key: msgKey,
    duration: 0
  })

  const domStyle = dom.children[0].style
  domStyle.outline = 'none'

  drag(item, dragItem)
    .then((r) => {
      dragDom.style.display = 'none'
      message.destroy(msgKey)
      message.success(r)
    })
    .catch((e) => {
      message.destroy(msgKey)
      message.warn(e)
      dragDom.style.opacity = 1
      dragDom.draggable = true
    })
}

function DragFile ({item, drag, canDrag, children}) {
  const ref = useRef<HTMLDivElement>(null)

  // useUpdateEffect(() => {
  //   const { dragItem } = appCtx
  //   if (dragItem) {
  //     if (dragItem.item.id !== item.id) {
  //       const { extName } = item
  //       if (folderExtNameMap[extName]) {
  //         const domStyle = (ref.current.children[0] as HTMLDivElement).style
  //         domStyle.outline = '1px dashed #fa6400'
  //       }
  //     }
  //   } else {
  //     const { extName } = item
  //     if (folderExtNameMap[extName]) {
  //       const domStyle = (ref.current.children[0] as HTMLDivElement).style
  //       domStyle.outline = 'none'
  //     }
  //   }
  // }, [appCtx.dragItem])

  useLayoutEffect(() => {
    const { current } = ref
    if (canDrag) {
      current.draggable = canDrag
      current.addEventListener('dragstart', (event) => {
        onDragStart(event, current, item)
      })
      current.addEventListener('dragover', (event) => {
        onDragOver(event, current, item)
      })
      current.addEventListener('dragleave', (event) => {
        onDragLeave(event, current, item)
      })
      current.addEventListener('dragend', (event) => {
        onDragEnd(event, current, item)
      })
      current.addEventListener('drop', (event) => {
        onDrop(event, current, item, drag)
      })
    }
  }, [canDrag])

  return (
    <div ref={ref}>
      {children}
    </div>
  )
}

function RenderOperate({project, operate, size = 28, iconSize = 18, appMeta}) {
  const {extName} = project
  /** 非文件夹，可分享 */
  const isFolder = folderExtnames.includes(extName)
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
            operate('unTouristVisit', { project })
          } else {
            operate('touristVisit', { project })
          }
        }}>
          <UserOutlined width={16} height={16} />
          <div className={css.label}>{ touristVisit ? '取消游客可访问' : '游客访问'}</div>
        </div>
      )
    },
    {
      key: 'rename',
      label: (
        <div className={css.operateItem} onClick={() => operate('rename', {project})}>
          <EditOutlined width={16} height={16}/>
          <div className={css.label}>重命名</div>
        </div>
      )
    },
    {
      key: 'move',
      label: (
        <div className={css.operateItem} onClick={() => operate('move', {project})}>
          <SelectOutlined width={16} height={16}/>
          <div className={css.label}>移动到</div>
        </div>
      )
    },
   !isFolder ? {
      key: 'copy',
      label: (
        <div className={css.operateItem} onClick={() => operate('copy', {project})}>
          <CopyOutlined width={16} height={16}/>
          <div className={css.label}>创建副本</div>
        </div>
      )
    } : null,
    appMeta?.snapshot?.export ? {
      key: 'exportSnapshot',
      label: (
        <div className={css.operateItem} onClick={() => operate('exportSnapshot', {project, appMeta})}>
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
        <div className={css.operateItem} onClick={() => operate('delete', {project})}>
          <Trash width={16} height={16}/>
          <div className={css.label}>删除</div>
        </div>
      )
    }
  ].filter(item => item)

  return (
    <div className={css.btns} onClick={evt(() => {}).stop}>
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

function ClickableIconContainer({className = '', size = 28, children}) {
  return (
    <div className={`${css.clickableIconContainer} ${className}`} style={{width: size, height: size}}>
      {children}
    </div>
  )
}

function RenameFileModal({app, onOk, onCancel}) {
  const [context] = useState({
    submittable: true
  })
  const [form] = Form.useForm()
  const [btnLoading, setBtnLoading] = useState(false)
  const ref = useRef()

  const { run: ok } = useDebounceFn(() => {
    form.validateFields().then((values) => {
      setBtnLoading(true)
      onOk(values, app).then((msg) => {
        message.success(msg)
        cancel()
      }).catch((e) => {
        setBtnLoading(false)
        message.warn(e)
      })
    })
  }, {wait: 200});

  const cancel = useCallback(() => {
    onCancel()
    setBtnLoading(false)
    form.resetFields()
  }, [])

  useEffect(() => {
		if (app) {
			form.setFieldsValue({ name: app.name });
		}
    if (app && ref.current) {
      setTimeout(() => {
        (ref.current as any).focus()
      }, 100)
    }
  }, [app])

  return (
    <Modal
      open={!!app}
      title={'重命名'}
      okText={btnLoading ? '校验中...' : '确认'}
      cancelText={'取消'}
      centered={true}
      onOk={ok}
      onCancel={cancel}
      confirmLoading={btnLoading}
      bodyStyle={{
        minHeight: 104
      }}
    >
      <Form
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 21 }}
        form={form}
      >
        <Form.Item
          label='名称'
          name='name'
          rules={[{ required: true, message: '请输入新的名称', validator(rule, value) {
            return new Promise((resolve, reject) => {
              if (!value.trim()) {
                reject(rule.message)
              } else [
                resolve(true)
              ]
            })
          }}]}
        >
          <Input
            onCompositionStart={() => {
              context.submittable = false
            }}
            onCompositionEnd={() => {
              context.submittable = true
            }}
            ref={ref}
            placeholder='请输入新的名称'
            autoFocus
            onPressEnter={() => context.submittable && ok()}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function CopyFileModal({app, onOk, onCancel}) {
  const [context] = useState({
    submittable: true
  })
  const [form] = Form.useForm()
  const [btnLoading, setBtnLoading] = useState(false)
  const ref = useRef()

  const { run: ok } = useDebounceFn(() => {
    form.validateFields().then((values) => {
      setBtnLoading(true)
      onOk(values, app).then((msg) => {
        message.success(msg)
        cancel()
      }).catch((e) => {
        setBtnLoading(false)
        message.warn(e)
      })
    })
  }, {wait: 200});

  const cancel = useCallback(() => {
    onCancel()
    setBtnLoading(false)
    form.resetFields()
  }, [])

  useEffect(() => {
		if (app) {
			form.setFieldsValue({ name: app.name });
		}
    if (app && ref.current) {
      setTimeout(() => {
        (ref.current as any).focus()
      }, 100)
    }
  }, [app])

  return (
    <Modal
      open={!!app}
      title={'创建副本'}
      okText={btnLoading ? '校验中...' : '确认'}
      cancelText={'取消'}
      centered={true}
      onOk={ok}
      onCancel={cancel}
      confirmLoading={btnLoading}
      bodyStyle={{
        minHeight: 104
      }}
    >
      <Form
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 21 }}
        form={form}
      >
        <Form.Item
          label='名称'
          name='name'
          rules={[{ required: true, message: '请输入新的名称', validator(rule, value) {
            return new Promise((resolve, reject) => {
              if (!value.trim()) {
                reject(rule.message)
              } else [
                resolve(true)
              ]
            })
          }}]}
        >
          <Input
            onCompositionStart={() => {
              context.submittable = false
            }}
            onCompositionEnd={() => {
              context.submittable = true
            }}
            ref={ref}
            placeholder='请输入新的名称'
            autoFocus
            onPressEnter={() => context.submittable && ok()}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

class Ctx2 {
  open: boolean
  active: any
  dataSource: any[]
  loading: boolean
}

function MoveFileModal({app, onOk, onCancel}) {
  // const appCtx = observe(AppCtx, {from: 'parents'})
  const ctx = useObservable(Ctx2, next => {
    next({
      open: false,
      active: null,
      dataSource: [],
      loading: false
    })
  })
  const [btnLoading, setBtnLoading] = useState(false)
  const ok = useCallback(() => {
    if (!ctx.active) {
      message.info('请选择需要移动到的协作组或文件夹')
    } else {
      setBtnLoading(true)
      onOk(ctx.active, app).then((msg) => {
        message.success(msg)
        cancel()
      }).catch((e) => {
        setBtnLoading(false)
        message.warn(e)
      })
    }
  }, [app])

  const cancel = useCallback(() => {
    onCancel()
    setBtnLoading(false)
    ctx.open = false
    ctx.active = null
    ctx.dataSource = []
    ctx.loading = false
  }, [])

  useEffect(() => {
    const open = !!app
    ctx.open = open
    if (open) {
      ctx.loading = true
      axios({
        method: 'get',
        url: getApiUrl('/paas/api/userGroup/getVisibleGroups'),
        params: {
          userId: appCtx.user.id
        }
      }).then(({ data: { data } }) => {
        ctx.dataSource = data.filter((item) => item.roleDescription && item.roleDescription < 3)
        ctx.loading = false
      })
    }
  }, [app])

  return (
    <Modal
      open={!!app}
      title={`将“${app?.name}”移动到`}
      okText={btnLoading ? '校验中...' : '确认'}
      cancelText={'取消'}
      centered={true}
      onOk={ok}
      onCancel={cancel}
      confirmLoading={btnLoading}
      className={css.modalBody}
      bodyStyle={{height: 500}}
    >
      <Spin spinning={ctx.loading}>
        <FolderList
          active={ctx.active}
          bodyStyle={{marginLeft: 0}}
          dataSource={ctx.dataSource}
          clickWrapper={async (item) => {
            ctx.active = item

            if (!item.open) {
              item.loading = true

              const params: any = {
                userId: appCtx.user.id,
                extNames: 'folder,folder-project,folder-module',
              }

              if (!item.groupId) {
                // 协作组
                params.groupId = item.id
              } else {
                params.groupId = item.groupId
                params.parentId = item.id
              }

              axios({
                method: 'get',
                url: getApiUrl('/paas/api/file/getGroupFiles'),
                params
              }).then(({ data }) => {
                if(data.code === 1) {
                  item.dataSource = fileSort(data.data.filter((item) => item.id !== app.id))
                  item.open = true
                }
                item.loading = false
              })
            }
          }}
          clickSwitcher={async (item) => {
            if (item.open) {
              item.open = false
            } else {
              item.loading = true

              const params: any = {
                userId: appCtx.user.id,
                extNames: 'folder,folder-project,folder-module',
              }

              if (!item.groupId) {
                // 协作组
                params.groupId = item.id
              } else {
                params.groupId = item.groupId
                params.parentId = item.id
              }

              axios({
                method: 'get',
                url: getApiUrl('/paas/api/file/getGroupFiles'),
                params
              }).then(({ data }) => {
                if(data.code === 1) {
                  item.dataSource = fileSort(data.data.filter((item) => item.id !== app.id))
                  item.open = true
                }
                item.loading = false
              })
            }
          }}
        />
      </Spin>
    </Modal>
  )
}
