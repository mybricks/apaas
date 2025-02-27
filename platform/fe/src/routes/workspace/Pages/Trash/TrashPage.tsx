// TODO: Next
import React, {
	FC,
	useMemo,
	useState,
	useCallback
} from 'react'

import axios from 'axios'
import moment from 'dayjs'
import {message} from 'antd'

import { useWorkspaceConetxt, useUserContext } from '@workspace/context'
import { Icon } from "@workspace/components/icon";

import styles from './TrashPage.less'

const folderExtnames = ['folder', 'folder-project', 'folder-module']

const TrashPage: FC = () => {
  const { user } = useUserContext();
	const [fileList, setFileList] = useState([])
	const fetchTrashes = useCallback(() => {
		axios({
			method: 'get',
			url: '/paas/api/workspace/trashes',
			params: { userId: user.id }
		}).then(({data}) => {
			if (data.code === 1) {
				setFileList(data.data);
			} else {
				message.error(`获取数据发生错误：${data.message}`)
			}
		})
	}, [user])
	
	useMemo(() => {
		fetchTrashes()
	}, [])
	
	return (
		<div className={styles.view}>
      <div className={styles.files}>
        {fileList?.map((item, idx) => {
          return (
            <ProjectItem key={idx} item={item} user={user} refresh={fetchTrashes} />
          )
        })}
      </div>
    </div>
	)
}

const ProjectItem = ({ item, user, refresh }) => {
  const { apps: { getApp } } = useWorkspaceConetxt();

	const appReg = getApp(item.extName)
	const recover = useCallback((event) => {
		event.stopPropagation()
		
		axios({
			method: 'post',
			url: '/paas/api/workspace/recoverFile',
			data: { userId: user.id, id: item.id }
		}).then(({data}) => {
			if (data.code === 1) {
				message.success('文件恢复成功')
				refresh()
			} else {
				message.error('文件恢复失败，请稍候再试')
			}
		}).catch(() => {
			message.error('文件恢复失败，请稍候再试')
		})
	}, [item, user])

	const snapLargeIcon = ["folder"].includes(item.extName) || item.icon;

	return (
		<div className={styles.file}>
			<div className={styles.snap}>
				<span className={snapLargeIcon ? styles.largeIcon : styles.icon}>
					<Icon icon={item.icon || appReg?.icon} />
				</span>
				{/* <Icon icon={item.icon || appReg?.icon} width={bigIcon ? 140 : 32} height={bigIcon ? '100%' : 32}/> */}
			</div>
			<div className={styles.tt}>
				<div className={styles.typeIcon}>
					<Icon icon={appReg?.icon}/>
				</div>
				<div className={styles.detail}>
					<div className={styles.name}>
						{item.name}
					</div>
					<div className={styles.path} data-content-start={item.path}>
						将于 {moment(item.updateTime).add(15, 'days').format('YYYY-MM-DD HH:mm')} 清理
					</div>
				</div>
				
				<div className={styles.btns}>
          <span onClick={recover}>
            <IconRecover width={32} height={32}/>
          </span>
				</div>
			</div>
		</div>
	)
}

export default TrashPage

/** 删除 */
export function IconRecover ({width, height}) {
  return (
	  <svg width={width} height={height} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
		  <path
			  d="M876.89 535.11c3.22-107.02-35.43-208.89-108.85-286.85-139.4-148.03-365.98-166.35-526.67-50.07l-5.56-57.66c-2.36-24.48-24.16-42.41-48.61-40.07-24.48 2.36-42.43 24.12-40.07 48.61l17.92 185.8a44.52 44.52 0 0 0 17.77 31.48c1.51 1.13 3.07 2.13 4.68 3.04a44.528 44.528 0 0 0 30.61 4.89l178.1-35.47c24.11-4.8 39.77-28.25 34.96-52.39-4.78-24.15-28.22-39.78-52.39-34.96l-81.37 16.2c124.67-87.44 298.4-72.49 405.79 41.7 57.09 60.62 87.16 139.85 84.68 223.08-2.51 83.24-37.26 160.52-97.91 217.62C564.83 867.92 367 862.07 249.25 736.82c-16.83-17.92-45.05-18.76-62.97-1.88-17.89 16.87-18.74 45.06-1.88 62.97 28.36 30.1 60.28 54.83 94.56 74.18 148.83 83.98 341.29 66 472.1-57.18C829 741.5 873.69 642.14 876.89 535.11z"
			></path>
		  <path
			  d="M423.44 378.04c-24.59 0.46-44.16 20.78-43.7 45.37l3.34 178.13c0.46 24.59 20.78 44.16 45.37 43.7l178.13-3.34c24.59-0.46 44.16-20.78 43.7-45.37s-20.78-44.16-45.37-43.7l-133.6 2.51-2.51-133.6c-0.46-24.59-20.77-44.16-45.36-43.7z"
		  ></path>
	  </svg>
  );
}

// function Icon({icon, onClick, className, width = '100%', height = '100%', style = {}}): JSX.Element {
//   const iconType = typeof icon

//   if (iconType === 'string') {
//     const src = icon;
//     return <img draggable={false} className={className} src={src} onClick={onClick} width={width} height={height} style={style}/>
//   }

//   if (iconType === 'function') {
//     return (icon as ((...args: any) => JSX.Element))({onClick, className, width, height, style})
//   }

//   return icon as JSX.Element
// }