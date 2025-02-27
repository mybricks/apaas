import React, { FC } from "react";

import { Navbar } from "@workspace/components";

const OperationLogHeader: FC = () => {
  return (
    <Navbar.Section
      value={"application"}
      options={[{label: "操作日志", value: "application"}]}
    />
  )
}

export default OperationLogHeader;
