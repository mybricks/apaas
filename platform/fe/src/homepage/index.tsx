import React, {useMemo, useState} from 'react'

import axios from 'axios'
import {ConfigProvider, message} from 'antd'
import zhCN from 'antd/es/locale/zh_CN';
import {useObservable} from '@mybricks/rxui'

import AppCtx from './AppCtx'
import Sideber from './sidebar'
import Content from './content'

import { NoAccess } from './../components'

import {
  storage,
  getApiUrl,
  getUrlQuery,
  removeCookie
} from '../utils'

import { MYBRICKS_WORKSPACE_DEFAULT_PATH } from '../const'

import css from './index.less'

export default function App() {

  const appCtx = useObservable(AppCtx, {to: 'children'})

    /** 获取应用loading状态 */
    const [loading, setLoading] = useState(true)
    const [logo, setLogo] = useState('')
    const [access, setAccess] = useState(false)
  
    useMemo(() => {
      /** 初始化(获取应用、配置和角色) */
      (async () => {
        const userRes = (await axios({
          method: "post",
          url: '/paas/api/user/signed',
          data: {}
        }))?.data
        const user = userRes?.data
        if (userRes.code !== 1) {
          message.warn( userRes.msg || '登录信息已过期，请重新登录', 2)
          setTimeout(() => {
            if(location.href.indexOf('jumped') === -1) {
              removeCookie('mybricks-login-user')
              location.href = `/?jumped=true&redirectUrl=${encodeURIComponent(location.href)}`
            }
          }, 2000)
          return
        }
        if(user?.isAdmin) {
          // 管理员打开才上报平台数据
          (await axios({
            method: "post",
            url: getApiUrl('/paas/api/system/channel'),
            data: {
              type: 'connect',
              userId: user?.id
            }
          }));
        }
        // 平台配置
        const systemConfig = (await axios({
          method: "post",
          url: getApiUrl('/paas/api/config/get'),
          data: {
            scope: ["system"]
          }
        })).data;
        if (systemConfig?.code === 1) {
          if(systemConfig?.data?.system?.config?.logo) {
            setLogo(systemConfig?.data?.system?.config?.logo)
          }
        }
        console.warn(systemConfig?.data)
        document.title = systemConfig?.data?.system?.config?.title || 'Mybricks-通用无代码开发平台'
        document.querySelector('#favicon').setAttribute('href', systemConfig?.data?.system?.config?.favicon || '/favicon.ico')

        if(systemConfig?.data?.system?.config?.openSystemWhiteList) {
          setAccess(user.role > 1)
        } else {
          setAccess(true)
        }
        appCtx.setSystemConfig(systemConfig?.data?.system?.config)

        /** 设置用户信息 */
        appCtx.setUser(user)
        appCtx.setIsAdministrator(!!user?.isAdmin)
  
        /** 平台安装的应用 */
        const appRes = await axios({
          method: "get",
          url: getApiUrl('/paas/api/apps/getInstalledList')
        })
        const {code, data} = appRes.data
        if (code === 1) {
          appCtx.setApps(data)
        } else {
          message.error('获取安装应用信息失败')
        }
  
      })().finally(() => {
        setLoading(false)
      }).catch((err) => {
        message.error(err?.message ?? '初始化信息失败');
      })

      // 取location.search或上次浏览的地址
      let locationSearch = location.search || storage.get(MYBRICKS_WORKSPACE_DEFAULT_PATH)
      if (typeof locationSearch !== 'string') {
        locationSearch = ''
      }
      const urlQuery = getUrlQuery(locationSearch)

      appCtx.urlQuery = urlQuery
      appCtx.locationSearch = locationSearch

      function historyChange() {
        const hashKey = {}

        Object.keys(appCtx.urlQuery).forEach((key) => {
          hashKey[key] = true
        })

        const urlQuery = getUrlQuery()
        Object.keys(urlQuery).forEach((key) => {
          Reflect.deleteProperty(hashKey, key)
          appCtx.urlQuery[key] = urlQuery[key]
        })

        Object.keys(hashKey).forEach((key) => {
          appCtx.urlQuery[key] = null
        })
        appCtx.locationSearch = location.search
        storage.set(MYBRICKS_WORKSPACE_DEFAULT_PATH, location.search)
      }

      window.addEventListener('popstate', historyChange)

      const _pushState = window.history.pushState

      history.pushState = (...args) => {
        const [,,url] = args

        if (location.search !== url) {
          _pushState.call(window.history, ...args)
          historyChange()
        }
      }

      storage.set(MYBRICKS_WORKSPACE_DEFAULT_PATH, locationSearch)
      history.replaceState(null, '', locationSearch)
    }, [])

    return loading ? (
      <div className={css.loadingContainer}>
        <div className={css.loadingText}>
          加载中，请稍后...
        </div>
      </div>
    ) : (
      access ? (
        <ConfigProvider locale={zhCN}>
          <div className={css.app}>
            <Sideber logo={logo}/>
            <div className={css.content}>
              <Content />
            </div>
          </div>
        </ConfigProvider>
      ) : (
        <NoAccess />
      )
    )
}
