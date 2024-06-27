import React, { useEffect } from 'react'
import { Button, Form, Input, Select, Switch } from 'antd'
import styles from '../index.less'

const OssForm = ({ initialValues, onSubmit, style }) => {
  const [form] = Form.useForm()

  const openOss = Form.useWatch('openOss', form);

  useEffect(() => {
    if (!initialValues) {
      return
    }
    form?.setFieldsValue?.({
      ...initialValues
    })
  }, [initialValues])

  return (
    <div className={styles.globalForm} style={style}>
      <Form
        form={form}
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 19 }}
        labelAlign="top"
        autoComplete="off"
      >
        <Form.Item
          initialValue=""
          label="开启OSS上传"
          name="openOss"
          extra={<p style={{ fontSize: 13 }}>开启后<span style={{ color: '#222222', fontWeight: 500 }}> 搭建时的静态资源（比如图片、文件等）</span>将会上传到OSS系统中，<span style={{ color: '#faad14', fontWeight: 500 }}>请务必保证配置正确！</span></p>}
        >
          <Switch checked={openOss} />
        </Form.Item>
        {
          openOss && (
            <>
            <Form.Item
              initialValue="aliyun"
              label="平台"
              name="platform"
              required
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  {
                    value: 'aliyun',
                    label: '阿里云',
                  },
                ]}
              />
            </Form.Item>
              <Form.Item
                initialValue=""
                label="accessKeyId"
                name="accessKeyId"
                rules={[{ required: true }]}
              >
                <Input placeholder='' />
              </Form.Item>
              <Form.Item
                initialValue=""
                label="accessKeySecret"
                name="accessKeySecret"
                rules={[{ required: true }]}
              >
                <Input placeholder='' />
              </Form.Item>
              <Form.Item
                initialValue=""
                label="地域 (Region Id)"
                name="region"
                rules={[{ required: true }]}
              >
                <Input placeholder='' />
              </Form.Item>
              <Form.Item
                initialValue=""
                label="存储空间 (Bucket)"
                name="bucket"
                rules={[{ required: true }]}
              >
                <Input placeholder='' />
              </Form.Item>
              <Form.Item
                initialValue=""
                label="CDN域名"
                name="cdnDomain"
              >
                <Input placeholder='' />
              </Form.Item>
            </>
          )
        }
      </Form>
      <div className={styles.btnGroups}>
        <Button
          size="middle"
          style={{ position: 'absolute', right: 0 }}
          type="primary"
          onClick={() => {
            form?.validateFields().then((values) => {
              typeof onSubmit === 'function' && onSubmit({
                ...(values ?? {})
              })
            })
          }}
        >
          保存
        </Button>
      </div>
    </div>
  )
}

export default OssForm