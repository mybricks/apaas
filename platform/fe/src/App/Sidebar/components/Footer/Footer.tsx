import React, { useMemo } from 'react'

import { removeCookie } from '@/utils/local'
import { MenuButton, Modal, Popover } from '@/components'
import { Signout } from '@/components/icon'
import { useUserContext, useModalConetxt, useWorkspaceConetxt } from '@/context'
import { button as AppStoreMenuButton } from '@/Pages/AppStore'
import { button as AccountMenuButton } from '@/Pages/Account'
import { button as WebsiteMenuButton } from '@/Pages/Website'
// import { button as OperationLogMenuButton } from "@/Pages/OperationLog";
import { button as UserManagementMenuButton } from '@/Pages/UserManagement'
// import { button as StaticFilesMenuButton } from "@/Pages/StaticFiles";
import { button as SettingsMenuButton } from '@/Pages/Settings'
import { button as ToolsMenuButton } from '@/Pages/Tools'

import css from './Footer.less'

const Footer = () => {
  const {
    user: { name, email, avatar, isAdmin },
  } = useUserContext()
  const { system } = useWorkspaceConetxt()
  const { showModal } = useModalConetxt()

  const handleSignout = () => {
    showModal(Modal.Confirmation, {
      title: '确认退出登录吗？',
      content: '退出后将跳转登录页',
      onOk() {
        removeCookie('mybricks-login-user')
        location.href = '/'
      },
    })
  }

  const noMenuItems = useMemo(() => {
    return !system.openUserInfoSetting && !system.openLogout
  }, [system.openUserInfoSetting, system.openLogout])

  return (
    <div className={css.footer}>
      {isAdmin && (
        <div className={css.system}>
          <AppStoreMenuButton />
          {/* <OperationLogMenuButton /> */}
          <WebsiteMenuButton />
          <UserManagementMenuButton />
          {/* <StaticFilesMenuButton /> */}
          <ToolsMenuButton />
          <SettingsMenuButton />
        </div>
      )}
      <div className={css.personal}>
        <Popover
          placement="topLeft"
          title={
            <>
              {name && <div className={css.name}>{name}</div>}
              <div className={css.email}>{email}</div>
            </>
          }
          content={
            <>
              {system.openUserInfoSetting && <AccountMenuButton />}
              {system.openLogout && (
                <MenuButton icon={<Signout />} onClick={handleSignout}>
                  退出登录
                </MenuButton>
              )}
            </>
          }
          arrow={false}
          overlayClassName={`${css.popover} ${noMenuItems ? '' : css.notNone}`}
        >
          <button>
            <img src={avatar} />
            <span>{name || email}</span>
          </button>
        </Popover>
      </div>
    </div>
  )
}

export default Footer
