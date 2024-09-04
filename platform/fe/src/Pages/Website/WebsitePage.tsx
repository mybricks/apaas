// TODO: Next
import React, {
  FC,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useContext,
} from 'react'

import axios from 'axios'
import moment from 'dayjs'
import {
  Col,
  Row,
  Descriptions,
  Badge,
  Table,
  Popover,
  Space,
  Modal,
  Input,
  message
} from 'antd'

import { useWorkspaceConetxt, useUserContext } from '@/context'
import { Icon } from '@/components/icon'

import { OperationLog } from './components'
import { LogsCard } from '@/components'

import { sseAppCommandExec } from '@/utils/sse'

import styles from './WebsitePage.less'

interface OsInfo {
  type: string
  release: string
}

interface OverviewModel {
  startAt: string
  os: OsInfo
  nodeVersion: string
  pm2Version: string
  pm2Name: string
  isPureIntranet: boolean
}

interface AppsStatus {}
type AppsStatusList = AppsStatus[]

interface ServerException {}
type ServerExceptionList = ServerException[]

interface WebsiteContext {
  overview: OverviewModel
  appsStatus: AppsStatusList
  exceptions: ServerExceptionList
}

const WebsiteContext = React.createContext<WebsiteContext>({} as WebsiteContext)

export default () => {
  const { user } = useUserContext()

  const [overviewState, setOverviewState] = useState<OverviewModel>({
    startAt: '未知',
    os: {} as OsInfo,
    nodeVersion: '未知',
    pm2Version: '未知',
    pm2Name: '未知',
    isPureIntranet: false,
  })
  const [overviewLoading, setOverviewLoading] = useState(false)

  const fetchOverview = useCallback(() => {
    setOverviewLoading(true)
    axios({
      method: 'get',
      url: '/paas/api/system/monitor/overview',
    })
      .then(({ data }) => {
        if (data.code === 1) {
          setOverviewState(data.data)
        }
      })
      .finally(() => {
        setOverviewLoading(true)
      })
  }, [])

  const [appsStatusState, setAppsStatusState] = useState([])
  const [appsStatusLoading, setAppsStatusLoading] = useState(false)

  const fetchAppsStatus = useCallback(() => {
    setAppsStatusLoading(true)
    axios({
      method: 'get',
      url: '/paas/api/system/monitor/apps',
    })
      .then(({ data }) => {
        if (data.code === 1) {
          setAppsStatusState(data.data)
        }
      })
      .finally(() => {
        setAppsStatusLoading(true)
      })
  }, [])

  const [exceptionsState, setExceptionsState] = useState([])
  const [exceptionsLoading, setExceptionsLoading] = useState(false)

  const fetchExceptions = useCallback(() => {
    setExceptionsLoading(true)
    axios({
      method: 'get',
      url: '/paas/api/system/monitor/diagnostics',
    })
      .then(({ data }) => {
        if (data.code === 1) {
          setExceptionsState(data.data)
        }
      })
      .finally(() => {
        setExceptionsLoading(true)
      })
  }, [])

  useEffect(() => {
    fetchOverview()
    fetchAppsStatus()
    fetchExceptions()
  }, [])

  return (
    <WebsiteContext.Provider
      value={{
        overview: overviewState,
        appsStatus: appsStatusState,
        exceptions: exceptionsState,
      }}
    >
      <div className={styles.view}>
        <Row gutter={12}>
          <Col flex="7">
            <CardEnvironment />
          </Col>
          <Col flex="4">
            <CardSystem />
          </Col>
        </Row>
        <Row gutter={12} style={{ marginTop: 12 }}>
          <Col flex={'auto'}>
            <CardHelathy />
          </Col>
        </Row>
        <Row gutter={12} style={{ marginTop: 12 }}>
          <Col flex={'auto'}>
            <CardApps />
          </Col>
        </Row>
        <Row gutter={12} style={{ marginTop: 12 }}>
          <Col flex={'auto'}>
            <CardAppOperations />
          </Col>
        </Row>
      </div>
    </WebsiteContext.Provider>
  )
}

