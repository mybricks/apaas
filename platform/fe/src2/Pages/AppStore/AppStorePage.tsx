// TODO: Next
import React from 'react'

import { useAppConetxt, useUserContext } from '@/context';
import AppList from "./appList";

const AppStorePage = () => {
  const { apps: { installedApps}, system } = useAppConetxt();
  const { user } = useUserContext();
	
	return (
		<AppList installedApps={installedApps} userId={user.id} systemConfig={system} />
	)
}

export default AppStorePage;
