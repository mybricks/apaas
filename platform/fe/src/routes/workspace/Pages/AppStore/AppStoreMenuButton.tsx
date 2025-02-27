import React, {FC} from "react";

import {MenuButton, Link} from "@workspace/components";
import {AppStore} from "@workspace/components/icon";

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