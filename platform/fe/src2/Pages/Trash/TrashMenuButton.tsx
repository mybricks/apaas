import React, { FC } from "react";
import { useNavigate } from "react-router-dom";

import { MenuButton } from "@/components";
import { Trash } from "@/components/icon";

const id = "trash";
const search = `?appId=${id}`;

const TrashMenuButton: FC = () => {
  const navigate = useNavigate();
  return (
    <MenuButton
      icon={<Trash />}
      search={search}
      onClick={() => navigate(search)}
    >
      回收站
    </MenuButton>
  )
}

export {
  id,
  TrashMenuButton
};