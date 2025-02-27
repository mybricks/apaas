import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Select, Input, Checkbox, Form } from 'antd'
import css from './index.less'

const { Search } = Input

export default ({ onQuery, defaultValues, blackList = [] }) => {
  const [form] = Form.useForm()

  const getQueryParams = useCallback(() => {
    const values = { ...form.getFieldsValue() }
    if (!!values.createByMine) {
      values.scopeStatus = -1
      delete values.createByMine
    }
    return values
  }, [])

  const onSearch = useCallback(() => {
    onQuery?.(getQueryParams())
  }, [onQuery, form])

  useMemo(() => {
    onQuery?.(defaultValues)
  }, [])

  return (
    <div className={css.filters}>
      <Form layout="inline" form={form} initialValues={defaultValues}>
        {blackList.includes('type') ? null : (
          <Form.Item name="type">
            <Select
              style={{ width: 120 }}
              options={[
                { value: 'com_lib', label: '组件库' },
                { value: 'component', label: '组件' },
                { value: 'picture', label: '素材' },
                { value: 'theme', label: '主题包' },
              ]}
              onChange={onSearch}
            />
          </Form.Item>
        )}
        <Form.Item name="keyword">
          <Search
            placeholder="搜索物料名称、标题"
            onSearch={onSearch}
            style={{ width: 360 }}
          />
        </Form.Item>
        {blackList.includes('createByMine') ? null : (
          <Form.Item
            name="createByMine"
            valuePropName="checked"
            style={{ position: 'absolute', right: 0 }}
          >
            <Checkbox onChange={onSearch}>我发布的</Checkbox>
          </Form.Item>
        )}
      </Form>
    </div>
  )
}
