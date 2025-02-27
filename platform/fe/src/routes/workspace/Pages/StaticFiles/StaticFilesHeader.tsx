import React, { FC } from "react";

import { Navbar } from "@workspace/components";

const StaticFilesHeader: FC = () => {
  return (
    <Navbar.Section
      value={"manage"}
      options={[{label: "静态文件", value: "manage"}]}
    />
  )
}

export default StaticFilesHeader;
