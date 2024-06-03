import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback
} from 'react'

import axios from 'axios'
import {
  Spin,
  Table,
  Modal,
  Input,
  Upload,
  Button,
  Select,
  Avatar,
  message,
  Tooltip,
  Popover,
  Form as AntdForm
} from 'antd'
import {evt, observe, useObservable} from '@mybricks/rxui'
import {UserOutlined, EditOutlined, DownOutlined} from '@ant-design/icons'

import {
  uuid,
  copyText,
  getApiUrl,
  staticServer
} from '../../../../../utils'
import ParentCtx from '../../Ctx'
import {Title, ClickableIcon} from '..'
import AppCtx from '../../../../AppCtx'
import {useDebounceFn} from '@/hooks'
import {Add, Divider, UserGroup, mybricksGroupIcons} from '@/components'
import GroupSetting from './group-setting';

import type {UploadProps} from 'antd/es/upload/interface'

const {TextArea} = Input
const {Dragger} = Upload

import css from './index.less'
import CustomDebounceSelect from './debounceSelect'

/** 协作用户信息 */
interface GroupUser {
  /** 头像 */
  avatar?: string;
  /** 名称 */
  name?: string;
  /** ID */
  email?: string;
}

class Ctx {
  /**
   * 获取协作组信息
   * @param id 协作组ID
   */
  getInfo: (id: number) => void;
  /** 协作组信息 */
  info: null | {
    /** ID */
    id: number;
    /** 名称 */
    name: string;
    /** 图标 */
    icon?: string;
    /** 创建人ID */
    creatorId: string;
    /** 创建人名称 */
    creatorName: string;
    /** 协作用户列表 */
    users: Array<GroupUser>;
    /** 协作用户总数 */
    userTotal: number;
    /** 当前用户协作信息 */
    userGroupRelation: {
      /** 权限配置 */
      roleDescription: number;
    };
  }
  /** 可管理 */
  manageable: boolean;
  /** 可编辑 */
  editable: boolean;
}

export default function Group(props) {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const ctx = useObservable(Ctx, next => next({
    getInfo(id) {
      return new Promise((resolve) => {
        axios({
          method: "get",
          url: getApiUrl(`/paas/api/userGroup/getGroupInfoByGroupId?id=${id}&userId=${appCtx.user.id}&pageIndex=1&pageSize=5`)
        }).then(({data: {data}}) => {
          ctx.info = data
          const { userGroupRelation } = data
          const roleDescription = userGroupRelation?.roleDescription
          ctx.manageable = roleDescription === 1
          ctx.editable = roleDescription === 2
          ctx.isFounder = +data.creatorId === +appCtx.user.id
          resolve(true)
        })
      })
    }
  }), {to: 'children'})
  const {info, manageable, isFounder} = ctx

  useEffect(() => {
    ctx.getInfo(props.id)
  }, [])

  return (
    <div className={css.container}>
      <Title content={info?.name} suffix={manageable && <GroupTitleConfig />}/>
      {info && (
        <>
          <DescriptionWrapper
            label='成员'
            LabelRender={manageable && (
              <UserConfig />
            )}
            DetailRender={<UserList data={info.users} total={info.userTotal}/>}
          />
          <DescriptionWrapper
            label='协作组所有者'
            value={info.creatorName || info.creatorId}
          />
          {<GroupOperate {...info} manageable={manageable} isFounder={isFounder} />}
        </>
      )}
    </div>
  )
}

