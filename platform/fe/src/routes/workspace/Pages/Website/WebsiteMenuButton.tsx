import React, { FC } from "react";

import { MenuButton, Link } from "@workspace/components";
import { OperationLog } from "@workspace/components/icon";

const id = "website";
const search = `?appId=${id}`;

const WebsiteMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton
        icon={OperationLog}
        search={search}
      >
        网站监控
      </MenuButton>
    </Link>
  )
}

export {
  id,
  WebsiteMenuButton
};