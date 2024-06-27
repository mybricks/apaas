import React, { FC } from "react";
import classNames from "classnames";

import { MenuButton, Link } from "@/components";
import { InstalledApp } from "@/types";

import css from "./InstalledAppMenuButton.less";

const InstalledAppMenuButton: FC<InstalledApp> = (app) => {
  const search = `?appId=${app.namespace}`;
  return (
    <Link to={search}>
      <MenuButton className={classNames({[css.button]: app.namespace === "mybricks-material"})} icon={app.icon} search={search}>
        {app.title}
      </MenuButton>
    </Link>
  )
}

export default InstalledAppMenuButton;
