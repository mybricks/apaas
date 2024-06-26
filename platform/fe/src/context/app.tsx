import React, { ReactNode } from "react";
import axios from "axios";

import { Folder } from "@/components/icon";

export type GetAppFunction = (key: string) => InstalledApp;

export interface Apps {
  /** 侧边栏应用 */
  menuApps: InstalledApps;
  /** 所有已安装应用 */
  installedApps: InstalledApps;
  /** 设计应用 */
  designApps: InstalledApps;
  /** 文件夹 */
  folderApps: InstalledApps;

  getApp: GetAppFunction;
}

export interface InstalledApp {
  title: string;
  version: string;
  extName?: string;
  namespace: string;
  description?: string;
  exports?: {
    name: string;
    path: string
  }[];
  homepage?: string;
  _hasPage?: boolean;
  icon: string | ReactNode;
  groupSetting?: string;
};

export type InstalledApps = InstalledApp[];

export function initApps(): Promise<Apps> {
  return new Promise(async (resolve) => {
    const apps = (await axios.get("/paas/api/apps/getInstalledList")).data.data as InstalledApps;
    const folderApps: InstalledApps = [
      {
        title: "文件夹",
        version: "1.0.0",
        description: "文件夹",
        extName: "folder",
        namespace: "mybricks-folder",
        icon: <Folder />,
      },
    ];
    const menuApps: InstalledApps = [];
    const designApps: InstalledApps = [];
    const appMap: {[key: string]: InstalledApp} = {};

    folderApps.forEach((app) => {
      const { extName, namespace } = app;
      appMap[namespace] = app;
      appMap[extName] = app;
    })
    menuApps.forEach((app) => {
      const { extName, namespace } = app;
      appMap[namespace] = app;
      appMap[extName] = app;
    })
    apps.forEach((app) => {
      const { extName, namespace } = app;

      if (namespace === "mybricks-material") {
        menuApps.push(app);
      } else {
        if(app._hasPage) {
          designApps.push(app);
        }
      }

      appMap[namespace] = app;
      appMap[extName] = app;
    })

    

    resolve({
      menuApps,
      installedApps: apps,
      designApps,
      folderApps,
      getApp(key: string) {
        return appMap[key];
      }
    });
  })
}
