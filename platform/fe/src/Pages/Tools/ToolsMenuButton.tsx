import React, {FC} from "react";

import {MenuButton, Link} from "@/components";
import {Tools} from "@/components/icon";

import css from "./ToolsMenuButton.less";

const id = "Tools";
const search = `?appId=${id}`;

const ToolsMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton
        icon={Tools}
        search={search}
        className={css.button}
      >
        常用工具
      </MenuButton>
    </Link>
  )
}

export {
  id,
  ToolsMenuButton
};
