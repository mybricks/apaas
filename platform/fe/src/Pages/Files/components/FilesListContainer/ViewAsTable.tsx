import React, { FC, useMemo, useCallback } from "react";
import { Table } from "antd";

import { User, FileData } from "@/types";
import { useWorkspaceConetxt } from "@/context";
import { Icon } from "@/components/icon";
import { unifiedTime } from "@/utils/time";
import { RenderOperate } from "./ViewAsGrid";
import FileLink from "../FileLink";
import { Handle } from "./FilesListContainer";

import css from "./ViewAsTable.less";

interface ViewAsTableProps {
  files: FileData[];
  user: User;
  loading: boolean;
  roleDescription: number;
  handle: Handle;
}

const ViewAsTable: FC<ViewAsTableProps> = ({
  user: { id: userId },
  loading,
  files,
  handle,
  roleDescription
}) => {
  const { apps: { getApp } } = useWorkspaceConetxt();
  const columns = useMemo(() => {
    return [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        ellipsis: {
          showTitle: false,
        },
        render: (name, record) => {
          const app = getApp(record.extName)
          return (
            <FileLink app={app} file={record}>
              <div className={css.tableName}>
                <div className={css.tableNameIcon}>
                  <Icon icon={app.icon}/>
                </div>
                {name}
              </div>
            </FileLink>
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
          operate={handle}
          size={24}
          iconSize={14}
          />
        }
      }
    ]
  }, []);

  const dataSource = useCallback(() => {
    return files.concat()
  }, [files])

  return (
    <Table
      loading={loading}
      columns={columns}
      dataSource={dataSource()}
      size='small'
      pagination={false}
      locale={{
        emptyText: '内容为空'
      }}
    />
  )
}

export default ViewAsTable;
