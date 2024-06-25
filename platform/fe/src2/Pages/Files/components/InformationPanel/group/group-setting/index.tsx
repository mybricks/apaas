import React, {FC, useCallback, useEffect, useMemo, useState} from 'react';
import {message, Modal} from 'antd';
import axios from 'axios';
import {LeftOutlined} from '@ant-design/icons';
// import SchemaSetting from '@/app/sidebar/globalSetting/schemaSetting';

import styles from './index.less'
import { InstalledApp } from '@/types';
import { useWorkspaceConetxt } from '@/context';

interface MenuItem extends InstalledApp {
  icon: any
}

interface TabsProps {
  onClick: (e: any) => void
  activeKey?: string
  items: Array<{ title: string; namespace: string; icon: JSX.Element }>
  style?: any
  breakCount?: number
}

const Tabs = ({ onClick, activeKey, items = [], style }: TabsProps) => {
  if (!Array.isArray(items)) {
    return null
  }

  return (
    <div className={styles.tabs} style={style}>
      <div style={{display: 'flex'}}>
        {items?.map(item => {
         return (
            <div
              key={item.namespace}
              className={`${styles.tab} ${activeKey === item.namespace ? styles.activeTab : ''}`}
              onClick={() => onClick?.({ namespace: item.namespace })}
            >
              <div className={styles.icon}>{item?.icon}</div>
              <div className={styles.label}>{item?.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  )
}

const GroupSetting: FC<any> = props => {
  const { apps: { installedApps } } = useWorkspaceConetxt()
  const { onClose, visible, ctx, user } = props;
  const [activeKey, setActiveKey] = useState('')
  const [configMap, setConfigMap] = useState({});
  const [isConfigMount, setIsConfigMount] = useState(false);
  // const pathInfo = useComputed(() => {
  //   return ctx.path[ctx.path.length - 1];
  // });
  const pathInfo = ctx.info;

  const menuItems = useMemo((): MenuItem[] => {
    return installedApps
      .filter(app => app?.groupSetting)
      .map(app => {
        return {
          ...app,
          icon: typeof app?.icon === 'string' ? <img src={app.icon} alt=""/> : app.icon,
        }
      })
  }, [])

  const queryConfig = useCallback(async () => {
    try {
      const res = await axios({
        method: 'post',
        url: '/paas/api/config/get',
        data: {
          scope: menuItems.map((t) => t.namespace),
          type: 'group',
          id: pathInfo.id,
        },
      })
      const {code, data} = res?.data || {}
      if (code === 1) {
        setConfigMap(data)
        setIsConfigMount(true)
      }
    } catch (err) {
      message.error(err.message || '查询设置失败');
    }
  }, [menuItems, pathInfo])

  const submitConfig = useCallback(
    (namespace, values) => {
      ;(async () => {
        const res = await axios({
          method: 'post',
          url: '/paas/api/config/update',
          data: {
            namespace: namespace,
            userId: user.id,
            config: values,
            type: 'group',
            id: pathInfo.id,
          },
        })

        const {code} = res?.data || {}
        if (code === 1) {
          message.success('保存成功')
          queryConfig()
        }
      })().catch((err) => {
        message.error(err.message || '保存设置失败')
      })
    },
    [user, queryConfig, pathInfo]
  )

  useEffect(() => {
    menuItems.length && queryConfig();
  }, [queryConfig])

  const renderContent = () => {
    switch (true) {
      case !isConfigMount: {
        return '配置初始化中...'
      }
      case !activeKey: {
        return null
      }
      /** 其他APP导入的设置 */
      case Boolean(activeKey): {
        const activeItem = menuItems.find(item => item.namespace === activeKey);

        /** 如果是html走iframe渲染 */
        if (typeof activeItem?.groupSetting === 'string' && activeItem?.groupSetting.includes('.html')) {
          return (
            <iframe
              src={`/${activeItem.namespace}/${activeItem?.groupSetting}?groupId=${pathInfo.id}`}
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
          );
        }

        /** 如果是数组走协议渲染 */
        if (Array.isArray(activeItem?.groupSetting) && activeItem?.namespace) {
          // return (
          //   <SchemaSetting
          //     key={activeItem?.namespace}
          //     initialValues={configMap?.[`${activeItem?.namespace}@group[${pathInfo.id}]`]?.config}
          //     schema={activeItem?.groupSetting}
          //     style={{
          //       minHeight: '500px',
          //       maxHeight: '90vh',
          //       height: 600,
          //       width: '100%',
          //       paddingTop: 20,
          //     }}
          //     onSubmit={(values) => {
          //       submitConfig(activeItem?.namespace, values)
          //     }}
          //   />
          // );
        }

        return null;
      }
      default: {
        return null;
      }
    }
  }

  const activeTitle = useMemo(() => {
    return menuItems?.find?.((t) => t.namespace === activeKey)?.title ?? '协作组设置';
  }, [activeKey, menuItems])

  return (
    <Modal
      footer={false}
      width={700}
      style={{ maxWidth: '90vw' }}
      destroyOnClose
      onCancel={onClose}
      open={visible}
      maskClosable={false}
    >
      <div className={`${styles.configModal} fangzhou-theme`}>
        <div className={styles.title}>
          {activeKey ? (
            // @ts-ignore
            <LeftOutlined
              style={{marginRight: 10, cursor: 'pointer'}}
              onClick={() => setActiveKey('')}
            />
          ) : null}
          {activeTitle}
        </div>
        <div className={styles.configContainer}>
          <Tabs
            style={{display: !activeKey ? 'block' : 'none'}}
            onClick={({namespace}) => {
              setActiveKey(namespace)
            }}
            items={menuItems}
          />
          {renderContent()}
        </div>
      </div>
    </Modal>
  )
};

export default GroupSetting;
