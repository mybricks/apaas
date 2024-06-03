import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback
} from 'react'

import {
  Form,
  Spin,
  Input,
  Modal,
  Upload,
  message
} from 'antd'
import axios from 'axios'
import {evt, observe} from '@mybricks/rxui'

import type {UploadProps} from 'antd/es/upload/interface'

import {Item} from '..'
import {
  uuid,
  storage,
  fileSort,
  isObject,
  getApiUrl,
  staticServer
} from '../../../utils'
import AppCtx from '../../AppCtx'
import NavMenu from './menu/navMenu'
import {useDebounceFn} from '@/hooks'
import {UserGroup, Add, mybricksGroupIcons} from '@/components'
import {MYBRICKS_WORKSPACE_DEFAULT_NAV_MY_EXPAND, MYBRICKS_WORKSPACE_DEFAULT_NAV_GROUP_EXPAND} from '../../../const'

import css from './index.less'

const { Dragger } = Upload

export let appCtx: AppCtx = null

export default function PlatformMenu() {
  appCtx = observe(AppCtx, {from: 'parents'})
  return (
    <>
      <div className={css.overflowAuto}>
        <My />
        <Group />
      </div>
      <div style={{marginTop: 'auto'}}>
        <Item
          icon="./image/icon_rubbish.png"
          title="回收站"
          namespace="?appId=trash"
        />
      </div>
    </>
  )
}

function My() {
  // const appCtx = observe(AppCtx, {from: 'parents'})
  const local: object = storage.get(MYBRICKS_WORKSPACE_DEFAULT_NAV_MY_EXPAND)
  const relLocal: object = local || {
    open: true,
    child: {}
  }
  const proxyLocal = setLocalProxy(relLocal, relLocal, MYBRICKS_WORKSPACE_DEFAULT_NAV_MY_EXPAND)

  return (
    <NavMenu
      id={'my'}
      name='我的'
      child={proxyLocal}
      namespace={`?appId=files`}
      icon={'./image/icon_myproject.png'}
      getFiles={(id) => {
        return new Promise((resolve) => {
          const [, parentId] = id.split('-')

          axios({
            method: 'get',
            url: getApiUrl('/paas/api/file/getMyFiles'),
            params: {
              userId: appCtx.user.id,
              extNames: 'folder,folder-project,folder-module',
              parentId
            }
          }).then(({data}) => {
            if(data.code === 1) {
              resolve(fileSort(data.data))
            } else {
              message.error(data.msg)
              resolve([])
            }
          })
        })
      }}
      onClick={(id) => {
        const [, parentId] = id.split('-');
        history.pushState(null, '', `?appId=files${parentId ? `&parentId=${parentId}` : ''}`)
      }}
    />
  )
}

