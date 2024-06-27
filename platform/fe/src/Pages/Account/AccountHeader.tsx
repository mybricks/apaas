import React, { FC } from "react";

import { Navbar } from "@/components";

const AccountHeader: FC = () => {
  return (
    <Navbar.Section
      value={"general"}
      options={[{label: "账号信息", value: "general"}]}
    />
  )
}

export default AccountHeader;
