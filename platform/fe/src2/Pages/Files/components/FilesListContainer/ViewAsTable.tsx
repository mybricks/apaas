import React, { FC, useCallback } from "react";
import { Table } from "antd";

import { Files } from "../..";
import { User } from "@/types";
import { useWorkspaceConetxt } from "@/context";
import { Icon } from "@/components/icon";
import { unifiedTime } from "@/utils/time";
import { RenderOperate } from "./ViewAsGrid";

import css from "./ViewAsTable.less";

interface ViewAsTableProps {
  files: Files;
  user: User;
  loading: boolean;
  roleDescription: number;
}

const ViewAsTable: FC<ViewAsTableProps> = ({
  user: { id: userId },
  loading,
  files,
  roleDescription
}) => {
  const { apps: { getApp } } = useWorkspaceConetxt();
  const columns = useCallback(() => {

    return [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        ellipsis: {
          showTitle: false,
        },
        render: (name, record) => {
          return (
            <div className={css.tableName} onClick={() => {
              console.log("打开")
              // operate('open', { project: record })
            }}>
              <div className={css.tableNameIcon}>
                <Icon icon={getApp(record.extName).icon}/>
              </div>
              {name}
            </div>
          )
        }
      },
      {
        title: '创建人',
        dataIndex: 'creatorName',
        key: 'creatorName',
        ellipsis: {
          showTitle: false,
        },
      },
      {
        title: '更新时间',
        dataIndex: '_updateTime',
        key: '_updateTime',
        width: 140,
        render: (time) => {
          return unifiedTime(time)
        }
      },
      {
        dataIndex: 'action',
        key: 'action',
        width: 60,
        render: (_, record) => {
          const showOperate = (record.creatorId == userId) || [1, 2].includes(roleDescription)
          return showOperate && <RenderOperate
          project={record}
          operate={() => {
            console.log("实现各种操作");
          }}
          size={24}
          iconSize={14}
          />
        }
      }
    ]
  }, [])

  return (
    <div>
        <Table
          loading={loading}
          columns={columns()}
          dataSource={files}
          size='small'
          pagination={false}
          locale={{
            emptyText: '暂无内容，请添加...'
          }}
        />
      </div>
  )
  return (
    <div>
      格子
    </div>
  )
}

export default ViewAsTable;
