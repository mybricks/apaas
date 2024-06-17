import React, { FC } from "react";

import { MenuButton, Link } from "@/components";
import { Settings } from "@/components/icon";

const id = "settings";
const search = `?appId=${id}`;

const SettingsMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton
        icon={<Settings />}
        search={search}
      >
        设置
      </MenuButton>
    </Link>
  )
}

export {
  id,
  SettingsMenuButton
};