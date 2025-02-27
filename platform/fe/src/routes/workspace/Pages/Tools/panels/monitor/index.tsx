import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Select, message, Statistic, Table } from 'antd'
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

import css from './index.less'

const Block = ({ title, children }) => {
  return (
    <>
      <div className={css.title}>{title}</div>
      {children}
    </>
  )
}

export default () => {
  const [activeState, setActiveState] = useState({
    activeIn5: 0,
    activeIn60: 0,
    activeAll: 0,
    activeFileList: [],
    topOnlineUsers: [],
  })

  const [userInfoMap, setUserInfoMap] = useState({})

  useEffect(() => {
    axios
      .get('/paas/api/analyse/onlineUsers')
      .then(({ data }) => {
        if (data.code === 1 && data?.data) {
          let activeInfo = {
            activeIn5: 0,
            activeIn60: 0,
            activeAll: 0,
            activeFileList: [],
            topOnlineUsers: [],
          }
          data.data?.activeUsers.forEach((row) => {
            if (!row?.lastActiveAt) {
              return
            }
            if (Date.now() - row.lastActiveAt <= 5 * 60 * 1000) {
              activeInfo.activeIn5 += 1
            }
            if (Date.now() - row.lastActiveAt <= 60 * 60 * 1000) {
              activeInfo.activeIn60 += 1
            }
            activeInfo.activeAll += 1
          })

          activeInfo.activeFileList = data.data.activeFiles
          activeInfo.topOnlineUsers = data.data.topOnlineUsers.filter(t => t.accOnlineTime > 30 * 1000) // 小于30秒不显示

          setActiveState(activeInfo)

          setUserInfoMap(data.data.userInfoMap ?? {})
        } else {
          message.info(data.msg || '获取数据失败')
        }
      })
      .catch((e) => {
        console.error(e)
        message.error(e.message || '获取数据失败')
      })
  }, [])

  const fileList = useMemo(() => {
    return activeState.activeFileList ?? []
  }, [activeState.activeFileList])

  const getUserName = useCallback((userId) => {
    const curUser = userInfoMap?.[userId] ?? {};
    if (curUser.email && curUser.email !== '' && curUser.name) {
      return `${curUser.email}(${curUser.name})`
    }
    return curUser.email && curUser.email !== '' ? curUser.email : curUser.name
  }, [userInfoMap])

  return (
    <div className={css.monitor}>
      <Block title={'活跃用户数'}>
        <div className={css.content}>
          <Statistic
            title="当日活跃用户总数"
            value={activeState.activeAll ?? 0}
          />
          <Statistic
            title="5分钟内活跃用户数"
            value={activeState.activeIn5 ?? 0}
          />
          <Statistic
            title="一小时内活跃用户数"
            value={activeState.activeIn60 ?? 0}
          />
        </div>
      </Block>

      <Block title={'用户在线时长'}>
        <div className={css.content}>
          <div className={css.list}>
            {Array.isArray(activeState.topOnlineUsers) &&
              activeState.topOnlineUsers.map((item, index) => {
                return (
                  <div className={css.card} key={item.fileId}>
                    <div>
                      <span
                        className={css.col_idx}
                      >
                         {index + 1}
                      </span>
                      <span
                        className={css.col_userName}
                      >
                         用户 {getUserName(item.userId)}
                      </span>
                      <span className={css.col_desc}>
                        当日总计在线时长为<strong>{formatMilliseconds(item.accOnlineTime)}</strong>
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </Block>

      <Block title={'最近被访问的文件'}>
        <div className={css.content} style={{ overflow: 'hidden' }}>
          <div className={css.list}>
            {Array.isArray(fileList) &&
              fileList.map((item) => {
                return (
                  <div className={css.card} key={item.userId}>
                    <div>
                      <a
                        className={css.col_file}
                        href={item.lastActiveReferer}
                        target="_blank"
                      >
                        文件 {item.fileId}
                      </a>
                      <span className={css.col_desc}>
                        用户 {getUserName(item.userId)} 于{' '}
                        {dayjs(item.lastActiveAt).format('HH:mm:ss')} 访问页面
                      </span>
                    </div>
                    <a
                      key="list-loadmore-edit"
                      href={item.lastActiveReferer}
                      target="_blank"
                    >
                      查看页面
                    </a>
                  </div>
                )
              })}
          </div>
        </div>
      </Block>
    </div>
  )
}

function formatMilliseconds(ms) {
  const duration = dayjs.duration(ms);
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  let formattedTime = '';
  if (days > 0) {
    formattedTime += `${days}天`;
  }
  if (hours > 0) {
    formattedTime += `${hours}小时`;
  }
  if (minutes > 0) {
    formattedTime += `${minutes}分钟`;
  }
  if (seconds > 0 || formattedTime === '') {
    formattedTime += `${seconds}秒`;
  }

  return formattedTime;
}