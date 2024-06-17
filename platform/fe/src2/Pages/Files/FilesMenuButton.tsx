import React, { FC } from "react";

import { MenuButton, Link } from "@/components";
import { Account } from "@/components/icon";

const id = "files";
const search = `?appId=${id}`;

const FilesMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton
        icon={<Account />}
        search={search}
      >
        我的
      </MenuButton>
    </Link>
  )
}

export {
  id,
  FilesMenuButton
};