import React from "react";

import { useWorkspaceConetxt } from "@/context";
import { button as SharedWithAllMenuButton } from "@/Pages/SharedWithAll";
import { button as TrashMenuButton } from "@/Pages/Trash";
import { button as FilesMenuButton } from "@/Pages/Files";
import { button as InstalledAppMenuButton } from "@/Pages/InstalledApp";

import css from "./Content.less";

export default function Content() {
  const { apps: { menuApps } } = useWorkspaceConetxt();

  return (
    <div className={css.content}>
      <SharedWithAllMenuButton />
      <TrashMenuButton />
      {menuApps.map((app) => {
        return <InstalledAppMenuButton {...app}/>;
      })}
      <div className={css.split}></div>
      <FilesMenuButton />
    </div>
  )
}
