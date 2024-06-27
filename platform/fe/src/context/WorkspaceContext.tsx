import React, { FC, createContext, useContext, PropsWithChildren } from "react";

import { initUser, User, UserProvider } from "./UserContext";
import { initSystem, System } from "./system";
import { initApps, Apps } from "./app";
import { ModalProvider } from "./ModelContext";
import { FilesMenuTreeProvider } from "./FilesMenuTreeContext";
import { AppRouterContextProvider } from "./AppRouterContext";

class Workspace {
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

interface WorkspaceContextValue {
  system: Workspace["system"];
  apps: Workspace["apps"]
  getUserSystemConfig: Workspace["getUserSystemConfig"];
}

const WorkspaceContext = createContext<WorkspaceContextValue>({} as WorkspaceContextValue);

interface WorkspaceContextProviderProps extends PropsWithChildren {
  value: Workspace;
}

const AppContextProvider: FC<WorkspaceContextProviderProps> = ({ value, children }) => {
  const { user, system, apps, getUserSystemConfig } = value;
  return (
    <WorkspaceContext.Provider value={{ apps, system, getUserSystemConfig: getUserSystemConfig.bind(value) }}>
      <ModalProvider>
        <UserProvider value={user}>
          <AppRouterContextProvider>
            <FilesMenuTreeProvider>
              {children}
            </FilesMenuTreeProvider>
          </AppRouterContextProvider>
        </UserProvider>
      </ModalProvider>
    </WorkspaceContext.Provider>
  )
};

const useWorkspaceConetxt = () => {
  return useContext(WorkspaceContext);
}

/** 数据初始化 */
const initContext = async () => {
  console.log("开始初始化信息")

  const [user, system, apps] = await Promise.all([
    initUser(),
    initSystem(),
    initApps()
  ]);

  console.log("用户信息: ", user);
  console.log("系统信息: ", system);
  console.log('安装应用: ', apps)

  return new Workspace({ user, system, apps });
}

export {
  WorkspaceContextValue,
  AppContextProvider,
  initContext,
  useWorkspaceConetxt,
};
