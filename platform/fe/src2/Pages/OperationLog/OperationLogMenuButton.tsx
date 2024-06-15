import React, { FC } from "react";
import { useNavigate } from "react-router-dom";

import { MenuButton } from "@/components";
import { OperationLog } from "@/components/icon";

const id = "operationLog";
const search = `?appId=${id}`;

const OperationLogMenuButton: FC = () => {
  const navigate = useNavigate();
  return (
    <MenuButton
      icon={<OperationLog />}
      search={search}
      onClick={() => navigate(search)}
    >
      操作日志
    </MenuButton>
  )
}

export {
  id,
  OperationLogMenuButton
};
