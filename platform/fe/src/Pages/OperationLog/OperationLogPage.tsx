import React, { FC, useEffect, useState } from "react";
import { Table, TableColumnsType, TablePaginationConfig } from "antd";
import dayjs from "dayjs";
import axios from "axios";

import css from "./OperationLogPage.less";

interface FetchDataItem {
  id: number;
  type: number;
  user_id: number;
  user_email: string;
  relation_token?: string;
  log_content?: string;
  create_time: number;
  userId: number;
  userName: string;
  userEmail: string;
}

interface DataItem extends FetchDataItem {
  logContent: {
    name?: string;
    namespace?: string;
    preVersion?: string;
    content?: string;
  };
}

const columns: TableColumnsType<DataItem> = [
  {
    title: '操作端',
    dataIndex: 'type',
    width: 120,
    fixed: 'left',
    render(_, item) {
      if (item.type === 10) {
        return '平台';
      } else if (item.type === 9 || item.type === 30) {
        return '应用(' + (item.logContent.name || item.logContent.namespace || '-') + ')';
      }

      return '-';
    },
  },
  {
    title: '操作类型',
    dataIndex: 'logContent.action',
    width: 120,
    render(_, item) {
      if (item.type === 10) {
        return '更新平台';
      } else if (item.type === 9) {
        return item.logContent.preVersion ? '更新应用' : '安装新应用';
      } else if (item.type === 30) {
        return '卸载应用';
      }

      return '-';
    },
  },
  {
    title: '更新内容',
    dataIndex: 'logContent.content',
    width: 300,
    render(_, item) {
      return item.logContent.content || '-';
    },
  },
  {
    title: '操作时间',
    dataIndex: 'createTime',
    width: 180,
    render(createTime) {
      return createTime ? dayjs(createTime).format('YYYY-MM-DD HH:mm:ss') : '-';
    },
  },
  {
    title: '操作者',
    dataIndex: 'userName',
    width: 120,
    fixed: 'right',
    render(userName) {
      return userName || '-';
    },
  },
];

const OperationLogPage: FC = () => {
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    position: ["bottomRight"],
    pageSize: 10,
    total: 0,
    current: 1
  });
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleFetchOperationLogData = async ({ current }: TablePaginationConfig) => {
    setLoading(true);

    const operationLogData = (await axios.post("/paas/api/log/operateLog/search", {
      pageNum: current,
      pageSize: pagination.pageSize
    })).data.data;

    setDataSource((operationLogData.list.map((item) => {
      return {
        type: item.type,
        logContent: JSON.parse(item.log_content || '{}'),
        createTime: item.create_time,
        userName: item.userName
      }
    })));
    setPagination((pagination) => {
      return {
        ...pagination,
        total: operationLogData.total,
        current: operationLogData.pageNum
      }
    });
    setLoading(false);
  }

  useEffect(() => {
    handleFetchOperationLogData(pagination);
  }, []);

  return (
    <div className={css.operationLogPage}>
      <Table
        size="middle"
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        onChange={handleFetchOperationLogData}
        scroll={{ x: 840 }} 
        locale={{
          emptyText: "暂无日志能容"
        }}
        pagination={pagination}
      />
    </div>
  )
}

export default OperationLogPage;
