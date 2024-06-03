import React, {
  useMemo,
  useState,
  useEffect,
  useCallback
} from 'react'

import {
  message,
} from 'antd'
import axios from 'axios'
import {observe} from '@mybricks/rxui'
import {SettingOutlined, LeftOutlined, EllipsisOutlined } from '@ant-design/icons'


import {getApiUrl} from '../../../utils'
import AppCtx, { T_App } from '../../AppCtx'
import SchemaSetting, {SettingItem} from './schemaSetting'
import { DiagnosticsIcon, LogIcon, MonitorIcon, OssIcon } from './icon'
// import AboutForm from './items/aboutForm'
import OssForm from './items/ossForm'
import GlobalForm from './items/globalForm'

interface MenuItem extends T_App {
  icon: any
  setting?: SettingItem[] | string
}

import styles from './index.less'
import Term from './term'
import Monitor from './items/monitor'
import Diagnostics from './items/diagnostics'

interface TabsProps {
  onClick: (e: any) => void
  activeKey?: string
  items: Array<{
    title: string
    namespace: string
    icon: JSX.Element
  }>
  style?: any
  breakCount: number
}

const SystemConfigItems = [
  // { title: '全局设置', namespace: 'system', icon: <SettingOutlined /> },
  // { title: '资源存储', namespace: 'mybricks-oss-config', icon: <OssIcon />},
  { title: '运行日志', namespace: 'mybricks-log', icon: <LogIcon />},
  { title: '系统诊断', namespace: 'mybricks-diagnostics', icon: <DiagnosticsIcon /> },
  // { title: '更多', namespace: 'about', icon: <EllipsisOutlined /> }
]
if(location.href.indexOf('mybricks.world') !== -1 || location.href.indexOf('localhost') !== -1) {
  SystemConfigItems.splice(SystemConfigItems.length - 1, 0, { title: '监控与统计', namespace: 'mybricks-monitor', icon: <MonitorIcon />})
}

const Tabs = ({ onClick, activeKey, items = [], style }: TabsProps) => {
  if (!Array.isArray(items)) {
    return null
  }
  let group1 = [];
  let group2 = [];
  items?.forEach((item, index) => {
    let temp = (
      <div
          key={item.namespace}
          className={`${styles.tab} ${activeKey === item.namespace ? styles.activeTab : ''
            }`}
          onClick={() => onClick?.({ namespace: item.namespace })}
        >
          <div className={styles.icon}>{item?.icon}</div>
          <div className={styles.label}>{item?.title}</div>
      </div>
    );
    if(index <= SystemConfigItems.length - 1) {
      group1.push(temp)
    } else {
      group2.push(temp)
    }
  })
  return (
    <div className={styles.tabs} style={style}>
      <div style={{display: 'flex'}}>
        {...group1}
      </div>
      <div style={{display: 'flex'}}>
        {...group2}
      </div>
    </div>
  )
}

