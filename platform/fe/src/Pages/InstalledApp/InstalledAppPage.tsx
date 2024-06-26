import React, { FC } from "react";

import { InstalledApp } from "@/types";

import css from "./InstalledAppPage.less";

const InstalledAppPage: FC<InstalledApp> = (app) => {
  return (
    <div className={css.installedAppPage} >
      <iframe src={app.homepage}/>
    </div>
  )
}

export default InstalledAppPage;
