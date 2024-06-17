import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Form, Select, Input, Button, message } from 'antd'
import CompileWorkflow from './formItems/compile-workflow'

// @ts-ignore
import styles from './index.less'

export interface SettingItem {
  /** 表单项名称 */
  title: string
  /** 表单项对应的key */
  id: string
  /** 表单项类型 */
  type: 'compileWorkflows' | 'input' | 'select'
  required?: boolean,
  /** 表单项组件对应的props */
  props?: any
}

interface SchemaSettingProps {
  initialValues?: any,
  schema?: SettingItem[],
  onSubmit?: (any) => void
  style: CSSProperties,
}

export default ({ initialValues, schema = [], onSubmit, style }: SchemaSettingProps) => {
  const [form] = Form.useForm()
  const subForms = useRef([])

  const handleSubmit = useCallback(() => {
    ;(async() => {
      const values = await form?.validateFields();
      await Promise.all(subForms.current.map(subForm => subForm?.validateFields?.()))
      onSubmit?.(values)
    })().catch(e => {
      // message.error(e?.message || e.msg || '提交失败')
      console.warn(e)
    })
  }, [onSubmit])

  return (
    <div className={styles.schemaSetting} style={style}>
      <Form
        form={form}
        // labelCol={{ span: 4 }}
        // wrapperCol={{ span: 20 }}
        initialValues={initialValues}
        layout="vertical"
        labelAlign="left"
        autoComplete="off"
        className={styles.form}
      >
        {
          schema.map(setting => {
            switch (true) {
              case setting.type === 'compileWorkflows': {
                return (
                  <Form.Item
                    label={setting.title}
                    name={setting.id}
                    required={setting.required}
                    rules={setting.required ? [{ required: true, message: `请设置${setting.title}` }] : []}
                  >
                    <CompileWorkflow {...(setting?.props ?? {})} onInit={(_form) => {
                      subForms.current.push(_form)
                    }} />
                  </Form.Item>
                )
              }
              case setting.type === 'input': {
                return (
                  <Form.Item
                    label={setting.title}
                    name={setting.id}
                    required={setting.required}
                    rules={setting.required ? [{ required: true, message: `请设置${setting.title}` }] : []}
                  >
                    <Input {...(setting?.props ?? {})} />
                  </Form.Item>
                )
              }
              case setting.type === 'select': {
                return (
                  <Form.Item
                    label={setting.title}
                    name={setting.id}
                    required={setting.required}
                    rules={setting.required ? [{ required: true, message: `请设置${setting.title}` }] : []}
                  >
                    <Select {...(setting?.props ?? {})} />
                  </Form.Item>
                )
              }
            }            
          })
        }
      </Form>
      <div className={styles.btnGroups}>
        <Button
          size="middle"
          type="primary"
          onClick={handleSubmit}
        >
          保存
        </Button>
      </div>
    </div>
  )
}
