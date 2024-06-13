import React, { FC } from "react";

import { useAppConetxt } from "@/context";

import css from "./header.less";

const Header: FC = () => {
  const { system } = useAppConetxt();

  const handleHeaderClick = () => {
    console.log("跳转“我的”")
  }

  return (
    <div className={css.header} onClick={handleHeaderClick}>
      <div className={css.wrapper}>
        <div className={css.logo}>
          <img src={system.logo || "./image/icon.png"}/>
        </div>
        <span className={css.name}>
          MyBricks
        </span>
      </div>
    </div>
  )
}

export default Header;
