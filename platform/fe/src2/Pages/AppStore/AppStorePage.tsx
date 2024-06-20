// TODO: Next
import React from 'react'

import { useWorkspaceConetxt, useUserContext } from '@/context';
import AppList from "./appList";

const AppStorePage = () => {
  const { apps: { installedApps}, system } = useWorkspaceConetxt();
  const { user } = useUserContext();
	
	return (
		<AppList installedApps={installedApps} userId={user.id} systemConfig={system} />
	)
}

export default AppStorePage;
