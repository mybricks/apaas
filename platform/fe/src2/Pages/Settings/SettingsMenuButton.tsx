import React, { FC } from "react";
import { useNavigate } from "react-router-dom";

import { MenuButton } from "@/components";
import { Settings } from "@/components/icon";

const id = "settings";
const search = `?appId=${id}`;

const SettingsMenuButton: FC = () => {
  const navigate = useNavigate();
  return (
    <MenuButton
      icon={<Settings />}
      search={search}
      onClick={() => navigate(search)}
    >
      设置
    </MenuButton>
  )
}

export {
  id,
  SettingsMenuButton
};