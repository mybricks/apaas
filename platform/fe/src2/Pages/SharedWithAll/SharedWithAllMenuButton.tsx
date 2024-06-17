import React, { FC } from "react";
import { useNavigate } from "react-router-dom";

import { MenuButton } from "@/components";
import { SharedWithAll } from "@/components/icon";

const id = "sharedWithAll";
const search = `?appId=${id}`;

const SharedWithAllMenuButton: FC = () => {
  const navigate = useNavigate();
  return (
    <MenuButton
      icon={<SharedWithAll />}
      search={search}
      onClick={() => navigate(search)}
    >
      大家的分享
    </MenuButton>
  )
}

export {
  id,
  SharedWithAllMenuButton
};