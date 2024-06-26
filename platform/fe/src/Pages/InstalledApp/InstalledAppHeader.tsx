import React, { FC } from "react";

import { Navbar } from "@/components";
import { InstalledApp } from "@/types";

const InstalledAppHeader: FC<InstalledApp> = (app) => {
  return (
    <Navbar.Section
      value={"app"}
      options={[{label: app.title, value: "app"}]}
    />
  )
}

export default InstalledAppHeader;
