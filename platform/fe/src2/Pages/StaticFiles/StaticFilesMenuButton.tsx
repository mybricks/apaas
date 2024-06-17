import React, { FC } from "react";

import { MenuButton, Link } from "@/components";
import { StaticFiles } from "@/components/icon";

const id = "staticFiles";
const search = `?appId=${id}`;

const StaticFilesMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton
        icon={<StaticFiles />}
        search={search}
      >
        静态文件
      </MenuButton>
    </Link>
  )
}

export {
  id,
  StaticFilesMenuButton
};