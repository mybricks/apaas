import React, { useMemo } from 'react'

// @ts-ignore
import { evt, observe } from '@mybricks/rxui'
// import { getIconInfo } from '../../components/Icon'

import {Icon, Trash, More, SharerdIcon, UserGroup} from '@/components'

import { LoadingOutlined, CaretRightOutlined } from '@ant-design/icons'
// @ts-ignore
import css from './index.less'

import AppCtx from '../../../../AppCtx'

interface Props {
  active: any
  dataSource: Array<any>
  clickWrapper
  clickSwitcher?
  bodyStyle?
}

let appCtx;

export default function (props: Props) {

  appCtx = observe(AppCtx, {from: 'parents'})

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

  if (hidden) return

  const isActive = active?.id === id || itemActive

  const RenderWrapper = useMemo(() => {
    return (
      <div className={`${css.tree} ${isActive ? css.active : ''}`} style={{padding: `0 0 0 ${25 * count}px`}}>
        <li onClick={evt(() => clickWrapper(item)).stop}>
          {clickSwitcher && <span className={css.switcher}>
            {loading ? 
              <LoadingOutlined /> : 
              <CaretRightOutlined
                className={`${open ? css.open : ''}`}
                onClick={evt(() => clickSwitcher(item)).stop}
              />}
          </span>}
          <span className={css.wrapper}>
            <span className={css.title}>
              <i className={`${css.anticon}`}>
                {/* {getIconInfo({key: iconKey, width: '16px'}).icon} */}
                <Icon icon={(extName && appCtx.APPSMap[extName]?.icon) || (icon || UserGroup)} width={20} height={20}/>
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
  }, [loading, open, isActive, icon])

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
  }, [open, dataSource, active])

  return (
    <div>
      {RenderWrapper}
      {RenderTree}
    </div>
  )
}