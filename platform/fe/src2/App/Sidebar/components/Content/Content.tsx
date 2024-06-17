import React from "react";
import { useNavigate } from "react-router-dom";

import { useAppConetxt } from "@/context";
// import { MenuButton } from "@/components";
import { button as SharedWithAllMenuButton } from "@/Pages/SharedWithAll";

import css from "./Content.less";

export default function Content() {
  const navigate = useNavigate();
  const { apps } = useAppConetxt();
  // const { menuApps } = apps;

  return (
    <div className={css.content}>
      <SharedWithAllMenuButton />
      {/* {menuApps.map(({ icon, namespace, title }) => {
        const search = `?appId=${namespace}`;
        return (
          <MenuButton
            key={namespace}
            icon={icon}
            search={search}
            onClick={() => navigate(search)}
          >
            {title}
          </MenuButton>
        )
      })} */}
      <div className={css.split}></div>
    </div>
  )
}
