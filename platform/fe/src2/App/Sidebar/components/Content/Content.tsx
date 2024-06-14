import React from "react";
import { useNavigate } from "react-router-dom";

import { useAppConetxt, useLocationConetxt } from "@/context";
import { MenuButton } from "@/components";

import css from "./Content.less";

export default function Content() {
  const navigate = useNavigate();
  const { apps } = useAppConetxt();
  const { search: locationSearch } = useLocationConetxt();
  const { menuApps } = apps;

  return (
    <div className={css.content}>
      {menuApps.map(({ icon, namespace, title }) => {
        const search = `?appId=${namespace}`;
        return (
          <MenuButton
            key={namespace}
            icon={icon}
            search={search}
            locationSearch={locationSearch}
            onClick={() => navigate(search)}
          >
            {title}
          </MenuButton>
        )
      })}
      <div className={css.split}></div>
    </div>
  )
}
