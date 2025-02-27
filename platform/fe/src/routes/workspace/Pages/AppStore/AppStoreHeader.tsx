import React, { FC } from "react";

import { Navbar } from "@workspace/components";
import { useAppStoreContext } from "./AppStoreProvider";

const AppStoreHeader: FC = () => {
  const { type, setType } = useAppStoreContext();

  return (
    <Navbar.Section<typeof type>
      value={type}
      options={[
        { label: "已安装", value: "installed" },
        { label: "应用市场", value: "all"}
      ]}
      onChange={setType}
    />
  )
}

export default AppStoreHeader;