function GroupOperate(props) {
  const { manageable, isFounder } = props
  const appCtx = observe(AppCtx, {from: 'parents'})
  const [open, setOpen] = useState<number | boolean>(false)
  const [showSetting, setShowSetting] = useState(false);

  const deleteClick = useCallback(() => setOpen(true), []);
  const openSetting = useCallback(() => setShowSetting(true), []);

  const modalOk = useCallback(() => {
    return new Promise(async (resolve, reject) => {
      axios({
        method: 'post',
        url: getApiUrl('/paas/api/userGroup/delete'),
        data: {
          userId: appCtx.user.id,
          id: props.id
        }
      }).then(({data}) => {
        if (data.code === 1) {
          history.pushState(null, '', `?appId=files`)
          appCtx.refreshSidebar('group')
          resolve('删除协作组成功')
        } else {
          reject(data.message)
        }
      }).catch((e) => {
        reject('删除协作组失败' + e?.message || '')
      })
    })
  }, [])

  const modalCancel = useCallback(() => {
    setOpen(false)
  }, [])

  const RenderDeleteGroupModal = useMemo(() => {
    if (typeof open === 'number') {
      return null
    }
    return (
      <DeleteGroupModal
        open={open}
        onOk={modalOk}
        onCancel={modalCancel}
        groupName={props.name}
      />
    )
  }, [open])
  const showSettingButton = useMemo(() => {
    return !!appCtx.InstalledAPPS.filter(app => app?.groupSetting).length;
  }, []);

  const _renderContent = () => {
    if(manageable) {
      if(isFounder) {
        // 可管理，是创建者
        return (
          <>
            <Divider />
            <div className={css.btnGroup}>
              {showSettingButton ? <button className={css.primaryButton} onClick={openSetting}>设置</button> : null}
              <button className={css.dangerButton} onClick={deleteClick}>删除协作组</button>
            </div>
            {RenderDeleteGroupModal}
            <GroupSetting visible={showSetting} onClose={() => setShowSetting(false)} />
          </>
        )
      } else {
        // 可管理，不是创建者
        return (
          <>
            <Divider />
            <div className={css.btnGroup}>
              {showSettingButton ? <button className={css.primaryButton} onClick={openSetting}>设置</button> : null}
            </div>
            {/* <GroupSetting visible={showSetting} onClose={() => setShowSetting(false)} /> */}
          </>
        )
      }
    } else {
      return null
    }
  }

  return (
    <>
    {_renderContent()}
    </>
  )
}

