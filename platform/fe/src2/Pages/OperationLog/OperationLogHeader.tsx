import React, { FC } from "react";

import { Navbar } from "@/components";

const OperationLogHeader: FC = () => {
  return (
    <Navbar.Section
      value={"application"}
      options={[{label: "应用", value: "application"}]}
    />
  )
}

export default OperationLogHeader;
