import React, {
  useState,
  useEffect,
} from 'react'
import {
  Form,
  Input,
  Button,
  Select,
  Switch,
} from 'antd'
import AppCtx from '../../../AppCtx'
import {observe} from '@mybricks/rxui'
import styles from '../index.less'

const GlobalForm = ({ initialValues, onSubmit, style }) => {
  const [form] = Form.useForm()
  const [openSystemWhiteListSwitch, setOpenSystemWhiteListSwitch] = useState(initialValues?.openSystemWhiteList)
  const [openLogoutSwitch, setOpenLogoutSwitch] = useState(initialValues?.openLogout)
  const [openUserInfoSettingSwitch, setOpenUserInfoSettingSwitch] = useState(initialValues?.openUserInfoSetting)
  const [openConflictDetectionSwitch, setOpenConflictDetectionSwitch] = useState(initialValues?.openConflictDetection)
  const [closeOfflineUpdate, setCloseOfflineUpdate] = useState(initialValues?.closeOfflineUpdate)
  const [interfaceAuth, setInterfaceAuth] = useState(initialValues?.interfaceAuth)
  const [isPureIntranet, setIsPureIntranet] = useState(initialValues?.isPureIntranet)
  const appCtx = observe(AppCtx, {from: 'parents'})
  const [appOptions, setAppOptions] = useState([])
  useEffect(() => {
    if (!initialValues) {
      return
    }
    form?.setFieldsValue?.(initialValues)
    // console.log('1111', )
    let tempOptions = []
    appCtx.DesignAPPS?.forEach((item) => {
      tempOptions.push({
        label: item.title,
        value: item.namespace
      })
    })
    setAppOptions(tempOptions)

  }, [initialValues])

  return (
    <div className={styles.globalForm} style={style}>
      <Form
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        labelAlign="left"
        autoComplete="off"
      >
        <div style={{paddingLeft: 16}}>
          <p style={{fontSize: 16, fontWeight: 700, marginBottom: 8, marginLeft: -16}}>基础配置</p>
          <Form.Item
            initialValue=""
            label="站点Logo"
            name="logo"
          >
            <Input placeholder='请填写自定义 logo 的 url 地址（高度36px，宽度自适应）' />
          </Form.Item>
          <Form.Item
            initialValue=""
            label="页面标题"
            name="title"
          >
            <Input placeholder='页面html的title' />
          </Form.Item>
          <Form.Item
            initialValue=""
            label="页面ICON"
            name="favicon"
          >
            <Input placeholder='页面html的favicon' />
          </Form.Item>
        </div>
        <div style={{paddingLeft: 16}}>
          <p style={{fontSize: 16, fontWeight: 700, marginBottom: 8, marginLeft: -16}}>高级配置</p>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
            <Form.Item
              style={{ minWidth: '50%' }}
              initialValue=''
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 6 }}
              label="离线模式"
              name="isPureIntranet"
            >
              <Switch checked={isPureIntranet} onChange={() => {
                setIsPureIntranet(!isPureIntranet)
              }} />
            </Form.Item>
            <Form.Item
              style={{ minWidth: '50%' }}
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 6 }}
              initialValue=''
              label="系统白名单"
              name="openSystemWhiteList"
            >
              <Switch checked={openSystemWhiteListSwitch} onChange={() => {
                setOpenSystemWhiteListSwitch(!openSystemWhiteListSwitch)
              }} />
            </Form.Item>
            <Form.Item
              style={{ minWidth: '50%' }}
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 6 }}
              initialValue=''
              label="退出登录"
              name="openLogout"
            >
              <Switch checked={openLogoutSwitch} onChange={() => {
                setOpenLogoutSwitch(!openLogoutSwitch)
              }} />
            </Form.Item>
            <Form.Item
              style={{ minWidth: '50%' }}
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 6 }}
              initialValue=''
              label="个人资料设置"
              name="openUserInfoSetting"
            >
              <Switch checked={openUserInfoSettingSwitch} onChange={() => {
                setOpenUserInfoSettingSwitch(!openUserInfoSettingSwitch)
              }} />
            </Form.Item>
            <Form.Item
              style={{ minWidth: '50%' }}
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 6 }}
              initialValue=''
              label="升级冲突检测"
              name="openConflictDetection"
            >
              <Switch checked={openConflictDetectionSwitch} onChange={() => {
                setOpenConflictDetectionSwitch(!openConflictDetectionSwitch)
              }} />
            </Form.Item>
            <Form.Item
              style={{ minWidth: '50%' }}
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 6 }}
              initialValue=''
              label="关闭离线更新"
              name="closeOfflineUpdate"
            >
              <Switch checked={closeOfflineUpdate} onChange={() => {
                setCloseOfflineUpdate(!closeOfflineUpdate)
              }} />
            </Form.Item>
            <Form.Item
              style={{ minWidth: '50%' }}
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 6 }}
              initialValue=''
              label="接口鉴权"
              name="interfaceAuth"
            >
              <Switch checked={interfaceAuth} onChange={() => {
                setInterfaceAuth(!interfaceAuth)
              }} />
            </Form.Item>
            {/* <Form.Item
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 6 }}
              initialValue=''
              label="监控统计"
              name="openMonitor"
            >
              <Switch checked={openMonitor} onChange={() => {
                setOpenMonitor(!openMonitor)
              }} />
            </Form.Item> */}
          </div>
          <Form.Item
            initialValue=""
            label="应用黑名单"
            name="appBlackList"
          >
            <Input.TextArea rows={2} placeholder='默认关闭应用黑名单' />
          </Form.Item>
          <Form.Item
            initialValue=""
            label="权限配置"
            name="authConfig"
          >
            <Input.TextArea rows={4} placeholder='不同角色新建文件数量' />
          </Form.Item>
          <Form.Item
            initialValue={[]}
            label="基于模板新建"
            name="createBasedOnTemplate"
          >
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="请选择开启的应用"
              options={appOptions}
            />
          </Form.Item>
          <Form.Item
            initialValue={[]}
            label="启用文档助手"
            name="docHelperEnabledApps"
          >
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="请选择开启的应用"
              options={appOptions}
            />
          </Form.Item>
        </div>
      </Form>
      <div className={styles.btnGroups}>
        <Button
          size="middle"
          style={{ position: 'absolute', right: 0 }}
          type="primary"
          onClick={() => {
            form?.validateFields().then((values) => {
              console.log(values)
              typeof onSubmit === 'function' && onSubmit(values)
            })
          }}
        >
          保存
        </Button>
      </div>
    </div>
  )
}

export default GlobalForm