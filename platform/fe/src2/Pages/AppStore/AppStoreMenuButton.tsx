import React, { FC } from "react";
import { useNavigate } from "react-router-dom";

import { MenuButton } from "@/components";
import { AppStore } from "@/components/icon";

const id = "appStore";
const search = `?appId=${id}`;

const AppStoreMenuButton: FC = () => {
  const navigate = useNavigate();
  return (
    <MenuButton
      icon={<AppStore />}
      search={search}
      onClick={() => navigate(search)}
    >
      我的应用
    </MenuButton>
  )
}

export {
  id,
  AppStoreMenuButton
};