function CardEnvironment() {
  const { overview } = useContext(WebsiteContext)
  return (
    <Card title="平台环境">
      <Descriptions>
        {/* <Descriptions.Item label="中心化服务">
          不可访问
          <Badge style={{ marginLeft: 6 }} status="processing" />
        </Descriptions.Item> */}
        <Descriptions.Item label="离线模式">
          {overview.isPureIntranet ? '已开启' : '未开启'}
        </Descriptions.Item>
        <Descriptions.Item label="Node 版本">
          {overview.nodeVersion}
        </Descriptions.Item>
        <Descriptions.Item label="PM2 版本">
          {overview.pm2Version}
        </Descriptions.Item>
        <Descriptions.Item label="服务启动于">
          {overview.startAt}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}

function CardSystem() {
  const { overview } = useContext(WebsiteContext)
  return (
    <Card title="操作系统">
      <Descriptions>
        <Descriptions.Item label="类型">{overview?.os?.type}</Descriptions.Item>
        <Descriptions.Item label="发行版本">
          {overview?.os?.release}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}

function CardHelathy() {
  const { exceptions } = useContext(WebsiteContext)
  return (
    <Card title="健康检测">
      <Table
        columns={[
          {
            title: '检测项',
            width: 280,
            dataIndex: 'title',
          },
          {
            title: '结果',
            dataIndex: 'level',
            width: 100,
            render: (value) => {
              if (value === 'success') {
                return (
                  <>
                    <span>正常</span>
                    <Badge style={{ marginLeft: 8 }} status={'success'} />
                  </>
                )
              }
              if (value === 'warn') {
                return (
                  <>
                    <span>警告</span>
                    <Badge style={{ marginLeft: 8 }} status={'warning'} />
                  </>
                )
              }
              if (value === 'error') {
                return (
                  <>
                    <span>严重异常</span>
                    <Badge style={{ marginLeft: 8 }} status={'error'} />
                  </>
                )
              }

              return '未知'
            },
          },
          {
            title: '详情',
            dataIndex: 'error',
            width: 300,
            render: (value) => {
              return <LongTextRender text={value}></LongTextRender>
            },
          },
          {
            title: '修复建议',
            dataIndex: 'fix',
          },
        ]}
        dataSource={exceptions}
        size="small"
        pagination={false}
        locale={{ emptyText: '当前系统运行一切正常' }}
      />
    </Card>
  )
}

function CardApps() {
  const { appsStatus } = useContext(WebsiteContext)

  const [logOpen, setLogOpen] = useState(false)
  const [logs, setLogs] = useState([])

  const appCommandExec = useCallback((namespace, command) => {
    setLogOpen(true)
    sseAppCommandExec(
      {
        command,
        namespace,
      },
      {
        onMessage: (msg) => {
          setLogs((c) => c.concat(msg))
        },
        onError: (msg) => {
          setLogs(c => c.concat(msg))
        },
      }
    )
  }, [])

  const handleTerminal = useCallback(({ namespace, title }) => {
    const valueRef = {
      command: 'npm i --registry=https://registry.npmmirror.com --production'
    }

    const ref = Modal.confirm({
      title: '请阅读提示！！！',
      content: (
        <>
          <p>
            此操作将会在应用<strong>「{title}」</strong>环境执行 <strong>下方命令</strong>，
            <span style={{ color: 'red' }}>
              请确保您已知晓当前操作的原理以及可能会造成的后果！！！
            </span>
          </p>
          <Input defaultValue={valueRef.command} onChange={e => valueRef.command = e.target.value} />
        </>
      ),
      okText: '确认，开始操作',
      width: 600,
      onOk: () => {
        if (!valueRef.command) {
          return message.warning('请先填写命令')
        }
        ref.destroy()
        appCommandExec(namespace, valueRef.command)
      },
    })
  }, [])

  return (
    <Card title="应用状态">
      <Modal
        title="操作日志"
        open={logOpen}
        destroyOnClose
        onCancel={() => {setLogOpen(false);setLogs([])}}
        footer={null}
        width={'calc(100vw - 200px)'}
      >
        <LogsCard height={'calc(100vh - 306px)'} value={logs.join('\n')} />
      </Modal>
      <Table
        columns={[
          {
            title: '名称',
            dataIndex: 'title',
          },
          {
            title: '信息',
            dataIndex: 'namespace',
            render: (_, row) => {
              return `${row?.namespace}@${row.version}`
            },
          },
          {
            title: '前端模块',
            dataIndex: 'fe',
            render: (value) => {
              return (
                <StatusText
                  text={!!value?.status ? '加载成功' : '加载失败'}
                  status={!!value?.status}
                />
              )
            },
          },
          {
            title: '服务端模块',
            dataIndex: 'server',
            render: (value) => {
              return (
                <StatusText
                  text={!!value?.status ? '加载成功' : '加载失败'}
                  status={!!value?.status}
                />
              )
            },
          },
          {
            title: '类型',
            dataIndex: 'isSystem',
            render: (value) => {
              return value ? '系统应用' : '功能应用'
            },
          },
          {
            title: '操作',
            dataIndex: 'action',
            render: (_, record) => (
              <Space size="middle">
                <a style={{ fontSize: 12 }} onClick={() => handleTerminal(record)}>命令行</a>
                <a></a>
              </Space>
            ),
          },
        ]}
        dataSource={appsStatus}
        size="small"
        pagination={false}
        locale={{ emptyText: '暂无数据' }}
        // summary={() => `当前平台共计安装应用 ${appsStatus.length} 个`}
      />
    </Card>
  )
}

function CardAppOperations() {
  return (
    <Card title="应用操作日志">
      <OperationLog />
    </Card>
  )
}

interface CardProps {
  title: string
  meta?: React.ReactElement
  children?: any
}

function Card({ title, meta, children }: CardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <div className={styles.meta}>{meta}</div>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  )
}

function StatusText({ text, status }) {
  return (
    <div className={styles.status}>
      {text}
      <Badge
        style={{ marginLeft: 8 }}
        status={!!status ? 'success' : 'error'}
      />
    </div>
  )
}

function LongTextRender({ text }) {
  return (
    <div className={styles.longText}>
      <Popover title={'错误详情'} content={text}>
        {text}
      </Popover>
    </div>
  )
}