function Group() {
  // const appCtx = observe(AppCtx, {from: 'parents'})
  const [open, setOpen] = useState(false)

  const Suffix = useMemo(() => {
    return (
      <div
        className={css.addiconContainer}
        onClick={evt(() => {
          setOpen(true)
        }).stop}
      >
        <Add width={16} height={16} />
      </div>
    )
  }, [])

  const GroupItem = useMemo(() => {
    const local: object = storage.get(MYBRICKS_WORKSPACE_DEFAULT_NAV_GROUP_EXPAND)
    const relLocal: object = local || {
      open: true,
      child: {}
    }
    const proxyLocal = setLocalProxy(relLocal, relLocal, MYBRICKS_WORKSPACE_DEFAULT_NAV_GROUP_EXPAND)

    return (
      <NavMenu
        id={''}
        name='我加入的协作组'
        namespace={`group`}
        child={proxyLocal}
        focusable={false}
        canDrag={(id) => !!id}
        icon={UserGroup}
        suffix={Suffix}
        getFiles={(id) => {
          return new Promise((resolve) => {
            const [groupId, parentId] = id.split('-')

            if (groupId) {
              // 查文件夹
              axios({
                method: 'get',
                url: getApiUrl('/paas/api/file/getGroupFiles'),
                params: {
                  userId: appCtx.user.id,
                  extNames: 'folder,folder-project,folder-module',
                  parentId,
                  groupId
                }
              }).then(({ data }) => {
                if(data.code === 1) {
                  resolve(fileSort(data.data))
                } else {
                  resolve([])
                }
              })
            } else {
              // 查协作组
              axios({
                method: 'get',
                url: getApiUrl('/paas/api/userGroup/getVisibleGroups'),
                params: {
                  userId: appCtx.user.id
                }
              }).then(({ data }) => {
                resolve(data.data)
              })
            }
          })
        }}
        onClick={(id) => {
          const [groupId, parentId] = id.split('-')
          history.pushState(null, '', `?appId=files${groupId ? `&groupId=${groupId}` : ''}${parentId ? `&parentId=${parentId}` : ''}`)
        }}
      />
    )
  }, [])

  const AdminGroupItem = useMemo(() => {
    return (
      <NavMenu
        id={''}
        name='其他协作组(超管可见)'
        namespace={`otherGroup`}
        child={{open: false, child: {}}}
        focusable={false}
        canDrag={() => false}
        icon={UserGroup}
        suffix={null}
        getFiles={(id) => {
          return new Promise((resolve) => {
            const [groupId, parentId] = id.split('-')

            if (groupId) {
              // 查文件夹
              axios({
                method: 'get',
                url: getApiUrl('/paas/api/file/getGroupFiles'),
                params: {
                  userId: appCtx.user.id,
                  extNames: 'folder,folder-project,folder-module',
                  parentId,
                  groupId
                }
              }).then(({ data }) => {
                if(data.code === 1) {
                  resolve(fileSort(data.data))
                } else {
                  resolve([])
                }
              })
            } else {
              // 查协作组
              axios({
                method: 'get',
                url: getApiUrl('/paas/api/userGroup/getOtherGroups'),
                params: {
                  userId: appCtx.user.id
                }
              }).then(({ data: { data } }) => {
                resolve(data)
              })
            }
          })
        }}
        onClick={(id) => {
          const [groupId, parentId] = id.split('-')
          history.pushState(null, '', `?appId=files${groupId ? `&groupId=${groupId}` : ''}${parentId ? `&parentId=${parentId}` : ''}`)
        }}
      />
    )
  }, [])

  const modalOk = useCallback((values, app) => {
    return new Promise(async (resolve, reject) => {
      const { name, icon } = values
      const data: any = {
        userId: appCtx.user.id,
        name
      }
      if (icon && (icon.startsWith('http') || icon.startsWith('Mybricks'))) {
        data.icon = icon
      }
      axios({
        method: 'post',
        url: getApiUrl('/paas/api/userGroup/create'),
        data
      }).then(async ({data}) => {
        if (data.code === 1) {
          await appCtx.refreshSidebar('group')
          resolve('创建协作组成功')
        } else {
          reject(data.message)
        }
      }).catch((e) => {
        reject('创建协作组失败' + e?.message || '')
      })
    })
  }, [])

  const modalCancel = useCallback(() => {
    setOpen(false)
  }, [])

  const RenderCreateAppModal = useMemo(() => {
    return (
      <CreateGroupModal
        open={open}
        onOk={modalOk}
        onCancel={modalCancel}
      />
    )
  }, [open])

  return (
    <>
      {GroupItem}
      { appCtx.user?.isAdmin ? AdminGroupItem : null }
      {RenderCreateAppModal}
    </>
  )
}

