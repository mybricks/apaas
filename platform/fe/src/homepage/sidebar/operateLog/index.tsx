import React, {FC, useCallback, useEffect, useMemo, useState} from 'react';
import { Table, message } from 'antd';
import moment from 'moment';
import axios from 'axios';

import style from './index.less';

const OperateLog: FC = () => {
  const PAGE_SIZE = 10;
  const [pageNum, setPageNum] = useState(1);
  const [total, setTotal] = useState(null);
  const [dataSource, setDataSource] = useState([]);
  const columns = useMemo(() => {
    return [
      {
        title: '操作端',
        dataIndex: 'type',
        width: 120,
        fixed: 'left',
        render(_, item) {
          if (item.type === 10) {
            return '平台';
          } else if (item.type === 9 || item.type === 30) {
            return '应用(' + (item.logContent?.name || item.logContent?.namespace || '-') + ')';
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
            return item.logContent?.preVersion ? '更新应用' : '安装新应用';
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
          return item.logContent?.content || '-';
        },
      },
      {
        title: '操作时间',
        dataIndex: 'createTime',
        width: 180,
        render(createTime) {
          return createTime ? moment(createTime).format('YYYY-MM-DD HH:mm:ss') : '-';
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
  }, []);

  const _getData = useCallback((params: { pageNum: number }) => {
    axios
      .post(
        '/paas/api/log/operateLog/search', 
        { pageNum: params.pageNum, pageSize: PAGE_SIZE } )
      .then(({ data }) => {
        if(data.code === 1) {
          const formatData = data.data?.list?.map((i) => {
            const logContent = JSON.parse(i.log_content || '{}')
            return {
              type: i.type,
              logContent: logContent,
              createTime: i.create_time,
              userName: i.userName
            }
          })
          setPageNum(params.pageNum);
          setDataSource(formatData);
          setTotal(data.data.total);
        } else {
          message.warning(data.msg || '获取失败')
        }
      }).catch((e) => {
        console.log(e)
        message.error(e.message || '获取失败')
      })
  }, []);

  useEffect(() => {
    _getData({ pageNum: 1 })
  }, []);
  return (
    <div className={style.operateLogModal}>
      <Table 
        columns={columns as any}
        scroll={{ x: 1000 }}
        dataSource={dataSource}
        onChange={(_pagination) => {
          _getData({
            pageNum: _pagination.current
          })
        }}
        pagination={{
          position: ['bottomRight'],
          total: total, 
          current: pageNum, 
          pageSize: PAGE_SIZE
        }}
      />
    </div>
  );
};

export default OperateLog;