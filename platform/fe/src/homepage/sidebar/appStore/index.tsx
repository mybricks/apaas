import React, {useEffect, useState} from 'react'

import axios from 'axios'
import {message} from 'antd'
import {observe} from '@mybricks/rxui'

import AppCtx, {T_App} from '../../AppCtx'
import AppList from './components/appList'

const AppStore = () => {
	const appCtx = observe(AppCtx, {from: 'parents'})
	const [loading, setLoading] = useState(true)
	const [allApps, setAllApps] = useState<T_App[]>([])
	const installedApps = appCtx.InstalledAPPS
	
	useEffect(() => {
		setLoading(true);
		
		axios('/paas/api/apps/getLatestAllFromSource').then((res) => {
			if (res.data.code === 1) {
				setAllApps(res.data.data);
			} else {
				message.error(`获取数据发生错误：${res.data.message}`);
			}
		}).finally(() => {
			setLoading(false);
		});
	}, []);
	
	return (
		<AppList installedApps={installedApps} userId={appCtx.user?.id} allApps={allApps} loading={loading} systemConfig={appCtx.systemConfig} />
	)
}

export default AppStore
