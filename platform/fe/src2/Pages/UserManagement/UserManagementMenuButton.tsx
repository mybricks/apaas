import React, { FC } from "react";
import { useNavigate } from "react-router-dom";

import { MenuButton } from "@/components";
import { UserManagement } from "@/components/icon";

const id = "userManagement";
const search = `?appId=${id}`;

const UserManagementMenuButton: FC = () => {
  const navigate = useNavigate();
  return (
    <MenuButton
      icon={<UserManagement />}
      search={search}
      onClick={() => navigate(search)}
    >
      用户管理
    </MenuButton>
  )
}

export {
  id,
  UserManagementMenuButton
};
