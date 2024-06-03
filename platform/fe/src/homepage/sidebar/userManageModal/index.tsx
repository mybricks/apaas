import React, { useEffect, useState } from 'react';
import { Select, Form, Input, Button, Table, Col, Row, Pagination, Modal, message } from 'antd';
import axios from 'axios';
import {getApiUrl} from '../../../utils'
const Option = Select.Option;

const ROLE_MAP = {
  '全部': -1,
  '游客': 1,
  '普通用户': 2,
  '普通(项目)': 3,
  '超管': 10
}
const ROLE_CODE_HANS_MAP = {
  1: '游客',
  2: '普通用户',
  3: '普通(项目)',
  10: '超管'
}

export default function UserManageModal({ user }) {
  const [formValues, setFormValue] = useState({})
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [total, setTotal] = useState(0)
  const [tableData, setTableData] = useState([])
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span>{text || '-'}</span>,
    },
    {
      title: 'email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (_, record) => {
        return <span>{ROLE_CODE_HANS_MAP[record.role]}</span>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center',
      render: (_, record) => {
        return (
          <div
            style={{display: 'flex', justifyContent: 'space-around'}}
            onClick={(e) => {
              // @ts-ignore
              let role = e.target?.parentElement?.dataset?.role
              axios.post(getApiUrl('/paas/api/user/setUserRole'), {
                role,
                userId: record.id,
                updatorId: user.id
              }).then(({data}) => {
                if(data.code === 1) {
                  message.success('设置成功')
                  _getData({
                    ...formValues,
                    ...pagination,
                  })
                } else {
                  message.info(data.msg)
                }
              }).catch((e) => {
                console.log(e)
              })
            }}
          >
            {Object.keys(ROLE_MAP)?.map((key) => {
              if(key !== '全部') {
                return (
                  <Button
                    type="link"
                    disabled={record.role === ROLE_MAP[key]}
                    data-role={ROLE_MAP[key]}
                  >{key}</Button>
                )
              }
            })}
          </div>
        )
      },
    },
  ];

  const _getData = async (param = {}) => {
    return new Promise((resolve, reject) => {
      axios.post(getApiUrl('/paas/api/user/queryByRoleAndName'), param).then(({data}) => {
        if(data.code === 1) {
          setTableData(data.data.list || [])
          setPagination(data.data.pagination)
          setTotal(data.data.total)
          resolve(true)
        }
      }).catch((e) => {
        reject(e.message)
      })
    })
  }

  useEffect(() => {
    _getData({
      ...formValues,
      ...pagination,
    })
  }, [])

  return (
    <div>
      <Form
        style={{  }}
        initialValues={formValues}
        onFieldsChange={(_) => {
          let item = _?.[0];
          switch(item?.name?.[0]) {
            case 'email': {
              setFormValue({...formValues, email: item.value})
              break
            }
            case 'role': {
              setFormValue({...formValues, role: item.value})
              break
            }
          }
        }}
        onFinish={(values) => {
          let newParam: any = {
            page: 1,
            pageSize: 10
          }
          if(values?.email) {
            newParam.email = values.email
          }
          if(values?.role) {
            if(values?.role !== ROLE_MAP.全部) {
              newParam.role = values.role
            }
          }
          setPagination({ page: 1, pageSize: 10 })
          setFormValue(newParam)
          _getData(newParam)
        }}
        autoComplete="off"
      >
        <Row justify={'space-around'}>
          <Col span={7} offset={1} key={1}>
            <Form.Item
              label="邮箱"
              name="email"
            >
              <Input allowClear={true}  />
            </Form.Item>
          </Col>
          <Col span={7} offset={1} key={2}>
            <Form.Item
              name="role"
              label="权限"
            >
              <Select
                placeholder="请选择"
                allowClear
              >
                <Option value={ROLE_MAP.全部}>全部</Option>
                <Option value={ROLE_MAP.游客}>游客</Option>
                <Option value={ROLE_MAP.普通用户}>普通用户</Option>
                <Option value={ROLE_MAP.超管}>超管</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={7} offset={1} key={3}>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <Table
        columns={columns}
        dataSource={tableData}
        onChange={(_pagination) => {
          setPagination({...pagination, page: _pagination.current})
          _getData({
            page: _pagination.current
          })
        }}
        pagination={{ position: ['bottomRight'], total: total, current: pagination.page, pageSize: pagination.pageSize }}
      />
    </div>
  )
}