function DeleteGroupModal({open, onOk, onCancel, groupName}) {
  return ConfigFormModal({
    open,
    onOk,
    onCancel,
    title: '确定要删除当前协作组吗？',
    Form: ({form, editRef, ok}) => {
      const [context] = useState({
        submittable: true
      })
      return (
        <AntdForm
          labelCol={{ span: 0 }}
          wrapperCol={{ span: 24 }}
          form={form}
        >
          <AntdForm.Item
            name="name"
            rules={[{ required: true, message: '输入名称与当前协作组不同', validator(rule, value) {
              return new Promise((resolve, reject) => {
                if (value !== groupName) {
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
              ref={editRef}
              placeholder={`请输入当前协作组名称以确认删除`}
              autoFocus
              onPressEnter={() => context.submittable && ok()}
            />
          </AntdForm.Item>
        </AntdForm>
      )
    }
  })
}

function GroupTitleConfig () {
  const ctx = observe(Ctx, {from: 'parents'})
  const parentCtx = observe(ParentCtx, {from: 'parents'})
  const appCtx = observe(AppCtx, {from: 'parents'})
  const [open, setOpen] = useState<number | boolean>(0)

  const iconClick = useCallback(() => {
    setOpen(true)
  }, [])

  const modalOk = useCallback((values) => {
    return new Promise(async (resolve, reject) => {
      const { name, icon } = values
      const data: any = {
        userId: appCtx.user.id,
        id: ctx.info.id,
        name
      }
      if (icon && (icon.startsWith('http') || icon.startsWith('Mybricks'))) {
        data.icon = icon
      }
      axios({
        method: 'post',
        url: getApiUrl('/paas/api/userGroup/update'),
        data
      }).then(async ({data}) => {
        if (data.code === 1) {
          appCtx.refreshSidebar('group')
          parentCtx.path[parentCtx?.path?.length - 1].name = name
          ctx.info.name = name
          resolve('更改协作组信息成功')
        } else {
          reject(data.message)
        }
      }).catch((e) => {
        reject('更改协作组信息失败' + e?.message || '')
      })
    })
  }, [])

  const modalCancel = useCallback(() => {
    setOpen(false)
  }, [])

  const RenderUpdateGroupInfoModal = useMemo(() => {
    if (typeof open === 'number') {
      return null
    }
    const { info } = ctx
    return (
      <UpdateGroupInfoModal
        open={open}
        onOk={modalOk}
        onCancel={modalCancel}
        defaultValues={{name: info?.name, icon: info?.icon}}
      />
    )
  }, [open])

  return (
    <>
      <ClickableIcon onClick={iconClick}>
        <EditOutlined style={{fontSize: 14}}/>
      </ClickableIcon>
      {RenderUpdateGroupInfoModal}
    </>
  )
}

function UpdateGroupInfoModal ({open, onOk, onCancel, defaultValues}) {
  return (
    <ConfigFormModal
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      title='修改协作组信息'
      defaultValues={defaultValues}
      Form={({form, editRef, ok}) => {
        const [context] = useState({
          submittable: true
        })
        const [uploadLoading, setUploadLoading] = useState<boolean>(false)
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
        const [icon, setIcon] = useState(defaultValues.icon || 'MybricksGroupIcon0')
        const [groupIcons, setGroupIcons] = useState([...mybricksGroupIcons].concat(defaultValues.icon ? (defaultValues.icon.startsWith('Mybricks') ? [] : [{key: defaultValues.icon, Icon: () => <img src={defaultValues.icon}/>}]) : []))
      
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
          <AntdForm
            labelCol={{ span: 3 }}
            wrapperCol={{ span: 21 }}
            form={form}
          >
            <AntdForm.Item
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
                ref={editRef}
                placeholder={`请输入协作组名称`}
                autoFocus
                onPressEnter={() => context.submittable && ok()}
              />
            </AntdForm.Item>
            <AntdForm.Item label='图标' name='icon'>
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
            </AntdForm.Item>
          </AntdForm>
        )
      }}
    />
  )
}

function UserConfig() {
  const [open, setOpen] = useState<number | boolean>(0)

  const iconClick = useCallback(() => {
    setOpen(true)
  }, [])

  const modalCancel = useCallback(() => {
    setOpen(false)
  }, [])

  const RenderUserConfigModal = useMemo(() => {
    if (typeof open === 'number') {
      return null
    }
    return (
      <NewUserConfigModal
        open={open}
        onCancel={modalCancel}
      />
    )
  }, [open])

  return (
    <>
      <ClickableIcon onClick={iconClick}>
        <UserOutlined />
      </ClickableIcon>
      {RenderUserConfigModal}
    </>
  )
}

type InfoProps = {
  label?: any
  value?: any
  LabelRender?: JSX.Element
  DetailRender?: JSX.Element
}

function DescriptionWrapper ({label, value, LabelRender, DetailRender}: InfoProps) {
  return (
    <div className={css.descriptionWrapper}>
      <div className={css.descriptionLabel}>
        <span>{label}</span>
        {LabelRender}
      </div>
      <div className={css.descriptionDetail}>
        {value}
        {DetailRender}
      </div>
    </div>
  )
}

interface User {
  avatar?: string;
  name: string;
  email: string;
}

interface UserListProps {
  data: User[];
  total: number;
}

function UserList ({ data = [], total = 0 }: UserListProps) {
  return (
    <div className={css.userList}>
      {data.slice(0, 5).map(user => {
        return (
          <DefaultAvatar
            avatar={user.avatar}
            /** 当头像不存在，使用名词或者 email 首字母做头像 */
            content={user.name || user.email}
          />
        )
      })}
      {total > 5 && (
        <DefaultAvatar title={String(total)} content={`共 ${total} 个协作者`}/>
      )}
    </div>
  )
}

function DefaultAvatar({avatar = '', content, title = ''}) {
  return (
    <div className={css.avatarWrapper}>
      <Tooltip title={content}>
        <div className={css.avatar}>
          {avatar ? (
            <Avatar
              size={32}
              style={{backgroundColor: '#ebedf0'}}
              src={avatar}
            />
          ) : (
            <Avatar
              size={32}
              style={{backgroundColor: '#ebedf0', fontSize: 14, fontWeight: 600, color: '#95999e'}}
            >
              {title || (typeof content === 'string' ? content[0].toUpperCase() : content)}
            </Avatar>
          )}
        </div>
      </Tooltip>
    </div>
  )
}

export function ConfigFormModal({
  open,
  onOk,
  onCancel,
  Form,
  title = '标题',
  okText = '确认',
  cancelText = '取消',
  bodyStyle = {
    minHeight: 104
  },
  defaultValues = {}
}) {
  const [form] = AntdForm.useForm()
  const [btnLoading, setBtnLoading] = useState(false)
  const ref = useRef()

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
    form.resetFields()
  }, [])

  useEffect(() => {
    if (open && ref.current) {
      form.setFieldsValue(defaultValues)
      setTimeout(() => {
        (ref.current as any).focus()
      }, 100)
    }
  }, [open])

  const RenderForm = useMemo(() => {
    return <Form form={form} editRef={ref} ok={ok}/>
  }, [])

  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      cancelText={cancelText}
      centered={true}
      onOk={ok}
      onCancel={cancel}
      confirmLoading={btnLoading}
      bodyStyle={bodyStyle}
    >
      {RenderForm}
    </Modal>
  )
}

const roleDescriptionOptions = [
  {title: '可管理', description: '查看、编辑和管理协作成员', value: 1},
  {title: '可编辑', description: '查看和编辑', value: 2},
  {title: '可查看', description: '查看', value: 3},
  {title: '移除', description: '移出协作组成员', value: -1},
]

function NewUserConfigModal({open, onCancel}) {
  const ctx = observe(Ctx, {from: 'parents'})
  const appCtx = observe(AppCtx, {from: 'parents'})
  const [tableInfo, setTableInfo] = useState({
    users: [],
    pageIndex: 1,
    pageSize: 10,
    total: 0
  })
  const [tableLoading, setTableLoading] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  
  const update = useCallback((value, user, tableInfo) => {
    setTableLoading(true)
    axios({
      method: 'post',
      url: getApiUrl('/paas/api/userGroup/updateUserGroupRelation'),
      data: {
        id: ctx.info.id,
        userId: appCtx.user.id,
        operatedUserId: user.id,
        roleDescription: value
      }
    }).then(({ data }) => {
      if(data.code === 1) {
        if (value === -1) {
          message.success('设置成功')
          ctx.getInfo(ctx.info.id)
          getUsers({
            ...tableInfo,
            pageIndex: tableInfo.users.length === 1 ? tableInfo.pageIndex - 1 : tableInfo.pageIndex
          })
        } else {
          user.roleDescription = value
          setTableLoading(false)
        }
      } else {
        message.warn(data.msg || '设置失败')
        setTableLoading(false)
      }
      
    }).catch((e) => {
      message.error('设置失败')
      console.error(e)
      setTableLoading(false)
    })
  }, [])
  const copy = useCallback((content) => {
    copyText(content)
    message.success('复制成功')
  }, [])
  const columns = useCallback((tableInfo) => {
    const {creatorId} = ctx.info
    const {email} = appCtx.user
    return [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 160,
        ellipsis: true,
        render: (id) => {
          return <span className={css.copy} onClick={() => copy(id)}>{id}</span>
        }
      },
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        width: 90,
        ellipsis: true,
        render: (name) => {
          const finalName = name || '-'
          return <span className={css.copy} onClick={() => copy(finalName)}>{finalName}</span>
        }
      },
      {
        title: 'account',
        dataIndex: 'email',
        key: 'email',
        ellipsis: true,
        render: (email) => {
          return <span className={css.copy} onClick={() => copy(email)}>{email}</span>
        }
      },
      {
        title: '权限',
        dataIndex: 'roleDescription',
        key: 'roleDescription',
        width: 80,
        render: (roleDescription, record) => {
          if (record.id == creatorId) {
            return <div className={css.tagOwner}>所有者</div>
          } else if (roleDescription === 1) {
            return <div className={css.tagManageable}>可管理</div>
          } else if (roleDescription === 2) {
            return <div className={css.tagEditable}>可编辑</div>
          }

          return <div className={css.tagViewable}>可查看</div>
        }
      },
      {
        title: '操作',
        dataIndex: 'operation',
        key: 'operation',
        fixed: 'right',
        width: 80,
        render: (_, record) => {
          return (
            <TableUserOperation
              /** 禁用所有者和当前用户的操作 */
              disabled={record.id == creatorId}
              record={record}
              update={(value, user) => update(value, user, tableInfo)}
            />
          )
        },
      },
    ]
  }, [])
  const getUsers = useCallback((tableInfo) => {
    setTableLoading(true)
    axios({
      method: 'get',
      url: getApiUrl(`/paas/api/userGroup/getGroupUsersByGroupId?id=${ctx.info.id}&pageIndex=${tableInfo.pageIndex}&pageSize=${tableInfo.pageSize}`)
    }).then(({data: {data}}) => {
      setTableLoading(false)
      setTableInfo({
        ...tableInfo,
        ...data
      })
    }).catch((e) => {
      console.error(e)
    })
  }, [])

  useEffect(() => {
    getUsers(tableInfo)
  }, [])

  const RenderTable = useMemo(() => {
    return (
      <Table
        loading={tableLoading}
        // @ts-ignore
        columns={columns(tableInfo)}
        dataSource={tableInfo.users}
        className={css.table}
        size='middle'
        pagination={{
          onChange(pageIndex) {
            getUsers({
              ...tableInfo,
              pageIndex
            })
          },
          current: tableInfo.pageIndex,
          total: tableInfo.total,
          pageSize: tableInfo.pageSize,
          showSizeChanger: false
        }}
      />
    )
  }, [tableLoading, tableInfo])

  const addUserOk = useCallback((values, tableInfo) => {
    return new Promise(async (resolve, reject) => {
      const { userIds, roleDescription } = values
      axios({
        method: 'post',
        url: getApiUrl('/paas/api/userGroup/addUserGroupRelation'),
        data: {
          userId: appCtx.user.id,
          userIds: userIds?.map(i => {
            return i.value
          }),
          roleDescription,
          groupId: ctx.info.id
        }
      }).then(async ({data}) => {
        if (data.code === 1) {
          await getUsers(tableInfo)
          ctx.getInfo(ctx.info.id)
          const success = []
          const error = []
          if (Array.isArray(data.data)) {
            data.data.forEach((item) => {
              if (item.status === 1) {
                success.push(item.userId)
              } else {
                error.push(item.userId)
              }
            })
          }
          if (success.length) {
            message.success(`${success.join()} 添加成功`)
          }
          if (error.length) {
            message.warning((`${error.join()} 添加失败，请填写正确的用户账号`))
          }
          resolve('添加协作用户成功')
        } else {
          reject(data.message)
        }
      }).catch((e) => {
        reject('添加协作用户失败' + e?.msg || '')
      })
    })
  }, [])

  const addUserButtonClick = useCallback((bool) => {
    setShowAddUser(!!bool)
  }, [])

  const RenderAddUserButton = useMemo(() => {
    return (
      <div className={css.addUserButtonContainer}>
        <Popover
          content={() => {
            return <AddUserForm open={showAddUser} onOk={(values) => addUserOk(values, tableInfo)} onCancel={addUserButtonClick}/>
          }}
          trigger='click'
          open={showAddUser}
          onOpenChange={addUserButtonClick}
          placement='bottomLeft'
          overlayClassName={css.popoverContainer}
        >
          <button className={css.addUserButton}>添加协作用户</button>
        </Popover>
      </div>
    )
  }, [showAddUser])

  return (
    <Modal
      open={open}
      title={'协作用户'}
      centered={true}
      footer={null}
      onCancel={onCancel}
      width={700}
    >
      <div className={css.tableTitleAction}>
        {RenderAddUserButton}
      </div>
      {RenderTable}
    </Modal>
  )
}

function AddUserForm({open, onOk, onCancel}) {
  const [context] = useState({
    submittable: true
  })
  const [form] = AntdForm.useForm()
  const [btnLoading, setBtnLoading] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (open) {
      setBtnLoading(false)
      form.resetFields()
      form.setFieldsValue({
        roleDescription: 2
      })
      if (ref.current) {
        setTimeout(() => {
          (ref.current as any).focus()
        }, 100)
      }
    }
  }, [open])

  const { run: ok } = useDebounceFn(() => {
    form.validateFields().then((values) => {
      setBtnLoading(true)
      onOk(values).then((msg) => {
        // message.success(msg)
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
  }, [])

  return (
    <div className={css.addUserFormContainer}>
      <AntdForm
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        form={form}
      >
        <AntdForm.Item
          label='权限'
          name='roleDescription'
          rules={[{required: true}]}
        >
          <Select>
            {roleDescriptionOptions.slice(0, 3).map((option) => {
              return (
                <Select.Option value={option.value}>
                  {option.title}
                  <div className={css.optionDescription}>
                    {option.description}
                  </div>
                </Select.Option>
              )
            })}
          </Select>
        </AntdForm.Item>
        <AntdForm.Item
          label='账号'
          name='userIds'
          rules={[{ required: true, message: '账号不允许为空！' }]}
        >
          <CustomDebounceSelect />
        </AntdForm.Item>
        <AntdForm.Item wrapperCol={{offset: 4, span: 20}} style={{marginBottom: 0}}>
          <Button
            type='primary'
            htmlType='submit'
            style={{marginRight: 8}}
            loading={btnLoading}
            onClick={ok}
          >
            确认
          </Button>
          <Button htmlType='button' onClick={cancel}>
            取消
          </Button>
        </AntdForm.Item>
      </AntdForm>
    </div>
  )
}

function TableUserOperation({disabled, record, update}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={css.actionContainer}>
      <Popover
        open={open}
        placement='bottomRight'
        overlayStyle={{width: 250}}
        overlayClassName={css.popoverContainer}
        onOpenChange={(visible) => {
          if (!disabled) {
            setOpen(visible)
          }
        }}
        content={() => {
          return (
            <div className={css.roleDescriptionOptionsContainer}>
              {roleDescriptionOptions.map((option) => {
                const { title, value , description } = option
                const selected = value === record.roleDescription

                return (
                  <div
                    key={title}
                    className={`${css.optionItem} ${selected ? css.optionItemSelected : ''}`}
                    onClick={() => {
                      if (!selected) {
                        setOpen(false)
                        update(value, record)
                      }
                    }}
                  >
                    <div className={css.optionLeft}>
                      <div className={css.optionTitle}>
                        {title}
                      </div>
                      <div className={css.optionDescription}>
                        {description}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }}
      >
        <div className={`${css.roleDescription} ${disabled ? css.roleDescriptionDisabled : ''}`}>
          <span>设置</span>
          <DownOutlined className={css.icon} style={{fontSize: 12}}/>
        </div>
      </Popover>
    </div>
  )
}
