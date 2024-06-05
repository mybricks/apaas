import React, {useEffect, useState} from 'react'

import axios from 'axios'
import {message} from 'antd'
import {observe} from '@mybricks/rxui'

import AppCtx, {T_App} from '../../AppCtx'
import AppList from './components/appList'

const AppStore = () => {
	const appCtx = observe(AppCtx, {from: 'parents'})
	const installedApps = appCtx.InstalledAPPS
	

	return (
		<AppList installedApps={installedApps} userId={appCtx.user?.id} systemConfig={appCtx.systemConfig} />
	)
}

export default AppStore
