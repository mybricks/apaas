import React, { FC } from "react";

import { Navbar } from "@/components";

const StaticFilesHeader: FC = () => {
  return (
    <Navbar.Section
      value={"manage"}
      options={[{label: "管理", value: "manage"}]}
    />
  )
}

export default StaticFilesHeader;
