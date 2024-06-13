import axios from "axios";

export interface System {
  appBlackList: string;
  closeOfflineUpdate: string;
  createBasedOnTemplate?: string[];
  isPureIntranet: boolean;
  openLogout: boolean;
  openSystemWhiteList: boolean;
  openUserInfoSetting: boolean;
  title?: string;
  favicon?: string;
  logo?: string;
  authConfig?: string;
}

export function initSystem(): Promise<System> {
  return new Promise(async (resolve) => {
    const system = (await axios.post('/paas/api/config/get', {
      scope: ["system"]
    })).data.data.system.config as System;
    const { title, favicon } = system;

    if (title) {
      document.title = title;
    }
    if (favicon) {
      document.querySelector('#favicon').setAttribute('href', favicon)
    }

    resolve(system)
  })
}
