import React, { FC } from "react";

import { Navbar } from "@workspace/components";

const AccountHeader: FC = () => {
  return (
    <Navbar.Section
      value={"sharedWithAll"}
      options={[{label: "分享", value: "sharedWithAll"}]}
    />
  )
}

export default AccountHeader;
