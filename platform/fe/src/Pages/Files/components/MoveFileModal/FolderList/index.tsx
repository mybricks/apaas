import React, { useMemo, useState, useEffect } from 'react'
import axios from "axios";

import { LoadingPlaceholder } from "@/components"
import {Icon, UserGroup, Folder } from '@/components/icon'

import { LoadingOutlined, CaretRightOutlined } from '@ant-design/icons'
// @ts-ignore
import css from './index.less'

interface Props {
  active: any
  dataSource: Array<any>
  clickWrapper
  clickSwitcher?
  bodyStyle?
}

function FolderList (props: Props) {
  const Render: JSX.Element = useMemo(() => {
    return (
      <div className={css.container}>
        <div className={css.content} style={props.bodyStyle}>
          <Tree
            count={0}
            {...props}
          />
        </div>
      </div>
    )
  }, [props.active, props.dataSource])

  return Render
}

function Tree({dataSource, active, clickWrapper, clickSwitcher, count}: any): JSX.Element {
  if (!Array.isArray(dataSource)) return

  return (
    <>
      {dataSource.map(item => {
        const { id } = item

        return <Leaf
          key={id}
          active={active}
          item={item}
          clickWrapper={clickWrapper}
          clickSwitcher={clickSwitcher}
          count={count}
        />
      })}
    </>
  )
}

function Leaf({item, clickWrapper, clickSwitcher, count, active}) {
  const { id, hidden, loading, open, name, extName, active: itemActive, dataSource, icon } = item

  const [ctx, setCtx] = useState({
    open: false,
    dataSource: [],
    loading: false
  })

  if (hidden) return

  const isActive = active?.id === id || itemActive

  const RenderWrapper = useMemo(() => {
    return (
      <div className={`${css.tree} ${isActive ? css.active : ''}`} style={{padding: `0 0 0 ${25 * count}px`}}>
        {/* <li onClick={evt(() => clickWrapper(item)).stop}> */}
        <li onClick={(e) => {
          e.stopPropagation()
          clickWrapper(item, (res) => {
            setCtx((ctx) => {
              return {
                ...ctx,
                ...res,
              }
            })
          })
        }}>
          {clickSwitcher && <span className={css.switcher}>
            {loading ? 
              // @ts-ignore
              <LoadingOutlined /> : 
              // @ts-ignore
              <CaretRightOutlined
                className={`${open ? css.open : ''}`}
                // onClick={evt(() => clickSwitcher(item)).stop}
                onClick={(e) => {
                  e.stopPropagation()
                  clickSwitcher(item, (res) => {
                    setCtx((ctx) => {
                      return {
                        ...ctx,
                        ...res,
                      }
                    })
                  })
                }}
              />}
          </span>}
          <span className={css.wrapper}>
            <span className={css.title}>
              <i className={`${css.anticon}`}>
                <Icon icon={extName ? <Folder /> : UserGroup}/>
                {/* {getIconInfo({key: iconKey, width: '16px'}).icon} */}
                {/* <Icon icon={(extName && appCtx.APPSMap[extName]?.icon) || (icon || UserGroup)} width={20} height={20}/> */}
              </i>
              <div className={css.unselect}>
                <span className={css.name}>
                  <span>{name}</span>
                </span>
              </div>
            </span>
          </span>
        </li>
      </div>
    )
  }, [ctx, isActive, icon])

  const RenderTree = useMemo(() => {
    return (
      <div style={{display: open ? 'block' : 'none'}}>
        <Tree
          count={count + 1}
          dataSource={dataSource}
          active={active}
          clickWrapper={clickWrapper}
          clickSwitcher={clickSwitcher}
        />
      </div>
    )
  }, [ctx, active])

  return (
    <div>
      {RenderWrapper}
      {RenderTree}
    </div>
  )
}


const List = ({
  user,
  file: app,
  setTargetFile,
}) => {

  // const [ctx, setCtx] = useState({
  //   open: false,
  //   active: null,
  //   dataSource: [],
  //   loading: false
  // })

  // const [open, setOpen] = useState(false)
  const [active, setActive] = useState(null)
  const [dataSource, setDataSource] = useState([])
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ctx.open = open
    if (open) {
      // ctx.loading = true
      axios({
        method: 'get',
        url: '/paas/api/userGroup/getVisibleGroups',
        params: {
          userId: user.id
        }
      }).then(({ data: { data } }) => {
        // ctx.dataSource = data.filter((item) => item.roleDescription && item.roleDescription < 3)
        // ctx.loading = false
        setDataSource(data.filter((item) => item.roleDescription && item.roleDescription < 3))
        setLoading(false)
      })
    }
  }, [])

  return (
    <div style={{ height: '70vh'}}>
      {loading && <LoadingPlaceholder />}
      <FolderList
        active={active}
        bodyStyle={{marginLeft: 0}}
        dataSource={dataSource}
        clickWrapper={async (item, next) => {
          setActive(item)
          setTargetFile(item)

          if (!item.open) {
            item.loading = true
            next({loading: true})

            const params: any = {
              userId: user.id,
              extNames: 'folder',
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
              url: "/paas/api/file/getGroupFiles",
              params
            }).then(({ data }) => {
              if(data.code === 1) {
                item.dataSource = filesSort(data.data.filter((item) => item.id !== app.id))
                item.open = true
              }
              item.loading = false

              next({
                dataSource: filesSort(data.data.filter((item) => item.id !== app.id)),
                open: true,
                loading: false
              })
            })
          }
        }}
        clickSwitcher={async (item, next) => {
          if (item.open) {
            item.open = false
            next({ open: false })
          } else {
            item.loading = true
            next({ loading: true })

            const params: any = {
              userId: user.id,
              extNames: 'folder',
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
              url: '/paas/api/file/getGroupFiles',
              params
            }).then(({ data }) => {
              if(data.code === 1) {
                item.dataSource = filesSort(data.data.filter((item) => item.id !== app.id))
                item.open = true
              }
              item.loading = false
              next({
                dataSource: filesSort(data.data.filter((item) => item.id !== app.id)),
                open: true,
                loading: false
              })
            })
          }
        }}
      />
    </div>
  )
}

export default List;

/** 文件列表排序，将文件夹排在前面 */
const filesSort = (files) => {
  // 参与排序替换位置，数字越大越靠前
  const orderMap = {
    'folder': 1
  }
  return files.sort((c, s) => {
    const cNum = orderMap[c.extName] || -1
    const sNum = orderMap[s.extName] || -1

    return sNum - cNum
  })
}
