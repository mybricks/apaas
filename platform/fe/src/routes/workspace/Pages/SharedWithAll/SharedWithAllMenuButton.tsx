import React, {FC} from "react";

import {MenuButton, Link} from "@workspace/components";
import {SharedWithAll} from "@workspace/components/icon";

const id = "sharedWithAll";
const search = `?appId=${id}`;

const SharedWithAllMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton
        icon={SharedWithAll}
        search={search}
      >
        大家的分享
      </MenuButton>
    </Link>
  )
}

export {
  id,
  SharedWithAllMenuButton
};