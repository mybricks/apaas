import React, { FC } from "react";

import { useWorkspaceConetxt } from "@/context";
import { Link } from "@/components";
import Files from "@/Pages/Files";

import css from "./Header.less";

const Header: FC = () => {
  const { system } = useWorkspaceConetxt();

  return (
    <div className={css.header}>
      <Link to={`?appId=${Files.id}`}>
        <div className={css.wrapper}>
          <div className={css.logo}>
            <img src={system.logo || "./image/icon.png"}/>
          </div>
          <span className={css.name}>
            {system.title || "MyBricks"}
          </span>
        </div>
      </Link>
    </div>
  )
}

export default Header;
