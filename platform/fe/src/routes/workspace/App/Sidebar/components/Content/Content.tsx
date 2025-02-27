import React from "react";

import { useWorkspaceConetxt } from "@workspace/context";
import { button as SharedWithAllMenuButton } from "@workspace/Pages/SharedWithAll";
import { button as MaterialMenuButton } from '@workspace/Pages/Material'
import { button as TrashMenuButton } from "@workspace/Pages/Trash";
import { button as FilesMenuButton } from "@workspace/Pages/Files";
import { button as InstalledAppMenuButton } from "@workspace/Pages/InstalledApp";

import css from "./Content.less";

export default function Content() {
  const { apps: { menuApps } } = useWorkspaceConetxt();

  return (
    <div className={css.content}>
      <div>
        <SharedWithAllMenuButton />
        <MaterialMenuButton />
        {menuApps.map((app) => {
          return <InstalledAppMenuButton {...app}/>;
        })}
        <TrashMenuButton />
        <div className={css.split}></div>
      </div>
      <div className={css.filesMenuContainer}>
        <FilesMenuButton />
      </div>
    </div>
  )
}