function CreateGroupModal({open, onOk, onCancel}) {
  const [context] = useState({
    submittable: true
  })
  const [form] = Form.useForm()
  const [btnLoading, setBtnLoading] = useState(false)
  const ref = useRef()
  const [uploadLoading, setUploadLoading] = useState<boolean>(false)
  const [icon, setIcon] = useState('MybricksGroupIcon0')
  const [groupIcons, setGroupIcons] = useState([...mybricksGroupIcons])

  const { run: ok } = useDebounceFn(() => {
    form.validateFields().then((values) => {
      setBtnLoading(true)
      onOk(values).then((msg) => {
        message.success(msg)
        cancel()
      }).catch((e) => {
        setBtnLoading(false)
        message.warn(e)
      })
    }).catch(() => {})
  }, {wait: 200});

  const cancel = useCallback(() => {
    onCancel()
    setBtnLoading(false)
    setUploadLoading(false)
    form.resetFields()
  }, [])

  useEffect(() => {
    if (open && ref.current) {
      setTimeout(() => {
        (ref.current as any).focus()
      }, 100)
    }
  }, [open])

  const uploadImage: UploadProps['customRequest'] = useCallback((options) => {
    const { file } = options

    staticServer({
      content: file,
      folderPath: `/imgs/${Date.now()}`,
      // @ts-ignore
      fileName: `${uuid()}.${file.name?.split('.').pop()}`,
    }).then((data) => {
      options.onSuccess(data.url)
    }).catch((e) => {
      options.onError(e)
    })
  }, [])

  const beforeUpload: UploadProps['beforeUpload'] = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const fileKB = file.size / 1024

      if (fileKB <= 10) {
        resolve()
      } else {
        message.info('图标必须小于10KB！')
        reject()
      }
    })
  }, [])

  const onIconClick = useCallback((key) => {
    setIcon(key)
    form.setFieldValue('icon', key)
  }, [])

  return (
    <Modal
      open={open}
      title={'新建协作组'}
      okText={'确认'}
      cancelText={'取消'}
      centered={true}
      onOk={ok}
      onCancel={cancel}
      confirmLoading={btnLoading}
    >
      <Form
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 21 }}
        form={form}
      >
        <Form.Item
          label='名称'
          name='name'
          style={{height: 32, marginBottom: 24}}
          rules={[{ required: true, message: '请输入协作组名称！', validator(rule, value) {
            return new Promise((resolve, reject) => {
              if (!value.trim()) {
                reject(rule.message)
              } else [
                resolve(true)
              ]
            })
          }}]}
        >
          <Input
            onCompositionStart={() => {
              context.submittable = false
            }}
            onCompositionEnd={() => {
              context.submittable = true
            }}
            ref={ref}
            placeholder={`请输入协作组名称`}
            autoFocus
            onPressEnter={() => context.submittable && ok()}
          />
        </Form.Item>
        <Form.Item label='图标' name='icon'>
          <div className={css.iconList}>
            {groupIcons.map(({key, Icon}) => {
              const width = ['MybricksGroupIcon0', 'MybricksGroupIcon1'].includes(key) ? 20 : 200
              return (
                <div key={key} className={`${css.icon}${icon === key ? ` ${css.iconActive}` : ''}`} onClick={() => onIconClick(key)}>
                  <Icon width={width} height={width}/>
                </div>
              )
            })}
            {/* <div className={css.icon}>
              <Add width={15} height={15}/>
            </div> */}
            <Spin
              spinning={uploadLoading}
              size='small'
              // tip='上传中'
            >
              <Upload
                showUploadList={false}
                accept='image/*'
                disabled={uploadLoading}
                customRequest={uploadImage}
                beforeUpload={beforeUpload}
                onChange={(info) => {
                  const { file } = info
                  const { status, error, response } = file

                  if (status === 'uploading') {
                    setUploadLoading(true)
                  } else if (status === 'done') {
                    onIconClick(response)
                    // form.setFieldValue('icon', response)
                    setGroupIcons(groupIcons.concat({key: response, Icon: () => <img src={response}/>}))
                    setUploadLoading(false)
                  } else if (status === 'error') {
                    setUploadLoading(false)
                    message.error(error)
                  }
                }}
              >
              <div className={css.icon}>
                <Add width={15} height={15}/>
              </div>
            </Upload>
          </Spin>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}

/**
 * nav开关信息写入localStorage
 * @param obj 
 * @param parentObj 
 * @param localKey 
 * @returns 
 */
export function setLocalProxy (obj, parentObj, localKey) {
  return new Proxy(obj, {
    set(target, key, value) {
      const preValue = target[key]

      target[key] = value

      if (key === 'open' || key === 'child') {
        if (preValue !== value) {
          if (value === false) {
            Reflect.set(target, 'child', {})
          }
          storage.set(localKey, parentObj)
        }
      }

      return true
    },
    get(target, key) {
      let value = target[key]

      if (isObject(value)) {
        value = setLocalProxy(value, parentObj, localKey)
      }

      return value
    }
  })
}
