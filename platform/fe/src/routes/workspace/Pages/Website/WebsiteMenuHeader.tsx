import React, { FC } from "react";

import { Navbar } from "@workspace/components";

const WebsiteMenuHeader: FC = () => {
  return (
    <Navbar.Section
      value={"website"}
      options={[{label: "网站监控", value: "website"}]}
    />
  )
}

export default WebsiteMenuHeader;
