import React from 'react'

import Logo from './Logo'
import BannerPng from './mybricks.png'
import { Github, VScode } from './Icons'

import css from './index.less'

export default function Noaccess() {
  return (
    <div className={css.page}>
      <div className={css.head}>
        <Logo />
      </div>
      <div className={css.body}>
        <div className={css.entry}>
          <div className={css.aside}>
            <img className={css.banner} src={BannerPng} />
          </div>
          <div className={css.content}>
            <div className={css.form}>
              <div className={css.title}>
                抱歉，暂无权限访问，请联系官方团队
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={css.foot}>
        <div className={css.links}>
          <a className={css.github} href="https://github.com/mybricks/designer-spa-demo" target="_blank">{Github}Demo源码</a>
          <a className={css.vscode} href="https://marketplace.visualstudio.com/items?itemName=Mybricks.Mybricks&ssr=false#overview" target="_blank">{VScode}组件开发</a>
          <a className={css.docs} href="https://mp.weixin.qq.com/mp/appmsgalbum?__biz=Mzg5OTg1OTYwOA==&action=getalbum&album_id=2664963833182224385" target="_blank">文档教程</a>
          <a className={css.docs} href="https://mp.weixin.qq.com/mp/appmsgalbum?__biz=Mzg5OTg1OTYwOA==&action=getalbum&album_id=2591211948751650816" target="_blank">《企业级低代码》</a>
          <a className={css.copyright} href="https://github.com/mybricks" target="_blank">@2020 板砖团队</a>
        </div>
      </div>
    </div>
  )
}
