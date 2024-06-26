import React, { FC } from "react";

import { InstalledApp } from "@/types";

import css from "./InstalledAppPage.less";

const InstalledAppPage: FC<InstalledApp> = (app) => {
  return (
    <iframe className={css.installedAppPage} src={app.homepage}/>
  )
}

export default InstalledAppPage;
