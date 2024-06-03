import React, {
	useRef,
	useMemo,
	useState,
	useCallback
} from 'react'

import axios from 'axios'
import {message} from 'antd'
import {observe} from '@mybricks/rxui'

import {Content} from '..'
import AppCtx from '../../AppCtx'
import {Icon} from '@/components'
import {unifiedTime} from '../../../utils'

import css from './index.less'

const pageSize = 50

export default function Share() {
	const appCtx = observe(AppCtx, {from: 'parents'})

	const scrollRef = useRef<HTMLDivElement>()
	const [fileList, setFileList] = useState([])
	const [total, setTotal] = useState(0)
	const [pageIndex, setPageIndex] = useState(0)
	const [loading, setLoading] = useState(true)

	useMemo(() => {
		setLoading(true)
		axios({
			method: 'post',
			url: '/paas/api/share/getAll',
			data: {
				pageSize: pageSize,
				page: pageIndex
			}
		}).then(({data:{code, data}}) => {
			if (code === 1) {
				setFileList((list) => {
					return list.concat(data.list)
				})
				setTotal(data.total)
			} else { 
				message.error(`获取数据发生错误：${data.message}`)
			}
		}).finally(() => {
			setLoading(false)
		})
	}, [pageIndex])

	const onClick = useCallback(({id, homepage}) => {
		window.open(`${homepage}?id=${id}`)
	}, [])

	const onScroll = useCallback(() => {
		if (loading || total === 0 || (total && (pageIndex + 1) * pageSize >= total)) {
			return
		}

		const container = scrollRef.current

		let scrollTop, clientHeight, scrollHeight;
		scrollTop = container.scrollTop || 0;
		clientHeight = container.clientHeight;
		scrollHeight = container.scrollHeight;

		if (scrollTop + clientHeight >= scrollHeight - 500) {
			setPageIndex(pageIndex + 1)
		}
	}, [loading, total, pageIndex, pageSize]);

	const list = useMemo(() => {
		const {APPSMap} = appCtx

		return fileList.map((file) => {
			const {
				id, 
				name,
				icon,
				path,
				extName,
				createTime
			} = file
			const appReg = APPSMap[extName]
			
			return (
				<div key={id} className={css.file} onClick={() => onClick({id, homepage: appReg.homepage})}>
					<div className={css.snap}>
						<Icon icon={icon || appReg?.icon} width={icon ? 140 : 32} height={icon ? '100%' : 32}/>
					</div>
					<div className={css.tt}>
						<div className={css.typeIcon}>
							<Icon icon={appReg?.icon} width={18} height={18}/>
						</div>
						<div className={css.detail}>
							<div className={css.name}>
								{name}
							</div>
							<div className={css.path} data-content-start={path}>
								{unifiedTime(createTime)}
							</div>
						</div>
					</div>
				</div>
			);
		})
	}, [fileList])

	const empty = useMemo(() => {
		if (total === 0 && !loading) {
			return <div className={css.loading}>暂无分享内容</div>
		}

		return null
	}, [total, loading])

	const spin = useMemo(() => {
		return (((!total || total < 0) && loading) || (total && loading)) ? <div className={css.loading}>加载中...</div> : null;
	}, [total, loading])

	const noMore = useMemo(() => {
		if (!loading && (pageIndex + 1) * pageSize >= total && total > 0) {
			return <div className={css.loading}>- 没有更多了 -</div>
		}

		return null
	}, [loading, pageIndex, pageSize, total])

	return (
		<Content title="大家的分享">
			<div
				ref={scrollRef}
				className={css.files}
				onScroll={onScroll}
			>
				{list}
				{empty}
				{spin}
				{noMore}
			</div>
		</Content>
	)
}
