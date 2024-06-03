import React, {
	FC,
	useMemo,
	useState,
	useCallback
} from 'react'

import axios from 'axios'
import moment from 'moment'
import {message} from 'antd'
import {observe} from '@mybricks/rxui'

import {Content} from '../index'
import AppCtx from '../../AppCtx'
import {folderExtnames} from '../files/Ctx'
import {Icon, IconRecover} from '@/components'

import styles from './index.less'

const Trash: FC = () => {
	const appCtx = observe(AppCtx, {from: 'parents'})
	const user = appCtx.user
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
		<Content title="回收站">
			<div className={styles.view}>
				<div className={styles.files}>
					{fileList?.map((item, idx) => {
						return (
							<ProjectItem key={idx} item={item} user={user} refresh={fetchTrashes} />
						)
					})}
				</div>
			</div>
		</Content>
	)
}

const ProjectItem = ({ item, user, refresh }) => {
	const appCtx = observe(AppCtx, {from: 'parents'})
	const APPSMap = appCtx.APPSMap
	const appReg = APPSMap[item.extName]
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

	const bigIcon = folderExtnames.includes(item.extName) || item.icon

	return (
		<div className={styles.file}>
			<div className={styles.snap}>
				<Icon icon={item.icon || appReg?.icon} width={bigIcon ? 140 : 32} height={bigIcon ? '100%' : 32}/>
			</div>
			<div className={styles.tt}>
				<div className={styles.typeIcon}>
					<Icon icon={appReg?.icon} width={18} height={18}/>
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

export default Trash
