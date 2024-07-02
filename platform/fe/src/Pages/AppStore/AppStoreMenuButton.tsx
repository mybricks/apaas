import React, {FC} from "react";

import {MenuButton, Link} from "@/components";
import {AppStore} from "@/components/icon";

const id = "appStore";
const search = `?appId=${id}`;

const AppStoreMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton
        icon={AppStore}
        search={search}
      >
        我的应用
      </MenuButton>
    </Link>
  )
}

export {
  id,
  AppStoreMenuButton
};