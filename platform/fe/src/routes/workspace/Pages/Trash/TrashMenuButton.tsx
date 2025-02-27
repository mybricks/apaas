import React, { FC } from "react";

import { MenuButton, Link } from "@workspace/components";
import { Trash } from "@workspace/components/icon";

const id = "trash";
const search = `?appId=${id}`;

const TrashMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton
        icon={Trash}
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