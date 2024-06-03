import React from 'react'

import {observe} from '@mybricks/rxui'

import Files from './files'
import Trash from './trash'
import Share from './share'
import Asset from './asset';
import AppCtx from '../AppCtx'
import InlineApp from './inlineApp'

import css from './index.less'

export default function ContentContainer() {
  return (
    <div className={css.content}>
      <Render />
    </div>
  )
}

/** 渲染项目内容 */
function Render(): JSX.Element {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const {urlQuery, APPSMap} = appCtx
  const {appId} = urlQuery
  const app = appId && APPSMap[appId]

  let JSX: JSX.Element | null = null

  if (app?.homepage || app?.Element) {
    /** 安装的应用 */
    JSX = (
      <InlineApp app={app}/>
    )
  } else {
    /** 平台默认的应用 */
    switch (appId) {
      case 'share':
        JSX = (
          <Share />
        )
        break
      case 'trash':
        JSX = (
          <Trash />
        )
        break
      case 'files':
        JSX = (
          <Files />
        )
        break
      case 'asset':
        JSX = <Asset />;
        break
      default:
        break
    }
  }

  if (!JSX) {
    history.pushState(null, "", `?appId=files`)
  }

  return JSX || <div>当前页面不存在，跳转回“我的”</div>
}

/** 内容区 */
export function Content({title, children}) {
  return (
    <>
      <Block>
        <div className={css.title}>{title}</div>
      </Block>
      {children}
    </>
  )
}

/** 块 */
export function Block({style = {}, className = '', children}): JSX.Element {
  return (
    <div style={{marginBottom: 11, ...style}} className={className}>
      {children}
    </div>
  )
}
