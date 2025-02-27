import React, { FC } from "react";

import { Navbar } from "@workspace/components";

const SettingsHeader: FC = () => {
  return (
    <Navbar.Section
      value={"settings"}
      options={[{label: "设置", value: "settings"}]}
    />
  )
}

export default SettingsHeader;
