import React, { FC } from "react";

import { MenuButton, Link } from "@workspace/components";
import { Account } from "@workspace/components/icon";

const id = "account";
const search = `?appId=${id}`;

const AccountMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton icon={"./image/icon_myproject.png"}>
        个人设置
      </MenuButton>
    </Link>
  )
}

export {
  id,
  AccountMenuButton
};