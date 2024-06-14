import React from "react";
import { useNavigate } from "react-router-dom";

import { removeCookie } from "@/utils/local";
import { MenuButton, Modal, Popover } from "@/components";
import { AppStore, Settings, OperationLog, UserManagement, StaticFiles, Account, Signout } from "@/components/icon";
import { useUserContext, useLocationConetxt, useModalConetxt } from "@/context";
import { AccountMenuButton } from "@/Pages/Account";

import css from "./Footer.less";

const menuButtons = [
  {
    icon: <AppStore />,
    name: "我的应用",
    search: "?appId=appStore",
  },
  {
    icon: <OperationLog />,
    name: "操作日志",
    search: "?appId=operationLog",
  },
  {
    icon: <UserManagement />,
    name: "用户管理",
    search: "?appId=userManagement",
  },
  {
    icon: <StaticFiles />,
    name: "静态文件",
    search: "?appId=staticFiles",
  },
  {
    icon: <Settings />,
    name: "设置",
    search: "?appId=settings",
  },
]

// @ts-ignore
// const { confirm } = Modal;

// const handleSignout = () => {
//   confirm({
//     title: "确认退出登录吗？",
//     content: "退出后将跳转登录页",
//     onOk() {
//       removeCookie('mybricks-login-user')
//       location.href = '/'
//     },
//   });
// }

const Footer = () => {
  const navigate = useNavigate();
  const { user: { name, email, avatar } } = useUserContext();
  const { search: locationSearch } = useLocationConetxt();
  const { showModal, hideModal } = useModalConetxt();

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

  // showModal(ConfirmationDialog, {
  //   title: 'Discard changes?',
  //   children: (
  //     <p>
  //       You have the following unsaved changes on another comment: &quot;
  //       {markdownStrippedValue.trim()}&quot;
  //     </p>
  //   ),
  //   confirmButton: {
  //     text: 'Discard Changes',
  //   },
  //   cancelButton: {
  //     text: 'Continue Editing',
  //   },
  //   onConfirm: () => {
  //     hideModal()
  //     discardChanged()
  //   },
  //   onHide: () => {
  //     hideModal()
  //     continueEditing()
  //   },
  // })

  return (
    <div className={css.footer}>
      <div className={css.system}>
        {menuButtons.map(({ icon, name, search }) => {
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
        })}
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

import { ModalInjectedProps } from "@/types";

interface MMMProps extends ModalInjectedProps {
  name: string;
}

function MMM(props: MMMProps) {
  console.log(props, 'props')

  return (
    <Modal title="确认退出登录吗？">
      <Modal.Body>
        helloworld
      </Modal.Body>
    </Modal>
  )
}