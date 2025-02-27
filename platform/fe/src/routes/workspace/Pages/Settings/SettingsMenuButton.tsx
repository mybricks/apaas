import React, {FC} from "react";

import {MenuButton, Link} from "@workspace/components";
import {Settings} from "@workspace/components/icon";

import css from "./SettingsMenuButton.less";

const id = "settings";
const search = `?appId=${id}`;

const SettingsMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton
        icon={Settings}
        search={search}
        className={css.button}
      >
        配置中心
      </MenuButton>
    </Link>
  )
}

export {
  id,
  SettingsMenuButton
};