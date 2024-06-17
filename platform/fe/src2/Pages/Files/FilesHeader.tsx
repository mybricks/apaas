import React, { FC } from "react";

import { Navbar } from "@/components";

const AccountHeader: FC = () => {
  return (
    <Navbar.Section
      value={"files"}
      options={[{label: "文件", value: "files"}]}
    />
  )
}

export default AccountHeader;
