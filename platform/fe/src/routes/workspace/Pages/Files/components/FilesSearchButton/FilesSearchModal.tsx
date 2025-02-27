import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
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
import {SearchOutlined, DownloadOutlined} from '@ant-design/icons'
import { useNavigate } from "react-router-dom";

import { useDebounceFn } from "@workspace/hooks"
import { useUserContext, useWorkspaceConetxt } from "@workspace/context";
import { Icon, UserGroup, Account } from "@workspace/components/icon"

import css from "./FilesSearchModal.less";

const folderExtnames = ['folder', 'folder-project', 'folder-module']

function SearchModal({open, onCancel}) {
  const navigate = useNavigate();
  const { user } = useUserContext()
  const { apps: { getApp } } = useWorkspaceConetxt()
  // const appCtx = observe(AppCtx, {from: 'parents'})
  // const {APPSMap} = appCtx
  // const ctx = useObservable({
  //   inputValue: false,
  //   loading: false,
  //   dataSource: []
  // })

  const [ctx, setCtx] = useState({
    inputValue: false,
    loading: false,
    dataSource: []
  })

  const inputRef = useRef(null);

  useEffect(() => {
    if (open && typeof ctx.inputValue === 'boolean') {
      setCtx(ctx => {
        return {
          ...ctx,
          loading: true
        }
      })
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
    setCtx((ctx) => {
      return {
        ...ctx,
        loading: true,
        inputValue: value
      }
    })

    await axios({
      method: 'get',
      url: `/paas/api/workspace/globalSearch`,
      params: {
        userId: user.id,
        name: value,
        limit: 10,
        offset: 0
      }
    }).then(({data: {data}}) => {
      const { list, path } = data
      list.forEach((item, idx) => {
        item.path = path[idx]
      })

      setCtx((ctx) => {
        return {
          ...ctx,
          loading: false,
          dataSource: list
        }
      })
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
          // @ts-ignore
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
        // history.pushState(null, '', url)
        navigate(url)
        onCancel()
        break
      case extName === 'group':
        // history.pushState(null, '', url + `&groupId=${item.id}`)
        navigate(url + `&groupId=${item.id}`)
        onCancel()
        break
      case extName === 'share':
        /** TODO: 这块应该是有侧边栏APP的map数据 */
        // history.pushState(null, '', '?appId=share')
        navigate('?appId=share')
        onCancel()
        break
      case folderExtnames.includes(extName):
        // history.pushState(null, '', url + `${groupId ? `&groupId=${groupId}` : ''}${id ? `&parentId=${id}` : ''}`)
        navigate(url + `${groupId ? `&groupId=${groupId}` : ''}${id ? `&parentId=${id}` : ''}`)
        onCancel()
        break
      default:
        const appReg = getApp(extName)
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
      centered
      style={{
        // top: 80,
        // bottom: 80,
        width: 1100,
        minWidth: 764,
        maxWidth: 1100
      }}
      styles={{
        body: {
          height: '80vh'
        }
      }}
      // bodyStyle={{
      //   height: '80vh',
      //   minHeight: 400
      // }}
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
          const appReg = getApp(extName)
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
                    <div className={css.descText}>路径：<Path path={path} getApp={getApp} onClick={itemClick}/></div>
                  </>
                )}
                avatar={(
                  <div className={css.avatar}>
                    <Icon icon={isGroup ? (icon || UserGroup) : appReg.icon} />
                  </div>
                )}
              />
            </List.Item>
          )
        }}
      />
    </Modal>
  )
}

export default SearchModal;

function Path({path, onClick, getApp}) {
  const length = path.length - 1

  return path.map((item, idx) => {
    const { name, extName, icon: itemIcon } = item || {}
    const isMy = !item
    const appReg = getApp(extName)
    const isGroup = !extName || extName === 'group'

    if (!appReg && !isGroup) {
      return <></>
    }

    const icon = <Icon icon={isMy ? "./image/icon_myproject.png" : (isGroup ? UserGroup : appReg.icon)}/>

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