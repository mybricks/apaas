import React, {FC} from "react";

import {MenuButton, Link} from "@/components";
import {OperationLog} from "@/components/icon";

import css from "./OperationLogMenuButton.less";

const id = "operationLog";
const search = `?appId=${id}`;

const OperationLogMenuButton: FC = () => {
  return (
    <Link to={search}>
      <MenuButton
        icon={OperationLog}
        search={search}
        className={css.button}
      >
        操作日志
      </MenuButton>
    </Link>
  )
}

export {
  id,
  OperationLogMenuButton
};
