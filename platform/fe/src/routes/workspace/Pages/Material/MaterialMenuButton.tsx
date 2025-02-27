import React, {FC} from "react";

import {MenuButton, Link} from "@workspace/components";
import {SharedWithAll} from "@workspace/components/icon";
import { Material } from "@workspace/components/icon";

const id = "material";
const search = `?appId=${id}`;

const MaterialMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton
        icon={Material}
        search={search}
      >
        物料中心
      </MenuButton>
    </Link>
  )
}

export {
  id,
  MaterialMenuButton
};