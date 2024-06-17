import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {Button, message, Modal, Card, Switch, Form, Select} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

import { FileService, VersionService } from './services'

import styles from './compile-workflow.less'

const simpleCopyObject = (target) => {
  let res = {}
  try {
    res = JSON.parse(JSON.stringify(target ?? {}))
  } catch (error) {
    res = {}
  }
  return res
}

const _NAME_ = '_env_'

export default ({ value, onChange, onInit }) => {
  const [form] = Form.useForm()
  const [files, setFiles] = useState([])
  const [versionMap, setVersionMap] = useState({})

  const [formValues, setFormValues] = useState({})

  useEffect(() => {
    onInit?.(form)
  }, [])

  useEffect(() => {
    FileService.getSysTemFiles({ extName: 'workflow' }).then((files) => {
      setFiles(files)
    })
  }, [])

  const getVersionByFileId = useCallback((fileId) => {
    if (!fileId) {
      return
    }
    VersionService.getPublishVersions({ fileId }).then((files) => {
      setVersionMap((c) => ({
        ...c,
        [fileId]: files.map((version) => {
          let taskName = ''
          try {
            taskName = JSON.parse(version?.fileContentInfo?.content).taskName
          } catch (error) {}
          return {
            ...version,
            taskName,
          }
        }),
      }))
    })
  }, [])

  const openTask = useCallback((fileId) => {
    window.open(`/mybricks-app-workflow/index.html?id=${fileId}`)
  }, [])

  const taskValidator = useCallback(async (rule, value) => {
    if (!value) {
      throw new Error('请选择任务')
    }
  }, [])

  const handleChange = useCallback(
    (values) => {
      const newVals = simpleCopyObject(values)
      if (newVals?.[_NAME_]) {
        const oldArray = JSON.parse(JSON.stringify(newVals[_NAME_]))
        delete newVals[_NAME_]
        oldArray.forEach((env, index) => {
          const { name, ...others } = env
          newVals[encodeURI(name)] = { ...others, index }
        })
      }
      onChange?.(newVals)
    },
    [onChange]
  )

  const envList = Form.useWatch(_NAME_, form) || []

  const initialValues = useMemo(() => {
    const newValues = Object.keys(value ?? {}).map((keyName) => {
      return {
        name: decodeURI(keyName),
        ...(value?.[keyName] ?? {}),
      }
    })
    return { [_NAME_]: newValues }
  }, [value])

  return (
    <Form form={form} initialValues={initialValues}>
      <Form.List name={_NAME_}>
        {(fields, { add, remove }) => (
          <div className={styles.envs}>
            {fields.map((field) => (
              <Card
                className={styles.envCard}
                key={field.key}
                actions={[
                  <div
                    key="edit"
                    onClick={() => {
                      if (!envList[field.name]?.fileId) {
                        message.warn('请先选择任务')
                        return
                      }
                      openTask(envList[field.name]?.fileId)
                    }}
                  >
                    <EditOutlined />
                    <span style={{ marginLeft: 5 }}>编排任务</span>
                  </div>,
                  <div
                    key="delete"
                    onClick={() => {
                      Modal.confirm({
                        title: `删除`,
                        content:
                          '删除任务后搭建应用将无法发布到此环境，请谨慎操作!',
                        okText: '我已知晓，确认删除',
                        cancelText: '取消',
                        onOk: () => {
                          remove(field.name);

                          setTimeout(() => {
                            handleChange(form.getFieldsValue())
                          }, 0)
                        },
                        mask: false,
                        className: 'fangzhou-theme',
                      })
                    }}
                  >
                    <DeleteOutlined />
                    <span style={{ marginLeft: 5 }}>删除</span>
                  </div>,
                ]}
              >
                <div className={styles.title}>
                  任务名称：{envList?.[field.name]?.name || '暂无'}
                  <div className={styles.desc}>
                    任务名称将会显示在发布按钮和发布记录中
                  </div>
                </div>
                <Form.Item
                  {...field}
                  label="任务"
                  name={[field.name, 'fileId']}
                  style={{ marginTop: 10 }}
                  required
                  rules={[{ validator: taskValidator }]}
                >
                  <Select
                    showSearch
                    filterOption={(input = '', option) => {
                      const _label = (
                        typeof option?.label === 'string' ? option?.label : ''
                      ).toLowerCase()
                      const _value = (
                        typeof option?.value === 'string' ? option?.value : ''
                      ).toLowerCase()
                      const _input = input.toLowerCase()
                      return _label.includes(_input) || _value.includes(_input)
                    }}
                    options={files.map((file) => ({
                      label: file?.name,
                      value: file?.id,
                    }))}
                    onChange={(fileId) => {
                      form.setFieldValue([_NAME_, field.name, 'version'], '')
                      form.setFieldValue([_NAME_, field.name, 'name'], '')

                      handleChange(form.getFieldsValue())
                    }}
                  ></Select>
                </Form.Item>
                <Form.Item
                  {...field}
                  label="版本"
                  name={[field.name, 'version']}
                  rules={[{ required: true, message: '请选择版本' }]}
                >
                  <Select
                    onChange={(_, opt) => {
                      form.setFieldValue(
                        [_NAME_, field.name, 'name'],
                        opt?.taskName
                      )

                      handleChange(form.getFieldsValue())
                    }}
                    onFocus={() => {
                      getVersionByFileId(envList[field.name]?.fileId)
                    }}
                    notFoundContent={
                      '当前任务无发布版本，请先点击下方编排按钮去发布'
                    }
                  >
                    {versionMap?.[envList?.[field.name]?.fileId]?.map(
                      (version) => {
                        const newArr = [...(envList || [])]
                        newArr.splice(field.name)
                        const hasRepeatName = (newArr || []).some(
                          (item) => item.name === version.taskName
                        )

                        return (
                          <Select.Option
                            taskName={version.taskName}
                            title={version?.version}
                            value={version?.version}
                            disabled={!!!version.taskName || hasRepeatName}
                          >
                            <div className={styles.versionOpt}>
                              {version?.version}
                              <span>
                                {!!!version.taskName
                                  ? '未配置任务名称，无效版本'
                                  : hasRepeatName
                                  ? '任务名称重复，不可选择'
                                  : ''}
                              </span>
                            </div>
                          </Select.Option>
                        )
                      }
                    )}
                  </Select>
                </Form.Item>
	              <Form.Item
		              {...field}
		              className={styles.moduleForm}
		              valuePropName="checked"
		              label="标识为模块任务"
		              name={[field.name, 'isModule']}
	              >
		              <Switch onChange={(value) => {
			              form.setFieldValue([_NAME_, field.name, 'isModule'], value);
			
			              handleChange(form.getFieldsValue())
		              }} />
	              </Form.Item>
              </Card>
            ))}
            <div className={styles.addCard}>
              <Button
                type="dashed"
                onClick={() => {
                  add?.({})
                  setTimeout(() => {
                    form.validateFields()
                  }, 0)
                }}
                icon={<PlusOutlined />}
              >
                {`新增任务`}
              </Button>
            </div>
          </div>
        )}
      </Form.List>
    </Form>
  )
}
