import React, { FC } from "react";

import { MenuButton, Link } from "@/components";
import { InstalledApp } from "@/types";

const InstalledAppMenuButton: FC<InstalledApp> = (app) => {
  const search = `?appId=${app.namespace}`;
  return (
    <Link to={search}>
      <MenuButton icon={app.icon} search={search}>
        {app.title}
      </MenuButton>
    </Link>
  )
}

export default InstalledAppMenuButton;
