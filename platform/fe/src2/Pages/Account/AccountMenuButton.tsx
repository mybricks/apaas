import React, { FC } from "react";

import { MenuButton, Link } from "@/components";
import { Account } from "@/components/icon";

const id = "account";
const search = `?appId=${id}`;

const AccountMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton icon={<Account />}>
        个人设置
      </MenuButton>
    </Link>
  )
}

export {
  id,
  AccountMenuButton
};