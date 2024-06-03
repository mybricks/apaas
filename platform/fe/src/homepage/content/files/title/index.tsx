import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback
} from 'react'

import {
  List,
  Input,
  Modal,
  Tooltip,
  Divider,
  Upload,
  Button,
  message,
  Breadcrumb
} from 'antd'
import {
  evt,
  observe,
  useComputed,
  useObservable
} from '@mybricks/rxui'
import axios from 'axios'
import {SearchOutlined, DownloadOutlined} from '@ant-design/icons'

import {Create} from './Create'
import AppCtx from '../../../AppCtx'
import Ctx, {folderExtnames} from '../Ctx'
import {getApiUrl, getUrlQuery} from '../../../../utils'
import {useDebounceFn} from '@/hooks'
import {Icon, UserGroup, FolderModule, FolderProject } from '@/components'

import css from './index.less'

let ctx
let appCtx

export default function TitleBar(): JSX.Element {
  ctx = observe(Ctx, {from: "parents"})
  appCtx = observe(AppCtx, {from: "parents"})
  const [open, setOpen] = useState<number | boolean>(0)

  useEffect(() => {
    function click() {
      ctx.hideCreatePanel()
    }

    document.addEventListener('click', click)
    return () => {
      document.removeEventListener('click', click)
    }
  }, [])

  const searchInputClick = useCallback(() => {
    setOpen(true)
  }, [])

  const modalCancel = useCallback(() => {
    setOpen(false)
  }, [])

  const titleClick = useCallback((item) => {
    const {groupId, id, extName} = item
    const isGroup = !!!extName && !!id

    let url = '?appId=files'

    if (isGroup) {
      url = url + `&groupId=${id}`
    } else {
      url = url + `${groupId ? `&groupId=${groupId}` : ''}${id ? `&parentId=${id}` : ''}`
    }

    history.pushState(null, '', url)
  }, [])

  const path = useComputed(() => {
    const pathLastIndex = ctx.path.length - 1
    return (
      <Breadcrumb separator='>' className={css.breadcrumb}>
        {ctx.path.map((item, idx) => {
          const {id, name} = item;
          let icon = null;
          if (item.extName === 'folder-project') {
            icon = <FolderProject width={20} height={20} />;
          } else if (item.extName === 'folder-module') {
            icon = <FolderModule width={20} height={20} />;
          }
          return (
            <Breadcrumb.Item
              key={id}
              // @ts-ignore
              style={{cursor: pathLastIndex !== idx ? 'pointer' : 'default'}}
              onClick={() => {
                if (pathLastIndex !== idx) {
                  titleClick(item);
                }
              }}
            >
              <div className={css.breadcrumbContent}>
                {icon}
                <span>{name}</span>
              </div>
            </Breadcrumb.Item>
          );
        })}
      </Breadcrumb>
    )
  })

  const searchButton = useMemo(() => {
    return (
      <div
        className={css.search}
        onClick={searchInputClick}
      >
        <div className={css.searchInput}>
          <SearchOutlined className={css.icon}/>
          <div className={css.placeholder}>搜索</div>
        </div>
      </div>
    )
  }, [])

  const viewToggleButton = useComputed(() => {
    const isCardView = ctx.viewType === 'card'

    return (
      <Tooltip placement='bottom' title={`切换为${isCardView ? '列表' : '卡片'}视图`}>
        <div style={{display: 'flex', alignItems: 'center', marginRight: 8}} onClick={ctx.setViewType}>
          {isCardView ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" width="24" height="24" className={css.toggleIcon}><rect x="5" y="5" width="6.116" height="6.116" rx="1" fill="currentColor"></rect><rect x="12.668" y="5" width="6.116" height="6.116" rx="1" fill="currentColor"></rect><rect x="5" y="12.639" width="6.116" height="6.116" rx="1" fill="currentColor"></rect><rect x="12.668" y="12.639" width="6.116" height="6.116" rx="1" fill="currentColor"></rect></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" width="24" height="24" className={css.toggleIcon}><path d="M8 7a1 1 0 0 0-1-1H6a1 1 0 0 0 0 2h1a1 1 0 0 0 1-1ZM18 7a1 1 0 0 0-1-1h-6a1 1 0 1 0 0 2h6a1 1 0 0 0 1-1ZM10 12a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2h-6a1 1 0 0 1-1-1ZM8 12a1 1 0 0 0-1-1H6a1 1 0 1 0 0 2h1a1 1 0 0 0 1-1ZM10 17a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2h-6a1 1 0 0 1-1-1ZM8 17a1 1 0 0 0-1-1H6a1 1 0 1 0 0 2h1a1 1 0 0 0 1-1Z" fill="currentColor"></path></svg>
          )}
        </div>  
      </Tooltip>
    )
  })

  const createButton = useComputed(() => {
    return ctx.roleDescription && ctx.roleDescription < 3 && (
      <div>
        <button onClick={evt(ctx.showCreatePanel).stop}><span>+</span>新建</button>
        <Create/>
      </div>
    )
  })
  
  const importButton = useComputed(() => {
    const handleUpload = (file) => {
      let extName = file?.name?.split('.')?.[1]?.split('@')?.[0]
      // console.log(1111111111, file, extName)
      if(extName && appCtx.APPSMap?.[extName]?.snapshot?.import) {
        const importApi = appCtx.APPSMap?.[extName]?.snapshot?.import
        const formData = new FormData();
        formData.append('files[]', file);
        formData.append('userId', ctx.user.id);
        const currentPath = ctx.path?.[ctx.path.length - 1];
        // console.log('currentPath', currentPath)
        const { groupId, parentId } = getUrlQuery();
        console.log(groupId, parentId)
        parentId && formData.append('parentId', parentId);
        groupId && formData.append('groupId', groupId);

        // // setUploading(true);
        fetch(`${getApiUrl(importApi)}`, {
          method: 'POST',
          body: formData,
        })
          .then((res) => res.json())
          .then((res) => {
            if(res.code === 1) {
              message.success('导入成功');
              location.reload();
            } else {
              message.warn(res.msg);
            }
            console.log('响应是', res)
          })
          .catch(() => {
            message.error('upload failed.');
          })
          .finally(() => {
            // setUploading(false);
          });
      } else {
        message.warn('不支持的文件类型');
      }
    };
    const props = {
      maxCount: 1,
      // accept: '.mybricks',
      showUploadList: false,
      beforeUpload(file) {
        console.log(222, file)
        handleUpload(file)
        return false;
      },
    };
    // 1 可管理 2 可编辑 3 可查看
    return ctx.roleDescription && ctx.roleDescription < 3 && appCtx.hasImportAbility && (
      <div>
        <Upload {...props}>
          <button style={{ height: 28 }}> <DownloadOutlined /> 导入</button>
        </Upload>
      </div>
    )
  })

  const RenderSearchModal = useMemo(() => {
    if (typeof open === 'number') {
      return null
    }
    return (
      <SearchModal
        open={open}
        onCancel={modalCancel}
      />
    )
  }, [open])

  return (
    <div className={css.title}>
      <div className={css.titleMiddle}>
        {path}
        <div className={css.btns}>
          {viewToggleButton}
          {searchButton}
          {createButton}
          {importButton}
        </div>
      </div>
      {RenderSearchModal}
    </div>
  )
}

