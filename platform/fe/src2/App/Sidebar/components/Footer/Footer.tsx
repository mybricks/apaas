import React from "react";
import { useNavigate } from "react-router-dom";

import { removeCookie } from "@/utils/local";
import { MenuButton, Modal, Popover } from "@/components";
import { AppStore, Settings, OperationLog, UserManagement, StaticFiles, Account, Signout } from "@/components/icon";
import { useUserContext, useLocationConetxt, useModalConetxt } from "@/context";
import { button as AccountMenuButton } from "@/Pages/Account";
import { button as OperationLogMenuButton } from "@/Pages/OperationLog";
import { button as UserManagementMenuButton } from "@/Pages/UserManagement";
import { button as StaticFilesMenuButton } from "@/Pages/StaticFiles";

import css from "./Footer.less";


// const menuButtons = [
//   {
//     icon: <AppStore />,
//     name: "我的应用",
//     search: "?appId=appStore",
//   },
//   {
//     icon: <OperationLog />,
//     name: "操作日志",
//     search: "?appId=operationLog",
//   },
//   {
//     icon: <UserManagement />,
//     name: "用户管理",
//     search: "?appId=userManagement",
//   },
//   {
//     icon: <StaticFiles />,
//     name: "静态文件",
//     search: "?appId=staticFiles",
//   },
//   {
//     icon: <Settings />,
//     name: "设置",
//     search: "?appId=settings",
//   },
// ]

const Footer = () => {
  // const navigate = useNavigate();
  const { user: { name, email, avatar } } = useUserContext();
  // const { search: locationSearch } = useLocationConetxt();
  const { showModal } = useModalConetxt();

  const handleSignout = () => {
    showModal(Modal.Confirmation, {
      title: "确认退出登录吗？",
      content: "退出后将跳转登录页",
      onOk() {
        removeCookie('mybricks-login-user')
        location.href = '/'
      }
    })
  }

  return (
    <div className={css.footer}>
      <div className={css.system}>
        {/* {menuButtons.map(({ icon, name, search }) => {
          console.log(search)
          return (
            <MenuButton
              key={name}
              icon={icon}
              search={search}
              locationSearch={locationSearch}
              onClick={() => navigate(search)}
            >
              {name}
            </MenuButton>
          )
        })} */}
        <OperationLogMenuButton />
        <UserManagementMenuButton />
        <StaticFilesMenuButton />
      </div>
      <div className={css.personal}>
        <Popover
          placement="topLeft"
          title={(
            <>
              {name && <div className={css.name}>{name}</div>}
              <div className={css.email}>{email}</div>
            </>
          )}
          content={(
            <>
              <AccountMenuButton />
              <MenuButton
                icon={<Signout />}
                onClick={handleSignout}
              >
                退出登录
              </MenuButton>
            </>
          )}
          arrow={false}
          overlayClassName={css.popover}
        >
          <button>
            <img src={avatar}/>
            <span>{name || email}</span>
          </button>
        </Popover>
      </div>
    </div>
  )
}

export default Footer;
