import React, { FC } from "react";
import { useNavigate } from "react-router-dom";

import { MenuButton } from "@/components";
import { StaticFiles } from "@/components/icon";

const id = "staticFiles";
const search = `?appId=${id}`;

const StaticFilesMenuButton: FC = () => {
  const navigate = useNavigate();
  return (
    <MenuButton
      icon={<StaticFiles />}
      search={search}
      onClick={() => navigate(search)}
    >
      静态文件
    </MenuButton>
  )
}

export {
  id,
  StaticFilesMenuButton
};