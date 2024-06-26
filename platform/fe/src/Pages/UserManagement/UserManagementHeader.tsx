import React, { FC } from "react";

import { Navbar } from "@/components";

const UserManagementHeader: FC = () => {
  return (
    <Navbar.Section
      value={"userManagement"}
      options={[{label: "用户管理", value: "userManagement"}]}
    />
  )
}

export default UserManagementHeader;
