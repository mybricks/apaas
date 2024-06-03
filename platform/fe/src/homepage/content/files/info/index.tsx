import React from 'react'

import Group from './group'
import {Block} from '../../'

import css from './index.less'

export default function Info({path}) {
  const {id, extName} = path

  let JSX = null

  switch (true) {
    case !!!extName && !!id:
      JSX = Group
      break
    default:
      break
  }

  return JSX && (
    <Block
      style={{
        minWidth: 280,
        maxWidth: 280,
        marginBottom: 0,
        overflow: 'scroll'
      }}
      className={css.InfoContainer}
    >
      <JSX key={id} {...path}/>
    </Block>
  )
}

export function Title({content, suffix = <></>}) {
  return (
    <div className={css.title}>
      <div className={css.content}>
        <span>{content || '加载中...'}</span>
        {suffix}
      </div>
    </div>
  )
}

export function Card({children}) {
  return (
    <div className={css.card}>{children}</div>
  )
}

export function ClickableIcon({children, ...other}) {
  return (
    <div className={css.iconContainer} {...other}>{children}</div>
  )
}