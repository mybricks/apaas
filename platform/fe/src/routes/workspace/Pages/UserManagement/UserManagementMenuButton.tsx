import React, {FC} from "react";

import {MenuButton, Link} from "@workspace/components";
import {UserManagement} from "@workspace/components/icon";

import css from "./UserManagementMenuButton.less";

const id = "userManagement";
const search = `?appId=${id}`;

const UserManagementMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton
        icon={UserManagement}
        search={search}
        className={css.button}
      >
        用户管理
      </MenuButton>
    </Link>
  )
}

export {
  id,
  UserManagementMenuButton
};
