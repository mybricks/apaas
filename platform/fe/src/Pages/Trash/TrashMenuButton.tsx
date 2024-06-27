import React, { FC } from "react";

import { MenuButton, Link } from "@/components";
import { Trash } from "@/components/icon";

const id = "trash";
const search = `?appId=${id}`;

const TrashMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton
        icon={"./image/icon_rubbish.png"}
        search={search}
      >
        回收站
      </MenuButton>
    </Link>
  )
}

export {
  id,
  TrashMenuButton
};