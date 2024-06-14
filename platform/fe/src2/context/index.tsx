import React, { FC, createContext, useContext, PropsWithChildren } from "react";

import { initUser, User, UserProvider, useUserContext } from "./user";
import { initSystem, System } from "./system";
import { initApps, Apps } from "./app";
import { LocationProvider, useLocationConetxt } from "./location";
import { ModalProvider, useModalConetxt} from "./model";

export { useLocationConetxt, useUserContext, useModalConetxt };

export class App {
  user: User;
  system: System;
  apps: Apps;

  constructor({ user, system, apps }: { user: User, system: System, apps: Apps }) {
    this.user = user;
    this.system = system;
    this.apps = apps;
  }

  /** 获取当前用户系统配置 */
  getUserSystemConfig(): {
    createFileCount?: {
      [key: string]: number;
    }
  } {
    let config = {};
    const sysConfigObj = JSON.parse(this.system.authConfig || '{}');
    const roleConfig = sysConfigObj[this.user.role];
    if (roleConfig) {
      config = roleConfig;
    }
    return config;
  }
}

interface AppContext {
  system: App["system"];
  apps: App["apps"]
  getUserSystemConfig: App["getUserSystemConfig"];
}

const appContext = createContext<AppContext>({} as AppContext);

interface AppContextProviderProps extends PropsWithChildren {
  value: App;
}

export const AppContextProvider: FC<AppContextProviderProps> = ({ value, children }) => {
  console.log("AppContextProvider 接受 value: ", value)
  const { user, system, apps, getUserSystemConfig } = value;
  return (
    <appContext.Provider value={{ apps, system, getUserSystemConfig: getUserSystemConfig.bind(value) }}>
      <ModalProvider>
        <UserProvider value={user}>
          <LocationProvider>
            {children}
          </LocationProvider>
        </UserProvider>
      </ModalProvider>
    </appContext.Provider>
  )
};

export const useAppConetxt = () => {
  return useContext(appContext);
}

/** 数据初始化 */
export async function initContext() {
  console.log("开始初始化信息")

  const [user, system, apps] = await Promise.all([
    initUser(),
    initSystem(),
    initApps()
  ]);

  console.log("用户信息: ", user);
  console.log("系统信息: ", system);
  console.log('安装应用: ', apps)

  return new App({ user, system, apps });
}