export default () => {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const user = appCtx.user
  const [activeKey, setActiveKey] = useState()
  const [configMap, setConfigMap] = useState({})

  const [isConfigMount, setIsConfigMount] = useState(false)
  const [currentPlatformVersion, setCurrentPlatformVersion] = useState('');

  const menuItems = useMemo((): any[] => {
    if (!Array.isArray(appCtx.InstalledAPPS)) {
      return SystemConfigItems
    } else {
      const appSettings = appCtx.InstalledAPPS.filter(
        (app) => app?.setting
      ).map((app) => {
        return {
          ...app,
          icon: typeof app?.icon === 'string' ? <img src={app.icon} /> : app.icon,
        }
      })

      return [...SystemConfigItems, ...appSettings]
    }
  }, [SystemConfigItems])

  const queryConfig = useCallback(() => {
    ; (async () => {
      const res = await axios({
        method: 'post',
        url: getApiUrl('/paas/api/config/get'),
        data: {
          scope: menuItems.map((t) => t.namespace),
        },
      })
      const { code, data } = res?.data || {}
      if (code === 1) {
        setConfigMap(data)
        setIsConfigMount(true)
      }
    })().catch((err) => {
      message.error(err.message || '查询设置失败')
    })
  }, [menuItems])

  const submitConfig = useCallback(
    (namespace, values) => {
      ; (async () => {
        const res = await axios({
          method: 'post',
          url: getApiUrl('/paas/api/config/update'),
          data: {
            namespace: namespace,
            userId: user.id,
            config: values,
          },
        })

        const { code } = res?.data || {}
        if (code === 1) {
          message.success('保存成功')
          queryConfig()
        }
      })().catch((err) => {
        message.error(err.message || '保存设置失败')
      })
    },
    [user, queryConfig]
  )

  useEffect(() => {
    queryConfig()
  }, [queryConfig])

  useEffect(() => {
    axios.post(getApiUrl('/paas/api/system/channel'), {
      type: "getCurrentPlatformVersion",
      userId: appCtx.user?.id,
    }).then(({ data }) => {
      if(data.code === 1) {
        setCurrentPlatformVersion(data.data)
      }
    })
  }, [])

  const renderContent = () => {
    switch (true) {
      case !isConfigMount: {
        return '配置初始化中...'
      }
      case !activeKey: {
        return null
      }
      /** 系统设置 */
      case activeKey === 'system': {
        return (
          <GlobalForm
            style={{ paddingTop: 20 }}
            initialValues={configMap?.[activeKey]?.config}
            onSubmit={(values) => {
              submitConfig(activeKey, values)
            }}
          />
        )
      }
      case activeKey === 'mybricks-oss-config': {
        return (
          <OssForm
            style={{ paddingTop: 20 }}
            initialValues={configMap?.[activeKey]?.config}
            onSubmit={(values) => {
              submitConfig(activeKey, values)
            }}
          />
        )
      }
      case activeKey === 'mybricks-log': {
        return (
          <Term />
        )
      }
      case activeKey === 'mybricks-monitor': {
        return (
          <Monitor />
        )
      }
      case activeKey === 'mybricks-diagnostics': {
        return (
          <Diagnostics />
        )
      }
      // case activeKey === 'about': {
      //   return (
      //     <AboutForm currentPlatformVersion={currentPlatformVersion} />
      //   )
      // }
      /** 其他APP导入的设置 */
      case Boolean(activeKey): {
        const activeItem = menuItems.find(
          (item) => item.namespace === activeKey
        )

        /** 如果是html走iframe渲染 */
        if (
          typeof activeItem?.setting === 'string' &&
          activeItem?.setting.includes('.html')
        ) {
          return (
            <iframe
              src={`/${activeItem.namespace}/${activeItem?.setting}`}
              // @ts-ignore
              frameborder="no"
              border="0"
              style={{
                paddingTop: 20,
                minHeight: '500px',
                maxHeight: '90vh',
                height: 600,
                width: '100%',
              }}
            />
          )
        }

        /** 如果是数组走协议渲染 */
        if (Array.isArray(activeItem?.setting) && activeItem?.namespace) {
          return (
            <SchemaSetting
              key={activeItem?.namespace}
              initialValues={configMap?.[activeItem?.namespace]?.config}
              schema={activeItem?.setting}
              style={{
                minHeight: '500px',
                maxHeight: '90vh',
                height: 600,
                width: '100%',
                paddingTop: 20,
              }}
              onSubmit={(values) => {
                submitConfig(activeItem?.namespace, values)
              }}
            />
          )
        }

        return null
      }
      default: {
        return null
      }
    }
  }

  const activeTitle = useMemo(() => {
    return menuItems?.find?.((t) => t.namespace === activeKey)?.title ?? '设置'
  }, [activeKey, menuItems])

  return (
    <div className={`${styles.configModal} fangzhou-theme`}>
      <div className={styles.title}>
        {activeKey && (
          <LeftOutlined
            style={{ marginRight: 10, cursor: 'pointer' }}
            onClick={() => setActiveKey('')}
          />
        )}
        {activeTitle}
      </div>
      <div className={styles.configContainer}>
        <Tabs
          style={{ display: !activeKey ? 'block' : 'none' }}
          onClick={({ namespace }) => {
            setActiveKey(namespace)
          }}
          items={menuItems}
        />
        {renderContent()}
      </div>
    </div>
  )
}