function SearchModal({open, onCancel}) {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const {APPSMap} = appCtx
  const ctx = useObservable({
    inputValue: false,
    loading: false,
    dataSource: []
  })

  const inputRef = useRef(null);

  useEffect(() => {
    if (open && typeof ctx.inputValue === 'boolean') {
      ctx.loading = true
      setTimeout(() => {
        getList('')
      }, 500)
    }
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus()
      }, 100)
    }
  }, [open])

  const getList = useCallback(async (value) => {
    ctx.loading = true
    ctx.inputValue = value

    await axios({
      method: 'get',
      url: getApiUrl(`/paas/api/workspace/globalSearch`),
      params: {
        userId: appCtx.user.id,
        name: value,
        limit: 10,
        offset: 0
      }
    }).then(({data: {data}}) => {
      const { list, path } = data
      list.forEach((item, idx) => {
        item.path = path[idx]
      })
      ctx.dataSource = list
      ctx.loading = false
    })
  }, [])

  const { run } = useDebounceFn((e) => {
    const value = e?.target?.value
    if (!value) return
    getList(value)
  }, {wait: 500});

  const ModalTitle: JSX.Element = useMemo(() => {
    return (
      <div className={css.modalTitle}>
        <div className={css.modalTitleLeft}>
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="12684" width="16px" height="16px"><path d="M862.4 940.6H160.2c-13.2 0-24-10.8-24-24V100.1c0-13.2 10.8-24 24-24h702.2c13.2 0 24 10.8 24 24v816.5c0 13.2-10.8 24-24 24z" fill="#999999" p-id="12685"></path><path d="M846.4 941.7H176.2c-22 0-40-18-40-40V117.2c0-22 18-40 40-40h670.2c22 0 40 18 40 40v784.5c0 22-18 40-40 40z" fill="#4692f3" p-id="12686"></path><path d="M291.2 291.5m-34.5 0a34.5 34.5 0 1 0 69 0 34.5 34.5 0 1 0-69 0Z" fill="#FCFCFC" p-id="12687"></path><path d="M755.1 326H398c-6.6 0-12-5.4-12-12v-44.9c0-6.6 5.4-12 12-12h357.2c6.6 0 12 5.4 12 12V314c-0.1 6.6-5.5 12-12.1 12z" fill="#FCFCFC" p-id="12688"></path><path d="M291.2 511.5m-34.5 0a34.5 34.5 0 1 0 69 0 34.5 34.5 0 1 0-69 0Z" fill="#FCFCFC" p-id="12689"></path><path d="M755.1 546H398c-6.6 0-12-5.4-12-12v-44.9c0-6.6 5.4-12 12-12h357.2c6.6 0 12 5.4 12 12V534c-0.1 6.6-5.5 12-12.1 12z" fill="#FCFCFC" p-id="12690"></path><path d="M291.2 731.5m-34.5 0a34.5 34.5 0 1 0 69 0 34.5 34.5 0 1 0-69 0Z" fill="#FCFCFC" p-id="12691"></path><path d="M755.1 766H398c-6.6 0-12-5.4-12-12v-44.9c0-6.6 5.4-12 12-12h357.2c6.6 0 12 5.4 12 12V754c-0.1 6.6-5.5 12-12.1 12z" fill="#FCFCFC" p-id="12692"></path></svg>
          <div className={css.modalTitleContent}>搜索文件/协作组</div>
        </div>
        <Divider type='vertical'/>
        <Input
          ref={inputRef}
          className={css.modalTitleInput}
          placeholder='请输入关键词'
          prefix={<SearchOutlined />}
          onChange={run}
        />
      </div>
    )
  }, [])

  const itemClick = useCallback((item) => {
    const { id, groupId, extName } = item
    let url = '?appId=files'
    switch (true) {
      case extName === 'my':
        history.pushState(null, '', url)
        onCancel()
        break
      case extName === 'group':
        history.pushState(null, '', url + `&groupId=${item.id}`)
        onCancel()
        break
      case extName === 'share':
        /** TODO: 这块应该是有侧边栏APP的map数据 */
        history.pushState(null, '', '?appId=share')
        onCancel()
        break
      case folderExtnames.includes(extName):
        history.pushState(null, '', url + `${groupId ? `&groupId=${groupId}` : ''}${id ? `&parentId=${id}` : ''}`)
        onCancel()
        break
      default:
        const appReg = APPSMap[extName]
        const {homepage} = appReg
        window.open(`${homepage}?id=${id}`)
        break
    }
  }, [])
  
  return (
    <Modal
      title={ModalTitle}
      open={open}
      width='80%'
      footer={null}
      wrapClassName={css.title}
      onCancel={onCancel}
      transitionName=""
      maskTransitionName=""
      style={{
        top: 80,
        bottom: 80,
        width: 1100,
        minWidth: 764,
        maxWidth: 1100
      }}
      bodyStyle={{
        height: '80vh',
        minHeight: 400
      }}
    >
      <List
        loading={ctx.loading}
        dataSource={ctx.dataSource}
        className={css.modalList}
        itemLayout='horizontal'
        locale={{
          emptyText: '暂无数据，请编辑查询的关键词'
        }}
        renderItem={(item) => {
          const {
            icon,
            name,
            path,
            extName,
            creatorName,
            updateTime
          } = item
          const appReg = APPSMap[extName]
          const isGroup = extName === 'group'

          if (!appReg && !isGroup) {
            return <></>
          }

          return (
            <List.Item
              className={css.modalListItem}
              onClick={() => itemClick(item)}
            >
              <List.Item.Meta
                title={<div>{name}</div>}
                description={(
                  <>
                    <div className={css.descText}>所有者：{creatorName}</div>
                    <div className={css.descText}>更新时间：{updateTime}</div>
                    <div className={css.descText}>路径：<Path path={path} APPSMap={APPSMap} onClick={itemClick}/></div>
                  </>
                )}
                avatar={<Icon icon={isGroup ? (icon || UserGroup) : appReg.icon} width={32} height={32}/>}
              />
            </List.Item>
          )
        }}
      />
    </Modal>
  )
}

function Path({path, onClick, APPSMap}) {
  const length = path.length - 1

  return path.map((item, idx) => {
    const { name, extName, icon: itemIcon } = item || {}
    const isMy = !item
    const appReg = APPSMap[extName]
    const isGroup = !extName || extName === 'group'

    if (!appReg && !isGroup) {
      return <></>
    }

    const icon = <Icon icon={isMy ? './image/icon_myproject.png' : (isGroup ? (itemIcon || UserGroup) : appReg.icon)} width={16} height={16}/>

    return (
      <div className={css.path}>
        {<span className={css.pathicon}>{icon}</span>}
        <span className={css.pathname} onClick={(e) => {
          e.stopPropagation()
          onClick({...item, extName: isMy ? 'my' : extName || 'group'})
        }}>{name || '我的'}</span>
        <span className={css.delimiter}>{idx !== length ? '>' : ''}</span>
      </div>
    )
  })
}
